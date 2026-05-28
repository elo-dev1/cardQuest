import { createClient } from '@supabase/supabase-js';
import { UPGRADE_COSTS } from '../src/shared/data/cardData';

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
  return { user, client };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = await getUserFromRequest(req);
  if (!auth) return res.status(401).json({ error: 'Unauthorized' });
  const { user, client: supabase } = auth;

  const { cardId, memberId, familyId } = req.body;
  if (!cardId || !memberId || !familyId) {
    return res.status(400).json({ error: 'Missing required fields: cardId, memberId, or familyId' });
  }

  try {
    // 1. Verify user is member/owner of family
    const { data: member } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .eq('family_id', familyId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!member) return res.status(403).json({ error: 'Unauthorized' });

    // 2. Check guild level
    const { data: family } = await supabase.from('families').select('*').eq('id', familyId).single();
    if ((family?.guild_level ?? 1) < 5) return res.status(400).json({ error: 'guild_level' });

    // 3. Check card exists and stars
    const { data: cardItem } = await supabase
      .from('member_collections')
      .select('*')
      .eq('member_id', memberId)
      .eq('card_id', cardId)
      .maybeSingle();

    if (!cardItem) return res.status(400).json({ error: 'no_card' });
    if (cardItem.stars >= 3) return res.status(400).json({ error: 'max_level' });

    const nextStars = cardItem.stars + 1;
    const cost = UPGRADE_COSTS[nextStars];
    if (!cost) return res.status(400).json({ error: 'max_level' });

    // 4. Check requirements
    if (cardItem.count < cost.required) return res.status(400).json({ error: 'not_enough_copies' });
    if ((family?.coins ?? 0) < cost.costCoins) return res.status(400).json({ error: 'not_enough_coins' });

    // 5. Atomic Update
    // Since we have multiple tables, we use a transaction (via RPC)
    const { data: result, error: rpcError } = await supabase.rpc('upgrade_card_rpc', {
      p_member_id: memberId,
      p_family_id: familyId,
      p_card_id: cardId,
      p_required_copies: cost.required,
      p_cost_coins: cost.costCoins,
      p_next_stars: nextStars,
    });

    if (rpcError) throw rpcError;

    return res.json({ ok: true, stars: nextStars });

  } catch (error) {
    console.error('upgrade-card error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
