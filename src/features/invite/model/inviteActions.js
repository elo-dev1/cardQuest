import { v4 as uuidv4 } from 'uuid';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';

const LOCAL_INVITES_KEY = 'card-quest-local-invitations';
const LOCAL_STATE_KEY = 'card-quest-state-v1';

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

const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

const makeExpiresAt = (days = 7) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const makeJoinUrl = (code) => `${window.location.origin}/join/${code}`;

const createLocalInvite = ({ familyId, familyName, createdBy, maxUses = 1, days = 7 }) => {
  const invites = readJson(LOCAL_INVITES_KEY, []);
  let code = makeCode();
  while (invites.some((invite) => invite.code === code)) code = makeCode();

  const invite = {
    id: uuidv4(),
    family_id: familyId,
    familyName,
    code,
    created_by: createdBy,
    used_by: null,
    used_at: null,
    expires_at: makeExpiresAt(days),
    max_uses: maxUses,
    uses_count: 0,
    is_active: true,
    created_at: new Date().toISOString(),
  };
  writeJson(LOCAL_INVITES_KEY, [invite, ...invites]);
  return invite;
};

export const generateInviteCode = async (familyId, createdBy, options = {}) => {
  if (!isSupabaseConfigured) {
    const state = readJson(LOCAL_STATE_KEY, {});
    return createLocalInvite({
      familyId,
      familyName: state.family?.name ?? 'Семейная гильдия',
      createdBy,
      maxUses: options.maxUses ?? 1,
      days: options.days ?? 7,
    }).code;
  }

  let code;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: rpcCode, error: rpcError } = await supabase.rpc('generate_invite_code');
    if (rpcError) console.warn('generate_invite_code rpc failed:', rpcError.message);
    code = rpcCode || makeCode();

    const { error: insertError } = await supabase.from('invitations').insert({
      family_id: familyId,
      code,
      created_by: createdBy,
      max_uses: options.maxUses ?? 1,
      expires_at: makeExpiresAt(options.days ?? 7),
    });

    if (!insertError) return code;
    if (insertError.code === '23505') continue;
    throw insertError;
  }

  throw new Error('Не удалось сгенерировать уникальный код приглашения после 3 попыток');
};

export const generateMultiInviteCode = async (familyId, createdBy, maxUses = 5) =>
  generateInviteCode(familyId, createdBy, { maxUses });

export const checkInviteCode = async (code) => {
  const normalizedCode = code.trim().toUpperCase();

  if (!isSupabaseConfigured) {
    const invite = readJson(LOCAL_INVITES_KEY, []).find((item) => item.code === normalizedCode);
    if (!invite || !invite.is_active || new Date(invite.expires_at) <= new Date()) {
      return { valid: false, error: 'Код недействителен или истёк' };
    }
    if (invite.uses_count >= invite.max_uses) {
      return { valid: false, error: 'Код уже использован' };
    }
    return {
      valid: true,
      familyName: invite.familyName,
      familyId: invite.family_id,
      invitation: invite,
      joinUrl: makeJoinUrl(invite.code),
    };
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*, families(name)')
    .eq('code', normalizedCode)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (error || !data) return { valid: false, error: 'Код недействителен или истёк' };
  if (data.uses_count >= data.max_uses) return { valid: false, error: 'Код уже использован' };

  return {
    valid: true,
    familyName: data.families?.name ?? 'Семейная гильдия',
    familyId: data.family_id,
    invitation: data,
    joinUrl: makeJoinUrl(data.code),
  };
};

export const acceptInvitation = async ({ code, userId, name, avatar, heroClass }) => {
  const normalizedCode = code.trim().toUpperCase();

  if (!isSupabaseConfigured) {
    const invites = readJson(LOCAL_INVITES_KEY, []);
    const invite = invites.find((item) => item.code === normalizedCode);
    if (!invite || !invite.is_active || new Date(invite.expires_at) <= new Date()) {
      throw new Error('Приглашение недействительно или истекло');
    }
    if (invite.uses_count >= invite.max_uses) throw new Error('Код уже использован');

    const state = readJson(LOCAL_STATE_KEY, null);
    if (!state?.family || state.family.id !== invite.family_id) {
      throw new Error('В локальном режиме принять можно приглашение текущей гильдии в этом браузере');
    }
    if (state.members?.some((member) => member.user_id === userId)) {
      throw new Error('Вы уже состоите в этой гильдии');
    }

    const member = {
      id: uuidv4(),
      family_id: invite.family_id,
      user_id: userId,
      name: name.trim(),
      role: 'parent',
      member_role: 'parent',
      avatar,
      hero_class: heroClass,
      classId: heroClass,
      xp: 0,
      coins: 0,
      level: 1,
      total_tasks: 0,
      created_at: new Date().toISOString(),
    };

    writeJson(LOCAL_STATE_KEY, {
      ...state,
      members: [...(state.members ?? []), member],
    });
    writeJson(
      LOCAL_INVITES_KEY,
      invites.map((item) =>
        item.id === invite.id
          ? {
              ...item,
              used_by: userId,
              used_at: new Date().toISOString(),
              uses_count: item.uses_count + 1,
              is_active: item.uses_count + 1 < item.max_uses,
            }
          : item,
      ),
    );
    return member;
  }

  const { data, error } = await supabase.rpc('accept_invitation', {
    p_code: normalizedCode,
    p_user_id: userId,
    p_name: name.trim(),
    p_avatar: avatar,
    p_hero_class: heroClass,
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.member;
};

export const getFamilyInvitations = async (familyId) => {
  if (!familyId) return [];

  if (!isSupabaseConfigured) {
    return readJson(LOCAL_INVITES_KEY, [])
      .filter((invite) => invite.family_id === familyId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const revokeInvitation = async (invitationId) => {
  if (!isSupabaseConfigured) {
    const invites = readJson(LOCAL_INVITES_KEY, []);
    writeJson(
      LOCAL_INVITES_KEY,
      invites.map((invite) => (invite.id === invitationId ? { ...invite, is_active: false } : invite)),
    );
    return;
  }

  const { error } = await supabase.from('invitations').update({ is_active: false }).eq('id', invitationId);
  if (error) throw error;
};

export const getInviteUrl = (code) => makeJoinUrl(code);
