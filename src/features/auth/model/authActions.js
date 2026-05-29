import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';

const LOCAL_AUTH_KEY = 'card-quest-local-auth-user';
const LOCAL_USERS_KEY = 'card-quest-local-auth-users';
export const LOCAL_AUTH_EVENT = 'card-quest-local-auth-change';

const getAppUrl = () => import.meta.env.VITE_APP_URL || window.location.origin;

const readJson = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    return JSON.parse(window.localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const isHashed = (str) => /^[a-f0-9]{64}$/.test(str);

const notifyLocalAuth = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(LOCAL_AUTH_EVENT));
};

export const getLocalAuthUser = () => readJson(LOCAL_AUTH_KEY, null);

const setLocalAuthUser = (user) => {
  writeJson(LOCAL_AUTH_KEY, user);
  notifyLocalAuth();
};

export const authActions = {
  signUp: async ({ email, password, displayName }) => {
    if (!isSupabaseConfigured) {
      const users = readJson(LOCAL_USERS_KEY, []);
      if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Пользователь с таким email уже есть в локальном демо-режиме');
      }
      const hashed = await hashPassword(password);
      const user = {
        id: uuidv4(),
        email,
        password: hashed,
        displayName,
        createdAt: new Date().toISOString(),
      };
      writeJson(LOCAL_USERS_KEY, [...users, user]);
      setLocalAuthUser(user);
      return { user, session: { user } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${getAppUrl()}/auth`,
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        id: data.user.id,
        display_name: displayName,
      });
      if (profileError) console.warn('user_profiles upsert failed:', profileError.message);
    }

    return data;
  },

  signIn: async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      const users = readJson(LOCAL_USERS_KEY, []);
      const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
      if (!user) throw new Error('Локальный пользователь не найден. Создайте аккаунт на вкладке регистрации.');

      const storedPw = user.password;
      const inputHash = isHashed(storedPw) ? await hashPassword(password) : password;
      if (storedPw !== inputHash) throw new Error('Неверный пароль');

      if (!isHashed(storedPw)) {
        const hashed = await hashPassword(storedPw);
        user.password = hashed;
        const updated = users.map(u => u.id === user.id ? user : u);
        writeJson(LOCAL_USERS_KEY, updated);
      }

      setLocalAuthUser(user);
      return { user, session: { user } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured) return;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getAppUrl()}/reset-password`,
    });
    if (error) throw error;
  },

  signOut: async () => {
    if (!isSupabaseConfigured) {
      window.localStorage.removeItem(LOCAL_AUTH_KEY);
      notifyLocalAuth();
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) throw new Error('Google-вход доступен после настройки Supabase');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${getAppUrl()}/home` },
    });
    if (error) throw error;
  },
};
