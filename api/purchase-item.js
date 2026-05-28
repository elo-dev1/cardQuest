import { createClient } from '@supabase/supabase-js';
import { PACK_TYPES, EFFECT_TYPES, BACKGROUND_TYPES, BOOST_TYPES } from '@/shared/data/shopItems';

const createSupabaseClient = () => createClient(
  process.env.VITE_SUPABASE_URL, 
  process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const ALL_SHOP_ITEMS = {
  ...PACK_TYPES,
  ...EFFECT_TYPES,
  ...BACKGROUND_TYPES,
  ...BOOST_TYPES,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = createSupabaseClient();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

    const { familyId, itemId, itemType } = req.body;
    if (!familyId || !itemId || !itemType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const item = ALL_SHOP_ITEMS[itemId];
    if (!item) return res.status(404).json({ error: 'Item not found' });

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

    // Atomic purchase using RPC
    // This RPC should: 
    // 1. Check if family has enough coins
    // 2. Deduct coins
    // 3. Add item to owned list / set as active
    // 4. Return new coin balance
    const { data: newCoins, error: rpcError } = await client.rpc('purchase_shop_item', {
      p_family_id: familyId,
      p_item_id: itemId,
      p_item_type: itemType,
      p_price: item.price
    });

    if (rpcError) {
      if (rpcError.message.includes('insufficient')) {
        return res.status(400).json({ error: 'Insufficient coins' });
      }
      throw rpcError;
    }

    return res.status(200).json({ ok: true, newCoins });
  } catch (error) {
    console.error('purchaseItem error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
