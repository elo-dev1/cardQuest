import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:family@cardquest.app',
  process.env.VITE_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  const { action } = req.body;

  if (action === 'subscribe') {
    const { memberId, familyId, subscription } = req.body;
    const { error } = await supabase.from('push_subscriptions').upsert(
      { member_id: memberId, family_id: familyId, endpoint: subscription.endpoint, keys: subscription.keys },
      { onConflict: 'member_id' }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  if (action === 'unsubscribe') {
    const { memberId } = req.body;
    await supabase.from('push_subscriptions').delete().eq('member_id', memberId);
    return res.json({ ok: true });
  }

  if (action === 'notify') {
    const { familyId, rewardName, buyerName, excludeMemberId } = req.body;

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('family_id', familyId)
      .neq('member_id', excludeMemberId);

    const payload = JSON.stringify({
      title: '🎁 Куплена награда!',
      body: `${buyerName} купил(а) «${rewardName}»`,
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
