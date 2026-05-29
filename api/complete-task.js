import { createClient } from '@supabase/supabase-js';
import { handleCors } from './_shared/cors.js';
import { getRewardForTask } from './_shared/rewardLogic.js';
import { calculateBossDamage } from './_shared/bossLogic.js';

function getWeekStartKey() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function createSupabaseClient(token) {
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY);
  if (token) {
    client.auth.setSession({ access_token: token, refresh_token: '' });
  }
  return client;
}

async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const client = createSupabaseClient(token);
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return { user, token, client };
}

export default async function handler(req, res) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getUserFromRequest(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { user, client: supabase } = auth;
  const { taskId, memberId, familyId } = req.body;
  if (!taskId || !memberId || !familyId) {
    return res.status(400).json({ error: 'Missing required fields: taskId, memberId, or familyId' });
  }
  const date = new Date().toISOString().split('T')[0];
  const weekStartKey = getWeekStartKey();

  try {
    // 1. Verify user is a member of the family
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !member) return res.status(403).json({ error: 'You cannot complete tasks for other members' });

    // 2. Atomic check and insert completion
    const { data: canComplete, error: completionError } = await supabase.rpc('attempt_complete_task', {
      p_task_id: taskId,
      p_member_id: memberId,
      p_date: date,
    });

    if (completionError) throw completionError;
    if (!canComplete) return res.status(400).json({ error: 'Task already completed today', alreadyDone: true });

    // 3. Fetch data for calculations
    const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
    const { data: family } = await supabase.from('families').select('*').eq('id', familyId).single();
    const { data: bossWeek } = await supabase.from('boss_weeks').select('*').eq('family_id', familyId).eq('week_start', weekStartKey).maybeSingle();
    const { data: deck } = await supabase.from('battle_deck').select('card_id').eq('member_id', memberId).order('slot');

    // 4. Calculate multipliers (Boosts)
    const boosts = family?.active_boosts || [];
    const boostExpiresAt = family?.boost_expires_at || {};
    const now = Date.now();
    
    const getMultiplier = (type) => {
      let mult = 1;
      if (!boosts || !boostExpiresAt) return mult;
      for (const bid of boosts) {
        if (boostExpiresAt[bid] && boostExpiresAt[bid] > now && bid.includes(type)) mult *= 2;
      }
      return mult;
    };

    const storeMock = {
      getBoostMultiplier: getMultiplier,
      boss: { weakness: bossWeek?.boss_weakness },
      members: [member],
      completions: [], // We only need to know if others are active, but that's complex for a single RPC
    };

    // 5. Calculate Reward and Damage
    const reward = getRewardForTask(task, member, storeMock);
    const { damage, isCrit } = calculateBossDamage(task, member, storeMock, memberId, storeMock);

    // 6. Atomic updates (grouped)
    let newHp = null;
    try {
      const results = await Promise.all([
        supabase.rpc('increment_member_stats', {
          m_id: memberId,
          xp_gain: reward.xp,
          total_tasks_gain: 1,
        }),
        supabase.rpc('increment_family_coins', {
          f_id: familyId,
          amount: reward.coins,
        }),
        bossWeek ? supabase.rpc('decrement_boss_hp', {
          boss_week_id: bossWeek.id,
          damage: damage,
        }) : Promise.resolve({ data: null }),
      ]);
      
      if (bossWeek) {
        newHp = results[2].data;
      }
    } catch (err) {
      console.error('failed to update stats:', err);
      throw err;
    }

    if (bossWeek) {
      // Insert log
      const logText = isCrit 
        ? `💥 ${member.name} нанёс КРИТ! → ${damage} урона!` 
        : `⚔️ ${member.name} выполнил «${task.title}» → ${damage} урона`;
      
      await supabase.from('boss_logs').insert({
        boss_week_id: bossWeek.id,
        member_id: memberId,
        log_type: isCrit ? 'crit' : 'damage',
        log_text: logText,
        damage_amount: damage,
      });
    }

    // 7. Award record
    await supabase.from('rewards_awarded').insert({
      task_id: taskId,
      member_id: memberId,
      date,
      xp_given: reward.xp,
      coins_given: reward.coins,
    });

    return res.json({
      ok: true,
      reward,
      damage,
      isCrit,
      newHp,
    });

  } catch (error) {
    console.error('complete-task error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
