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

    const { familyId, amount } = req.body;
    if (!familyId || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // Verify user belongs to the family
    const { data: member, error: memberError } = await client
      .from('members')
      .select('id')
      .eq('user_id', user.id)
      .eq('family_id', familyId)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Unauthorized family access' });
    }

    // Atomic decrement using RPC
    const { data, error: rpcError } = await client.rpc('decrement_family_coins', {
      p_family_id: familyId,
      p_amount: amount
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient')) {
        return res.status(400).json({ error: 'Insufficient coins' });
      }
      throw rpcError;
    }

    return res.status(200).json({ ok: true, newCoins: data });
  } catch (error) {
    console.error('spendCoins error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
