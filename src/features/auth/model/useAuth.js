import { useEffect, useState } from 'react';
import { getLocalAuthUser, LOCAL_AUTH_EVENT } from '@/features/auth/model/authActions';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';

const toAuthUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email ?? '',
        displayName: user.user_metadata?.display_name ?? user.displayName ?? user.email?.split('@')[0] ?? 'Герой',
      }
    : null;

export const useAuth = () => {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const syncLocalUser = () => {
        setAuthUser(toAuthUser(getLocalAuthUser()));
        setLoading(false);
      };

      syncLocalUser();
      window.addEventListener(LOCAL_AUTH_EVENT, syncLocalUser);
      return () => window.removeEventListener(LOCAL_AUTH_EVENT, syncLocalUser);
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setAuthUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setAuthUser(toAuthUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    authUser,
    userId: authUser?.id ?? null,
    displayName: authUser?.displayName ?? '',
    loading,
    isSupabaseConfigured,
  };
};
