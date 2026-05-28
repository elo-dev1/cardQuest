import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';

let deferredPrompt = null;
let pushSubscriptionInProgress = false;

export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showUpdatePrompt();
              }
            });
          });
        })
        .catch((error) => {
          console.log('SW registration failed:', error);
        });
    });
  }
}

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new CustomEvent('pwa-install-ready'));
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return outcome === 'accepted';
}

export function isInstallable() {
  return deferredPrompt !== null;
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function showUpdatePrompt() {
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
}

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush(memberId, familyId) {
  if (!VAPID_PUBLIC_KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
  if (pushSubscriptionInProgress) return;
  pushSubscriptionInProgress = true;

  try {
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      pushSubscriptionInProgress = false;
      return subscription;
    }

    if (Notification.permission === 'denied') {
      pushSubscriptionInProgress = false;
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        pushSubscriptionInProgress = false;
        return;
      }
    }

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const headers = { 'Content-Type': 'application/json' };
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    await fetch('/api/notify-reward', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'subscribe',
        memberId,
        familyId,
        subscription: subscription.toJSON(),
      }),
    });

    return subscription;
  } catch (err) {
    console.error('Push subscription failed:', err);
  } finally {
    pushSubscriptionInProgress = false;
  }
}

export async function unsubscribeFromPush(memberId) {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    const headers = { 'Content-Type': 'application/json' };
    if (isSupabaseConfigured && supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    await fetch('/api/notify-reward', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'unsubscribe', memberId }),
    });
  } catch (err) {
    console.error('Push unsubscribe failed:', err);
  }
}
