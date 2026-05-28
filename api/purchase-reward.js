import { createClient } from '@supabase/supabase-js';

const createSupabaseClient = () => createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = createSupabaseClient();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { familyId, rewardId, buyerId, price } = req.body;
    if (!familyId || !rewardId || !buyerId || typeof price !== 'number') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify user belongs to the family and is the buyer
    const { data: member, error: memberError } = await client
      .from('members')
      .select('id, role')
      .eq('id', buyerId)
      .eq('family_id', familyId)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Unauthorized: member not found in this family' });
    }

    const rewardRecord = {
      family_id: familyId,
      reward_id: rewardId,
      purchased_by: buyerId,
      status: 'purchased',
      purchased_at: new Date().toISOString(),
    };

    if (price < 0) {
      // Earn reward: add coins to family
      const earned = Math.abs(price);
      const { data: coinsResult, error: rpcError } = await client.rpc('increment_family_coins', {
        p_family_id: familyId,
        p_amount: earned,
      });
      if (rpcError) throw rpcError;

      const { error: insertError } = await client
        .from('purchased_rewards')
        .insert(rewardRecord);
      if (insertError) throw insertError;

      return res.status(200).json({ ok: true, newCoins: coinsResult, earned });
    }

    if (price === 0) {
      // Free reward
      const { error: insertError } = await client
        .from('purchased_rewards')
        .insert(rewardRecord);
      if (insertError) throw insertError;

      return res.status(200).json({ ok: true, free: true });
    }

    // Purchase reward: spend coins
    const { data: coinsResult, error: rpcError } = await client.rpc('decrement_family_coins', {
      p_family_id: familyId,
      p_amount: price,
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient')) {
        return res.status(400).json({ error: 'Insufficient coins' });
      }
      throw rpcError;
    }

    const { error: insertError } = await client
      .from('purchased_rewards')
      .insert(rewardRecord);
    if (insertError) throw insertError;

    return res.status(200).json({ ok: true, newCoins: coinsResult, spent: price });
  } catch (error) {
    console.error('purchaseReward error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
