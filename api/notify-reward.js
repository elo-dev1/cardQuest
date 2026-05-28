import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { REAL_REWARDS } from '../src/shared/data/realRewards';

webpush.setVapidDetails(
  'mailto:family@cardquest.app',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
  return { supabase: client, user };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  if (action === 'subscribe') {
    const auth = await getUserFromRequest(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { memberId, familyId, subscription } = req.body;
    if (!memberId || !familyId || !subscription?.endpoint || !subscription?.keys) {
      return res.status(400).json({ error: 'Missing fields: memberId, familyId, or subscription details' });
    }

    const { data: member, error: memberError } = await auth.supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Member does not belong to you' });
    }

    const { error: upsertError } = await auth.supabase.from('push_subscriptions').upsert(
      { member_id: memberId, family_id: familyId, endpoint: subscription.endpoint, keys: subscription.keys },
      { onConflict: 'member_id' }
    );
    if (upsertError) return res.status(500).json({ error: 'Failed to subscribe' });
    return res.json({ ok: true });
  }

  if (action === 'unsubscribe') {
    const auth = await getUserFromRequest(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { memberId } = req.body;
    if (!memberId) return res.status(400).json({ error: 'Missing memberId' });

    const { data: member, error: memberError } = await auth.supabase
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'Member does not belong to you' });
    }

    await auth.supabase.from('push_subscriptions').delete().eq('member_id', memberId);
    return res.json({ ok: true });
  }

  if (action === 'notify') {
    const auth = await getUserFromRequest(req);
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });

    const { familyId, rewardId, buyerId, excludeMemberId } = req.body;
    if (!familyId || !rewardId || !buyerId) return res.status(400).json({ error: 'Missing familyId, rewardId, or buyerId' });

    const { data: member, error: memberError } = await auth.supabase
      .from('members')
      .select('id')
      .eq('family_id', familyId)
      .eq('user_id', auth.user.id)
      .maybeSingle();

    if (memberError || !member) {
      return res.status(403).json({ error: 'You are not a member of this family' });
    }

    const { data: buyer, error: buyerError } = await auth.supabase
      .from('members')
      .select('name, family_id')
      .eq('id', buyerId)
      .single();

    if (buyerError || !buyer || buyer.family_id !== familyId) {
      return res.status(403).json({ error: 'Buyer not found in this family' });
    }

    const reward = REAL_REWARDS.find(r => r.id === rewardId);
    if (!reward || !buyer) return res.status(400).json({ error: 'Invalid reward or buyer' });

    const { data: subscriptions } = await auth.supabase
      .from('push_subscriptions')
      .select('*')
      .eq('family_id', familyId)
      .neq('member_id', excludeMemberId);

    const payload = JSON.stringify({
      title: '🎁 Куплена награда!',
      body: `${buyer.name} купил(а) «${reward.name}»`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: '/shop' }
    });

    const results = await Promise.allSettled(
      (subscriptions || []).map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        ).catch(err => console.error('Push send error:', err))
      )
    );

    return res.json({
      ok: true,
      sent: results.filter(r => r.status === 'fulfilled').length
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
