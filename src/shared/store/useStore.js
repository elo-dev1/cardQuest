import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TASK_TEMPLATES } from '@/shared/data/taskTemplates';
import { STARTER_CARDS, UPGRADE_COSTS, CARD_LIBRARY } from '@/shared/data/cardData';
import { todayKey, lastDays, getWeekStartKey, getWeekEndKey } from '@/shared/lib/date';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';
import { generateInviteCode } from '@/features/invite/model/inviteActions';
import { getActiveSynergies } from '@/shared/data/synergies';

import { normalizeFamily, getStreakCalc } from '@/entities/family/model/familyLogic';
import { normalizeMember } from '@/entities/member/model/memberLogic';
import { normalizeMemberCollections, normalizeCollectionItem } from '@/entities/collection/model/collectionLogic';
import { normalizeExchange } from '@/entities/exchange/model/exchangeLogic';
import { normalizeTask } from '@/shared/logic/taskLogic';
import { normalizeCompletion } from '@/shared/logic/completionLogic';
import { normalizeReward, getRewardForTask } from '@/shared/logic/rewardLogic';
import { defaultBoss, normalizeBoss, calculateBossDamage, getBossDeckForMember, DIFFICULTY_DAMAGE } from '@/shared/logic/bossLogic';
import { REAL_REWARDS, REWARD_CATEGORIES } from '@/shared/data/realRewards';

const STORAGE_KEY = 'card-quest-state-v1';
const CURRENT_MEMBER_KEY = 'card-quest-current-member-id';

const TOAST_DURATION = {
  damage: 2000,
  crit: 3000,
  boss_attack: 3000,
  boss_phase: 4000,
  victory: 4000,
};

const baseState = {
  authUserId: null,
  family: null,
  members: [],
  tasks: [],
  completions: [],
  rewardsAwarded: [],
  memberCollections: {},
  currentCollectionMember: null,
  exchanges: [],
  currentMemberId: null,
  isSetupDone: false,
  isLoading: false,
  toasts: [],
  boss: defaultBoss,
  bossDeck: [],
  guildPoints: 100,
  theme: 'dark',
  purchasedRewards: [],
  lastTaskCompletedAt: null,
  lastBossIdleAttackAt: null,
  defeatedBosses: [],
};

const canUseStorage = () => typeof window !== 'undefined' && window.localStorage;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const deriveLastTaskCompleted = (completions) => {
  const timestamps = completions
    .filter((c) => c.completed_at)
    .map((c) => new Date(c.completed_at).getTime())
    .filter((t) => !isNaN(t));
  if (timestamps.length) return Math.max(...timestamps);

  return completions.length > 0 ? Date.now() : null;
};

const normalizeState = (state) => {
  const members = safeArray(state.members).map(normalizeMember);
  let memberCollections = state.memberCollections || {};
  
  if (!Object.keys(memberCollections).length && state.collection) {
    memberCollections = { default: safeArray(state.collection).map(normalizeCollectionItem) };
  }
  
  const normalizedCollections = {};
  if (Object.keys(memberCollections).length > 0) {
    Object.keys(memberCollections).forEach((memberId) => {
      normalizedCollections[memberId] = safeArray(memberCollections[memberId]).map(normalizeCollectionItem);
    });
  }
  
  return {
    ...baseState,
    ...state,
    family: normalizeFamily(state.family),
    members,
    tasks: safeArray(state.tasks).map(normalizeTask),
    completions: safeArray(state.completions).map(normalizeCompletion),
    rewardsAwarded: safeArray(state.rewardsAwarded).map(normalizeReward),
    memberCollections: normalizedCollections,
    exchanges: safeArray(state.exchanges).map(normalizeExchange),
    boss: { ...defaultBoss, ...(state.boss || {}) },
    bossDeck: state.bossDeck || [],
    guildPoints: state.guildPoints ?? 100,
    purchasedRewards: safeArray(state.purchasedRewards),
    lastTaskCompletedAt: state.lastTaskCompletedAt ?? deriveLastTaskCompleted(safeArray(state.completions)),
    lastBossIdleAttackAt: state.lastBossIdleAttackAt ?? null,
    toasts: [],
    isLoading: false,
    isSetupDone: Boolean(state.family),
  };
};



const PRUNE_DAYS = 30;
const isOld = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return Date.now() - d.getTime() > PRUNE_DAYS * 86400000;
};

const loadState = () => {
  if (!canUseStorage()) return baseState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;
    const parsed = JSON.parse(raw);
    if (parsed.defeatedBosses) {
      parsed.defeatedBosses = parsed.defeatedBosses.filter((b) => !isOld(b.defeatedAt ?? b.week_start));
    }
    if (parsed.purchasedRewards) {
      parsed.purchasedRewards = parsed.purchasedRewards.filter((r) => !isOld(r.purchasedAt));
    }
    return normalizeState(parsed);
  } catch (e) {
    console.warn('[useStore] Не удалось прочитать сохранённое состояние из localStorage. Возможно, данные повреждены.', e);
    return baseState;
  }
};

const saveState = (state) => {
  if (!canUseStorage()) return;
  const { toasts, isLoading, ...persisted } = state;
  if (isSupabaseConfigured) {
    delete persisted.completions;
    delete persisted.rewardsAwarded;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch (e) {
    console.warn('[useStore] Failed to save state to localStorage. Storage may be full.', e);
    try {
      const old = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      const { defeatedBosses, purchasedRewards, ...compact } = old;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...compact, ...persisted }));
    } catch (e2) {
      console.warn('[useStore] Storage still full after compaction.', e2);
    }
  }
};

const makeTasks = (familyId = null, createdBy = null) =>
  TASK_TEMPLATES.map((task, index) =>
    normalizeTask({
      ...task,
      id: familyId ? undefined : `task-${index + 1}`,
      family_id: familyId,
      created_by: createdBy,
      sort_order: index,
      created_at: new Date().toISOString(),
    }),
  );

const xpToLevel = (xp = 0) => Math.max(1, Math.floor(xp / 120) + 1);
const guildXpToLevel = (xp = 0) => Math.max(1, Math.floor(xp / 500) + 1);

const completionMatches = (item, taskId, memberId, date) =>
  (item.taskId ?? item.task_id) === taskId && (item.memberId ?? item.member_id) === memberId && item.date === date;

const completedOnDate = (completions, taskId, memberId, date = todayKey()) =>
  completions.some((item) => completionMatches(item, taskId, memberId, date));

const awardedOnDate = (awards, taskId, memberId, date = todayKey()) =>
  awards.some((item) => completionMatches(item, taskId, memberId, date));

const commit = (set, get, updater) => {
  set(updater);
  saveState(get());
};

const runRemote = (promise, get, label = 'Supabase sync') => {
  if (!promise) return;
  promise.catch((error) => {
    console.error(`${label}:`, error);
    get().addToast?.('Данные сохранены локально, но Supabase не ответил.', 'error');
  });
};

const familyPatchToDb = (patch) => {
  const dbPatch = { ...patch };
  if ('ownedEffects' in dbPatch) {
    dbPatch.owned_effects = dbPatch.ownedEffects;
    delete dbPatch.ownedEffects;
  }
  if ('activeEffect' in dbPatch) {
    dbPatch.active_effect = dbPatch.activeEffect;
    delete dbPatch.activeEffect;
  }
  if ('ownedBackgrounds' in dbPatch) {
    dbPatch.owned_backgrounds = dbPatch.ownedBackgrounds;
    delete dbPatch.ownedBackgrounds;
  }
  if ('activeBackground' in dbPatch) {
    dbPatch.active_bg = dbPatch.activeBackground;
    delete dbPatch.activeBackground;
  }
  if ('ownedItems' in dbPatch) {
    dbPatch.owned_items = dbPatch.ownedItems;
    delete dbPatch.ownedItems;
  }
  if ('equippedItems' in dbPatch) {
    dbPatch.equipped_items = dbPatch.equippedItems;
    delete dbPatch.equippedItems;
  }
  delete dbPatch.dailyBonusClaimedAt;
  return dbPatch;
};

const memberToDb = (member) => ({
  family_id: member.family_id,
  user_id: member.user_id ?? null,
  name: member.name,
  role: member.role,
  member_role: member.member_role,
  avatar: member.avatar,
  hero_class: member.classId ?? member.hero_class,
  pin: member.pin || null,
  xp: member.xp ?? 0,
  level: member.level ?? 1,
  xp_next: member.xp_next ?? 120,
  total_tasks: member.total_tasks ?? 0,
});

const taskToDb = (task) => ({
  family_id: task.family_id,
  created_by: task.created_by ?? null,
  title: task.title,
  category: task.category,
  difficulty: task.difficulty,
  assigned_to: task.assigned_to ?? 'all',
  repeat_type: task.repeat_type ?? 'daily',
  is_active: task.is_active ?? true,
  sort_order: task.sort_order ?? 0,
});

export const useStore = create((set, get) => ({
  ...loadState(),

  loadAll: async (userId) => {
    set({ authUserId: userId, isLoading: true });

    if (!isSupabaseConfigured) {
      const localState = normalizeState({ ...loadState(), authUserId: userId });
      set({ ...localState, authUserId: userId, isLoading: false });
      return;
    }

    try {
      const { data: memberByUser, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (memberError) throw memberError;

      let family = null;
      if (memberByUser?.family_id) {
        const { data, error } = await supabase.from('families').select('*').eq('id', memberByUser.family_id).maybeSingle();
        if (error) throw error;
        family = data;
      }

      if (!family) {
        const { data, error } = await supabase.from('families').select('*').eq('owner_id', userId).maybeSingle();
        if (error) throw error;
        family = data;
      }

      if (!family) {
        const theme = get().theme;
        set({ ...baseState, authUserId: userId, theme, isLoading: true });
        return;
      }

      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: true });
      if (membersError) throw membersError;

      const currentMember = safeArray(membersData).find((member) => member.user_id === userId) ?? memberByUser;

      let { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (tasksError) throw tasksError;

      if (!tasksData?.length) {
        const defaults = makeTasks(family.id, currentMember?.id).map(taskToDb);
        const { data: insertedTasks, error: insertTasksError } = await supabase.from('tasks').insert(defaults).select('*');
        if (!insertTasksError) tasksData = insertedTasks;
      }

      const taskIds = safeArray(tasksData).map((task) => task.id);
      const weekStart = lastDays(7)[0];
      const { data: completionsData } = taskIds.length
        ? await supabase.from('completions').select('*').in('task_id', taskIds).gte('date', weekStart)
        : { data: [] };
      const { data: rewardsData } = taskIds.length
        ? await supabase.from('rewards_awarded').select('*').in('task_id', taskIds).eq('date', todayKey())
        : { data: [] };

      let { data: memberCollectionsData } = await supabase
        .from('member_collections')
        .select('*')
        .in('member_id', membersData.map(m => m.id));

      if (!memberCollectionsData?.length && membersData.length > 0) {
        const starterRows = [];
        membersData.forEach((member) => {
          STARTER_CARDS.forEach((card) => {
            starterRows.push({ member_id: member.id, card_id: card.id, count: 1, is_new: false });
          });
        });
        
        const { data: insertedCollections, error: mcError } = await supabase
          .from('member_collections')
          .insert(starterRows)
          .select('*');
        
        if (!mcError && insertedCollections) {
          memberCollectionsData = insertedCollections;
        } else if (mcError) {
          console.error('Failed to init member collections:', mcError);
        }
      }

      const currentWeekStart = getWeekStartKey();
      const currentWeekEnd = getWeekEndKey();

      let { data: bossWeek } = await supabase
        .from('boss_weeks')
        .select('*')
        .eq('family_id', family.id)
        .eq('week_start', currentWeekStart)
        .maybeSingle();

      if (!bossWeek) {
        await supabase
          .from('boss_weeks')
          .update({ is_active: false })
          .eq('family_id', family.id)
          .eq('is_active', true);

        const bossCfg = (await import('@/entities/boss/model/bossConfig')).getRandomBossConfig();
        const { data: newBw } = await supabase
          .from('boss_weeks')
          .insert({
            family_id: family.id,
            boss_name: bossCfg.name,
            boss_emoji: bossCfg.emoji,
            boss_subtitle: bossCfg.subtitle,
            boss_weakness: bossCfg.weakness,
            week_start: currentWeekStart,
            week_end: currentWeekEnd,
            boss_hp_max: bossCfg.hp,
            boss_hp_cur: bossCfg.hp,
            is_active: true,
            is_won: false,
            guild_points: 100,
          })
          .select('*')
          .maybeSingle();

        if (newBw) bossWeek = newBw;
      }

      const guildPoints = bossWeek?.guild_points ?? 100;

      const { data: defeatedBosses } = await supabase
        .from('boss_weeks')
        .select('*')
        .eq('family_id', family.id)
        .eq('is_won', true)
        .order('week_start', { ascending: false });

      const { data: bossDamage } = bossWeek
        ? await supabase.from('boss_damage').select('*').eq('boss_week_id', bossWeek.id)
        : { data: [] };

      const { data: bossLogs } = bossWeek
        ? await supabase
            .from('boss_logs')
            .select('*')
            .eq('boss_week_id', bossWeek.id)
            .order('created_at', { ascending: false })
            .limit(100)
        : { data: [] };

      const logsFromDb = safeArray(bossLogs).map((log) => ({
        id: log.id,
        text: log.log_text,
        type: log.log_type,
        at: new Date(log.created_at).getTime(),
        damage: log.damage_amount || 0,
      }));

      const savedLogs = logsFromDb.length > 0 ? logsFromDb : get().boss?.logs || [];

      const memberCollectionsMap = normalizeMemberCollections(memberCollectionsData || [], membersData);
      const selectedMember = membersData.find(m => m.user_id === userId) || membersData[0];

      const { data: battleDeckRows } = selectedMember
        ? await supabase
            .from('battle_deck')
            .select('slot, card_id, member_id')
            .eq('family_id', family.id)
            .order('slot', { ascending: true })
        : { data: [] };

      const bossDeckMap = {};
      safeArray(battleDeckRows).forEach((row) => {
        if (row.slot >= 1 && row.slot <= 4 && row.card_id) {
          if (!bossDeckMap[row.member_id]) bossDeckMap[row.member_id] = [];
          bossDeckMap[row.member_id][row.slot - 1] = row.card_id;
        }
      });
      const indexed = Object.values(bossDeckMap);
      const keyed = { [selectedMember.id]: indexed };
      const finalBossDeck = { ...get().bossDeck, ...keyed };

      const bossWeekId = bossWeek?.id || null;

      const { data: exchangesData } = await supabase
          .from('card_exchanges')
          .select('*')
          .eq('family_id', family.id)
          .order('created_at', { ascending: false });

      const { data: purchasedRewardsData } = await supabase
        .from('purchased_rewards')
        .select('*')
        .eq('family_id', family.id)
        .order('purchased_at', { ascending: false });

      const lastBossIdleAttackAt = bossWeek?.last_attack_at
        ? new Date(bossWeek.last_attack_at).getTime()
        : null;

      const normalized = normalizeState({
        authUserId: userId,
        family,
        members: membersData,
        tasks: tasksData,
        completions: completionsData,
        rewardsAwarded: rewardsData,
        memberCollections: memberCollectionsMap,
        currentCollectionMember: selectedMember?.id,
        exchanges: exchangesData,
        purchasedRewards: purchasedRewardsData,
        boss: normalizeBoss(bossWeek, bossDamage, guildPoints, todayKey(), savedLogs),
        guildPoints,
        bossDeck: finalBossDeck,
        currentMemberId: selectedMember?.id,
        theme: get().theme,
        defeatedBosses: safeArray(defeatedBosses),
        lastBossIdleAttackAt,
      });

      set({ ...normalized, isLoading: false, isSetupDone: true });
      saveState(get());
    } catch (error) {
      console.error('loadAll error:', error);
      set({ isLoading: false, isSetupDone: false });
      get().addToast?.('Не удалось загрузить данные. Попробуй ещё раз.', 'error');
    }
  },

  initFamily: async (payload) => {
    const userId = get().authUserId;
    const displayName = payload.displayName ?? 'Герой';
    const heroName = (payload.heroName ?? payload.members?.[0]?.name ?? displayName).trim() || displayName;
    const heroClass = payload.heroClass ?? payload.members?.[0]?.classId ?? 'mage';
    const avatar = payload.avatar ?? payload.members?.[0]?.avatar ?? '🧙';
    const familyName = (payload.familyName ?? payload.name ?? 'Семейная гильдия').trim() || 'Семейная гильдия';
    const children = safeArray(payload.children ?? payload.members?.filter((member) => member.role === 'child'));

    if (isSupabaseConfigured) {
      const { data: authData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const supabaseUserId = authData.user?.id ?? userId;

      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({ name: familyName, owner_id: supabaseUserId, coins: 1250 })
        .select('*')
        .single();
      if (familyError) throw familyError;

      const { data: ownerMember, error: ownerError } = await supabase
        .from('members')
        .insert({
          family_id: family.id,
          user_id: supabaseUserId,
          name: heroName,
          role: 'parent',
          member_role: 'owner',
          avatar,
          hero_class: heroClass,
        })
        .select('*')
        .single();
      if (ownerError) throw ownerError;

      let insertedChildren = [];
      if (children.length) {
        const { data, error } = await supabase
          .from('members')
          .insert(
            children.map((child) => ({
              family_id: family.id,
              user_id: null,
              name: child.name,
              role: 'child',
              member_role: 'child',
              avatar: child.avatar,
              hero_class: child.classId ?? child.heroClass ?? child.hero_class,
              pin: child.pin || null,
            })),
          )
          .select('*');
        if (error) throw error;
        insertedChildren = data ?? [];
      }

      const tasksToInsert = makeTasks(family.id, ownerMember.id).map(taskToDb);
      const { data: insertedTasks } = await supabase.from('tasks').insert(tasksToInsert).select('*');
      await supabase.from('pity_counters').insert({ family_id: family.id });
      await supabase.from('collection').insert(STARTER_CARDS.map((card) => ({ family_id: family.id, card_id: card.id, count: 1 })));

      const bossCfg = (await import('@/entities/boss/model/bossConfig')).getRandomBossConfig();
      await supabase.from('boss_weeks').insert({
        family_id: family.id,
        boss_name: bossCfg.name,
        boss_emoji: bossCfg.emoji,
        boss_subtitle: bossCfg.subtitle,
        boss_weakness: bossCfg.weakness,
        week_start: getWeekStartKey(),
        week_end: getWeekEndKey(),
        boss_hp_max: bossCfg.hp,
        boss_hp_cur: bossCfg.hp,
        is_active: true,
        is_won: false,
        guild_points: 100,
      });

      const inviteCode = await generateInviteCode(family.id, ownerMember.id);

      const nextState = normalizeState({
        authUserId: supabaseUserId,
        family,
        members: [ownerMember, ...insertedChildren],
        tasks: insertedTasks?.length ? insertedTasks : makeTasks(family.id, ownerMember.id),
        collection: STARTER_CARDS.map((card) => ({ cardId: card.id, count: 1, isNew: false })),
        currentMemberId: ownerMember.id,
        isSetupDone: true,
        boss: defaultBoss,
        theme: get().theme,
      });
      set(nextState);
      saveState(get());
      window.localStorage.setItem(CURRENT_MEMBER_KEY, ownerMember.id);
      return { family: normalizeFamily(family), inviteCode };
    }

    const family = normalizeFamily({
      id: uuidv4(),
      owner_id: userId,
      name: familyName,
      coins: 1250,
      guild_level: 1,
      guild_xp: 0,
      dailyBonusClaimedAt: null,
      ownedItems: [],
      equippedItems: {},
      created_at: new Date().toISOString(),
    });
    const ownerMember = normalizeMember({
      id: uuidv4(),
      family_id: family.id,
      user_id: userId,
      name: heroName,
      role: 'parent',
      member_role: 'owner',
      classId: heroClass,
      avatar,
      created_at: new Date().toISOString(),
    });
    const childMembers = children.map((child, index) =>
      normalizeMember(
        {
          id: child.id || uuidv4(),
          family_id: family.id,
          user_id: null,
          name: child.name,
          role: 'child',
          member_role: 'child',
          classId: child.classId ?? child.heroClass ?? child.hero_class,
          avatar: child.avatar,
          pin: child.pin || '',
          created_at: new Date().toISOString(),
        },
        index + 1,
      ),
    );
    const tasks = makeTasks();
    const nextState = normalizeState({
      authUserId: userId,
      family,
      members: [ownerMember, ...childMembers],
      tasks,
      collection: STARTER_CARDS.map((card) => ({ cardId: card.id, count: 1, isNew: false })),
      currentMemberId: ownerMember.id,
      isSetupDone: true,
      boss: defaultBoss,
      theme: get().theme,
    });
    set(nextState);
    saveState(get());
    window.localStorage.setItem(CURRENT_MEMBER_KEY, ownerMember.id);
    const inviteCode = await generateInviteCode(family.id, ownerMember.id);
    return { family, inviteCode };
  },

  setCurrentMember: (id) => {
    commit(set, get, (state) => ({ ...state, currentMemberId: id }));
    if (!canUseStorage()) return;
    if (id) window.localStorage.setItem(CURRENT_MEMBER_KEY, id);
    else window.localStorage.removeItem(CURRENT_MEMBER_KEY);
  },

  addChild: async ({ name, avatar, heroClass, pin }) => {
    const { family } = get();
    if (!family) return null;
    const tempId = `temp-${uuidv4()}`;
    const child = normalizeMember({
      id: tempId,
      family_id: family.id,
      user_id: null,
      name: name.trim(),
      role: 'child',
      member_role: 'child',
      avatar,
      classId: heroClass,
      pin: pin || '',
      created_at: new Date().toISOString(),
    });

    commit(set, get, (state) => ({ ...state, members: [...state.members, child] }));

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('members').insert(memberToDb(child)).select('*').single();
      if (error) throw error;
      const normalized = normalizeMember(data);
      commit(set, get, (state) => ({
        ...state,
        members: state.members.map((member) => (member.id === tempId ? normalized : member)),
      }));
      get().addToast(`${avatar} ${name} добавлен в гильдию!`, 'success');
      return normalized;
    }

    get().addToast(`${avatar} ${name} добавлен в гильдию!`, 'success');
    return child;
  },

  updateMember: async (memberId, patch) => {
    const normalizedPatch = { ...patch };
    const nextClass = patch.classId ?? patch.heroClass ?? patch.hero_class;
    if (nextClass) {
      normalizedPatch.hero_class = nextClass;
      normalizedPatch.classId = nextClass;
    }
    commit(set, get, (state) => ({
      ...state,
      members: state.members.map((member) =>
        member.id === memberId ? normalizeMember({ ...member, ...normalizedPatch }) : member,
      ),
    }));

    if (isSupabaseConfigured) {
      const dbPatch = {};
      if ('name' in patch) dbPatch.name = patch.name;
      if ('avatar' in patch) dbPatch.avatar = patch.avatar;
      if ('classId' in normalizedPatch) dbPatch.hero_class = normalizedPatch.classId;
      if ('pin' in patch) dbPatch.pin = patch.pin || null;
      const { error } = await supabase.from('members').update(dbPatch).eq('id', memberId);
      if (error) throw error;
    }
  },

  removeMember: async (memberId) => {
    commit(set, get, (state) => ({
      ...state,
      members: state.members.filter((member) => member.id !== memberId),
      currentMemberId: state.currentMemberId === memberId ? null : state.currentMemberId,
    }));

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('members').delete().eq('id', memberId);
      if (error) throw error;
    }
  },

  addTask: (task) => {
    if (!task.title?.trim()) return { ok: false, reason: 'empty_title' };
    if (!task.category) return { ok: false, reason: 'empty_category' };
    if (!task.difficulty) task.difficulty = 'easy';

    const { family, currentMemberId } = get();
    const newTask = normalizeTask({
      id: uuidv4(),
      family_id: family?.id,
      created_by: currentMemberId,
      title: task.title,
      category: task.category,
      difficulty: task.difficulty,
      assigned_to: task.assigned_to || 'all',
      repeat_type: task.repeat_type || 'daily',
      created_at: new Date().toISOString(),
    });

    commit(set, get, (state) => ({ ...state, tasks: [newTask, ...state.tasks] }));

    if (isSupabaseConfigured && family?.id) {
      runRemote(
        supabase
          .from('tasks')
          .insert(taskToDb(newTask))
          .select('*')
          .single()
          .then(({ data, error }) => {
            if (error) throw error;
            const normalized = normalizeTask(data);
            set((state) => ({ ...state, tasks: state.tasks.map((item) => (item.id === newTask.id ? normalized : item)) }));
            saveState(get());
          })
          .catch(async (err) => {
            console.error('addTask sync error:', err);
            set((state) => ({ ...state, tasks: state.tasks.filter(t => t.id !== newTask.id) }));
            saveState(get());
            get().addToast('Не удалось сохранить задачу на сервере. Она была удалена.', 'error');
            throw err;
          }),
        get,
        'addTask',
      );
    }
  },

  deleteTask: (id) => {
    const previousTasks = get().tasks;
    const previousCompletions = get().completions;
    commit(set, get, (state) => ({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== id),
      completions: state.completions.filter((item) => (item.taskId ?? item.task_id) !== id),
    }));

    if (isSupabaseConfigured) {
      runRemote(
        supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
          if (error) throw error;
          return null;
        }).catch(err => {
          set({ tasks: previousTasks, completions: previousCompletions });
          saveState(get());
          get().addToast('Не удалось удалить задачу на сервере.', 'error');
          throw err;
        }), 
        get, 
        'deleteTask'
      );
    }
  },

  completeTask: async (taskId, memberId) => {
    const state = get();
    const { family } = state;
    if (!family?.id) return { ok: false, reason: 'no_family' };

    try {
      const response = await fetch('/api/complete-task', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ taskId, memberId, familyId: family.id }),
      });

      const body = await response.text();
      let result;
      try {
        result = JSON.parse(body);
      } catch {
        throw new Error(`Server error: ${body.slice(0, 200)}`);
      }
      if (!response.ok) {
        if (result.alreadyDone) {
          return { wasNewReward: false, reward: getRewardForTask(state.tasks.find(t => t.id === taskId), state.members.find(m => m.id === memberId), get) };
        }
        throw new Error(result.error || 'Failed to complete task');
      }

      // Update local state based on server result
      const { reward, damage, isCrit, newHp } = result;
      const member = state.members.find((item) => item.id === memberId);
      const task = state.tasks.find((item) => item.id === taskId);

      commit(set, get, (current) => {
        const members = current.members.map((item) => {
          if (item.id !== memberId) return item;
          const xp = item.xp + reward.xp;
          return { ...item, xp, level: xpToLevel(xp), total_tasks: (item.total_tasks ?? 0) + 1 };
        });

        const family = normalizeFamily({
          ...current.family,
          coins: current.family.coins + reward.coins,
          guild_xp: current.family.guild_xp + reward.xp,
          guild_level: guildXpToLevel(current.family.guild_xp + reward.xp),
        });

        const prevHp = current.boss.hp;
        const nextHp = newHp ?? Math.max(0, prevHp - damage);
        const nextPhase = nextHp <= current.boss.maxHp / 2 ? 2 : 1;
        const phaseTriggered = nextPhase === 2 && current.boss.phase !== 2;
        const phaseChanged = nextPhase !== current.boss.phase;

        const logType = isCrit ? 'crit' : 'damage';
        const logText = isCrit
          ? `💥 ${member.name} нанёс КРИТ! → ${damage} урона!`
          : `⚔️ ${member.name} выполнил «${task.title}» → ${damage} урона`;

        const newLogs = [
          { id: uuidv4(), text: logText, at: Date.now(), type: logType },
          ...current.boss.logs,
        ].slice(0, 20);

        const newLogsWithPhase = phaseTriggered
          ? [
              { id: uuidv4(), text: `⚠️ ${current.boss.name} входит в ярость! Теперь атакует дважды!`, at: Date.now(), type: 'phase' },
              ...newLogs,
            ]
          : newLogs;

        return {
          ...current,
          completions: [...current.completions, { id: uuidv4(), taskId, memberId, date: todayKey(), completed_at: new Date().toISOString() }],
          rewardsAwarded: [...current.rewardsAwarded, { id: uuidv4(), taskId, memberId, date: todayKey(), xp_given: reward.xp, coins_given: reward.coins }],
          members,
          family,
          boss: {
            ...current.boss,
            hp: nextHp,
            phase: nextPhase,
            logs: newLogsWithPhase,
          },
          lastTaskCompletedAt: Date.now(),
          lastBossIdleAttackAt: null,
        };
      });

      if (damage > 0) {
        get().setLastDamageEvent({ damage, isCrit });
        get().addToast(isCrit ? `💥 КРИТ! ${damage} урона!` : `⚔️ ${damage} урона по боссу!`, isCrit ? 'crit' : 'damage');
      }
      
      if (newHp === 0) get().triggerVictory();

      return { wasNewReward: true, reward, damage, isCrit };
    } catch (error) {
      console.error('completeTask error:', error);
      get().addToast('Ошибка при выполнении задачи', 'error');
      return { ok: false, error };
    }
  },

  uncompleteTask: async (taskId, memberId) => {
    const date = todayKey();
    commit(set, get, (state) => ({
      ...state,
      completions: state.completions.filter((item) => !completionMatches(item, taskId, memberId, date)),
    }));

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('task_id', taskId)
        .eq('member_id', memberId)
        .eq('date', date);
      if (error) throw error;
    }
  },

  addCardToCollection: (cardId, memberId = null) => {
    const state = get();
    const targetMemberId = memberId || state.currentCollectionMember || state.currentMemberId;
    if (!targetMemberId) return { isNew: false, count: 0 };

    let result = { isNew: true, count: 1 };
    let nextCount = 1;
    
    commit(set, get, (state) => {
      const memberColl = state.memberCollections[targetMemberId] || [];
      const current = memberColl.find((item) => item.cardId === cardId);
      
      if (!current) {
        result = { isNew: true, count: 1 };
        const newCollection = [{ cardId, card_id: cardId, count: 1, isNew: true, stars: 0, addedAt: Date.now() }, ...memberColl];
        return { 
          ...state, 
          memberCollections: { ...state.memberCollections, [targetMemberId]: newCollection }
        };
      }
      
      nextCount = current.count + 1;
      result = { isNew: false, count: nextCount };
      return {
        ...state,
        memberCollections: {
          ...state.memberCollections,
          [targetMemberId]: memberColl.map((item) =>
            item.cardId === cardId ? { ...item, count: nextCount, isNew: true, addedAt: Date.now() } : item,
          ),
        },
      };
    });

    if (isSupabaseConfigured && targetMemberId) {
      runRemote(
        supabase
          .from('member_collections')
          .upsert({ member_id: targetMemberId, card_id: cardId, count: nextCount }, { onConflict: 'member_id,card_id' })
          .then(({ error }) => {
            if (error) throw error;
            return null;
          })
          .catch(async (err) => {
            const memberColl = get().memberCollections[targetMemberId] || [];
            const current = memberColl.find((item) => item.cardId === cardId);
            const rolledBackCount = current ? current.count - 1 : 0;
            
            set((state) => ({
              ...state,
              memberCollections: {
                ...state.memberCollections,
                [targetMemberId]: memberColl.map((item) => 
                  item.cardId === cardId ? { ...item, count: rolledBackCount } : item
                ).filter(item => item.count > 0)
              }
            }));
            saveState(get());
            get().addToast('Ошибка синхронизации коллекции', 'error');
            throw err;
          }),
        get,
        'addCardToCollection',
      );
    }

    return result;
  },

  upgradeCard: async (cardId, memberId = null) => {
    const state = get();
    const targetMemberId = memberId || state.currentCollectionMember || state.currentMemberId;
    const { family } = state;
    
    if (!family?.id) return { ok: false, reason: 'no_family' };
    if ((family?.guild_level ?? 1) < 5) return { ok: false, reason: 'guild_level' };
    if (!targetMemberId) return { ok: false, reason: 'no_member' };
    
    const memberColl = state.memberCollections[targetMemberId] || [];
    const item = memberColl.find((c) => c.cardId === cardId);
    if (!item || item.stars >= 3) return { ok: false, reason: 'max_level' };

    const nextStars = item.stars + 1;
    const cost = UPGRADE_COSTS[nextStars];
    if (!cost) return { ok: false, reason: 'max_level' };

    if (item.count < cost.required) return { ok: false, reason: 'not_enough_copies' };
    if ((family?.coins ?? 0) < cost.costCoins) return { ok: false, reason: 'not_enough_coins' };

    try {
      const response = await fetch('/api/upgrade-card', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ cardId, memberId: targetMemberId, familyId: family.id }),
      });

      const result = await response.json();
      if (!response.ok) return { ok: false, reason: result.error || 'api_error' };

      const newCount = item.count - cost.required;
      commit(set, get, (state) => ({
        ...state,
        memberCollections: {
          ...state.memberCollections,
          [targetMemberId]: (state.memberCollections[targetMemberId] || []).map((c) =>
            c.cardId === cardId ? { ...c, count: newCount, stars: nextStars } : c,
          ),
        },
        family: normalizeFamily({ ...state.family, coins: state.family.coins - cost.costCoins }),
      }));

      return { ok: true, stars: nextStars };
    } catch (error) {
      console.error('upgradeCard error:', error);
      return { ok: false, reason: 'api_error' };
    }
  },

  markCardsSeen: (memberId = null) => {
    const state = get();
    const targetMemberId = memberId || state.currentCollectionMember || state.currentMemberId;
    if (!targetMemberId) return;
    
    commit(set, get, (state) => ({
      ...state,
      memberCollections: {
        ...state.memberCollections,
        [targetMemberId]: (state.memberCollections[targetMemberId] || []).map((item) => ({ ...item, isNew: false })),
      },
    }));
  },

  spendCoins: async (amount) => {
    const state = get();
    if (!state.family || state.family.coins < amount) return false;
    
    try {
      const response = await fetch('/api/spend-coins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, amount }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to spend coins');
      
      commit(set, get, (current) => ({ 
        ...current, 
        family: normalizeFamily({ ...current.family, coins: result.newCoins }) 
      }));
      return true;
    } catch (error) {
      console.error('spendCoins error:', error);
      get().addToast('Ошибка при списании монет', 'error');
      return false;
    }
  },

  addCoins: async (amount) => {
    const state = get();
    if (!state.family?.id) return;
    
    try {
      const response = await fetch('/api/add-coins', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, amount }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add coins');
      
      commit(set, get, (current) => ({ 
        ...current, 
        family: normalizeFamily({ ...current.family, coins: result.newCoins }) 
      }));
    } catch (error) {
      console.error('addCoins error:', error);
      get().addToast('Ошибка при начислении монет', 'error');
    }
  },

  buyItem: async (item) => {
    const state = get();
    if (!state.family?.id) return { ok: false, reason: 'no_family' };
    if (state.family.ownedItems?.includes(item.id)) {
      const newFamily = normalizeFamily({
        ...state.family,
        equippedItems: { ...state.family.equippedItems, [item.type]: item.id },
      });
      commit(set, get, (current) => ({
        ...current,
        family: newFamily,
      }));
      if (isSupabaseConfigured) {
        runRemote(
          supabase.from('families').update(familyPatchToDb({
            equipped_items: newFamily.equippedItems,
          })).eq('id', state.family.id).then(({ error }) => {
            if (error) throw error;
            return null;
          }).catch(err => {
            set({ family: normalizeFamily(state.family) });
            saveState(get());
            get().addToast('Ошибка экипировки предмета', 'error');
            throw err;
          }),
          get,
          'buyItem',
        );
      }
      return { ok: true, alreadyOwned: true };
    }
    
    if (state.family.coins < item.price) return { ok: false, alreadyOwned: false };

    try {
      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, itemId: item.id, itemType: 'item' }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Purchase failed');

      commit(set, get, (current) => {
        const newFamily = normalizeFamily({
          ...current.family,
          coins: result.newCoins,
          ownedItems: [...(current.family.ownedItems || []), item.id],
          equippedItems: { ...current.family.equippedItems, [item.type]: item.id },
        });
        return { ...current, family: newFamily };
      });
      return { ok: true, alreadyOwned: false };
    } catch (error) {
      console.error('buyItem error:', error);
      get().addToast('Ошибка покупки предмета', 'error');
      return { ok: false, alreadyOwned: false };
    }
  },

  buyEffect: async (effect) => {
    const state = get();
    const member = state.getCurrentMember();
    if (!member || member.level < 3) return { ok: false, alreadyOwned: false, reason: 'level' };
    if (!state.family?.id) return { ok: false, alreadyOwned: false, reason: 'no_family' };
    if (state.family.ownedEffects?.includes(effect.id)) {
      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          activeEffect: effect.id,
        }),
      }));
      if (isSupabaseConfigured) {
        runRemote(
          supabase.from('families').update({ active_effect: effect.id }).eq('id', state.family.id).then(({ error }) => {
            if (error) throw error;
            return null;
          }).catch(err => {
            set((state) => ({ ...state, family: normalizeFamily({ ...state.family, activeEffect: get().family.activeEffect }) }));
            saveState(get());
            get().addToast('Ошибка смены эффекта', 'error');
            throw err;
          }),
          get,
          'buyEffect',
        );
      }
      return { ok: true, alreadyOwned: true };
    }
    if (state.family.coins < effect.price) return { ok: false, alreadyOwned: false };
    
    try {
      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, itemId: effect.id, itemType: 'effect' }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Purchase failed');

      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          coins: result.newCoins,
          ownedEffects: [...(current.family.ownedEffects || []), effect.id],
          activeEffect: effect.id,
        }),
      }));
      return { ok: true, alreadyOwned: false };
    } catch (error) {
      console.error('buyEffect error:', error);
      get().addToast('Ошибка покупки эффекта', 'error');
      return { ok: false, alreadyOwned: false };
    }
  },

  setActiveEffect: (effectId) => {
    commit(set, get, (current) => ({
      ...current,
      family: normalizeFamily({
        ...current.family,
        activeEffect: effectId,
      }),
    }));
    if (isSupabaseConfigured && get().family?.id) {
      runRemote(
        supabase.from('families').update({ active_effect: effectId }).eq('id', get().family.id).then(({ error }) => (error ? Promise.reject(error) : null)),
        get,
        'setActiveEffect',
      );
    }
  },

  buyBackground: async (bg) => {
    const state = get();
    const member = state.getCurrentMember();
    if (!member || member.level < 7) return { ok: false, alreadyOwned: false, reason: 'level' };
    if (!state.family?.id) return { ok: false, alreadyOwned: false, reason: 'no_family' };
    if (state.family.ownedBackgrounds?.includes(bg.id)) {
      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          activeBackground: bg.id,
        }),
      }));
      if (isSupabaseConfigured) {
        runRemote(
          supabase.from('families').update({ active_bg: bg.id }).eq('id', state.family.id).then(({ error }) => {
            if (error) throw error;
            return null;
          }).catch(err => {
            set((state) => ({ ...state, family: normalizeFamily({ ...state.family, activeBackground: get().family.activeBackground }) }));
            saveState(get());
            get().addToast('Ошибка смены фона', 'error');
            throw err;
          }),
          get,
          'buyBackground',
        );
      }
      return { ok: true, alreadyOwned: true };
    }
    if (state.family.coins < bg.price) return { ok: false, alreadyOwned: false };
    
    try {
      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, itemId: bg.id, itemType: 'background' }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Purchase failed');

      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          coins: result.newCoins,
          ownedBackgrounds: [...(current.family.ownedBackgrounds || []), bg.id],
          activeBackground: bg.id,
        }),
      }));
      return { ok: true, alreadyOwned: false };
    } catch (error) {
      console.error('buyBackground error:', error);
      get().addToast('Ошибка покупки фона', 'error');
      return { ok: false, alreadyOwned: false };
    }
  },

  setActiveBackground: (bgId) => {
    commit(set, get, (current) => ({
      ...current,
      family: normalizeFamily({
        ...current.family,
        activeBackground: bgId,
      }),
    }));
    if (isSupabaseConfigured && get().family?.id) {
      runRemote(
        supabase.from('families').update({ active_bg: bgId }).eq('id', get().family.id).then(({ error }) => (error ? Promise.reject(error) : null)),
        get,
        'setActiveBackground',
      );
    }
  },

  buyBoost: async (boost) => {
    const state = get();
    const member = state.getCurrentMember();
    if (!member || member.level < 5) return { ok: false, alreadyActive: false, reason: 'level' };
    if (!state.family?.id) return { ok: false, alreadyActive: false, reason: 'no_family' };
    const now = Date.now();
    const expiresAt = state.family.boostExpiresAt?.[boost.id];
    const isActive = expiresAt && expiresAt > now;
    const newExpiresAt = isActive
      ? expiresAt + 24 * 60 * 60 * 1000
      : now + 24 * 60 * 60 * 1000;
    
    try {
      const response = await fetch('/api/purchase-item', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, itemId: boost.id, itemType: 'boost' }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Purchase failed');
      
      const newActiveBoosts = state.family.activeBoosts?.includes(boost.id)
        ? state.family.activeBoosts
        : [...(state.family.activeBoosts || []), boost.id];
      const newBoostExpiresAt = {
        ...(state.family.boostExpiresAt || {}),
        [boost.id]: newExpiresAt,
      };
      
      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          coins: result.newCoins,
          activeBoosts: newActiveBoosts,
          boostExpiresAt: newBoostExpiresAt,
        }),
      }));
      
      return { ok: true, alreadyActive: isActive };
    } catch (error) {
      console.error('buyBoost error:', error);
      get().addToast('Ошибка покупки буста', 'error');
      return { ok: false, alreadyActive: false };
    }
  },


  isBoostActive: (boostId) => {
    const state = get();
    const expiresAt = state.family.boostExpiresAt?.[boostId];
    if (!expiresAt) return false;
    if (Date.now() > expiresAt) return false;
    return true;
  },

  getActiveBoosts: () => {
    const state = get();
    const now = Date.now();
    const activeBoosts = [];
    const expiresAtMap = state.family?.boostExpiresAt;
    if (!expiresAtMap) return activeBoosts;
    for (const boostId of state.family.activeBoosts || []) {
      const expiresAt = expiresAtMap[boostId];
      if (expiresAt && expiresAt > now) {
        activeBoosts.push(boostId);
      }
    }
    return activeBoosts;
  },

  buyReward: async (rewardId) => {
    const state = get();
    if ((state.family?.guild_level ?? 1) < 5) return { ok: false, reason: 'guild_level' };
    if (!state.family?.id) return { ok: false, reason: 'no_family' };
    const reward = REAL_REWARDS.find((r) => r.id === rewardId);
    if (!reward) return { ok: false, reason: 'not_found' };

    const member = state.getCurrentMember();
    if (!member) return { ok: false, reason: 'no_member' };

    const cat = REWARD_CATEGORIES.find((c) => c.value === reward.category);
    const cooldownMs = cat?.cooldownDays ? cat.cooldownDays * 24 * 60 * 60 * 1000 : 0;
    const lastPurchase = state.purchasedRewards
      .filter((r) => r.reward_id === rewardId && r.status === 'purchased')
      .sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at))[0];

    if (lastPurchase && cooldownMs > 0) {
      const elapsed = Date.now() - new Date(lastPurchase.purchased_at).getTime();
      if (elapsed < cooldownMs) {
        const remainingMs = cooldownMs - elapsed;
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        return { ok: false, reason: 'cooldown', remainingHours, cooldownDays: cat.cooldownDays };
      }
    }

    try {
      const response = await fetch('/api/purchase-reward', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          familyId: state.family.id,
          rewardId,
          buyerId: member.id,
          price: reward.price,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to purchase reward');

      const entry = { 
        id: uuidv4(), family_id: state.family.id, reward_id: rewardId, 
        purchased_by: member.id, purchased_at: new Date().toISOString(), status: 'purchased' 
      };

      commit(set, get, (current) => {
        const nextFamily = result.newCoins !== undefined
          ? normalizeFamily({ ...current.family, coins: result.newCoins })
          : current.family;
        return {
          ...current,
          family: nextFamily,
          purchasedRewards: [entry, ...current.purchasedRewards],
        };
      });

      // Notify other members
      fetch('/api/notify-reward', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'notify',
          familyId: state.family.id,
          rewardId,
          buyerId: member.id,
          excludeMemberId: state.getMemberId?.(),
        }),
      }).catch(() => {});

      return { ok: true, ...result };
    } catch (error) {
      console.error('buyReward error:', error);
      get().addToast('Ошибка покупки награды', 'error');
      return { ok: false, error };
    }
  },

  getBoostMultiplier: (boostType) => {
    const state = get();
    const now = Date.now();
    let multiplier = 1;
    for (const boostId of state.family.activeBoosts || []) {
      const expiresAt = state.family.boostExpiresAt?.[boostId];
      if (expiresAt && expiresAt > now && boostId.includes(boostType)) {
        multiplier *= 2;
      }
    }
    return multiplier;
  },

  claimDailyBonus: async () => {
    const date = todayKey();
    const state = get();
    if (!state.family?.id) return { ok: false, reason: 'no_family' };
    if (state.family?.dailyBonusClaimedAt === date) return { ok: false, reason: 'already_claimed' };
    
    try {
      const response = await fetch('/api/claim-daily-bonus', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ familyId: state.family.id, date }),
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to claim bonus');
      
      commit(set, get, (current) => ({ 
        ...current, 
        family: normalizeFamily({ ...current.family, coins: result.newCoins, dailyBonusClaimedAt: date }) 
      }));
      return { ok: true };
    } catch (error) {
      console.error('claimDailyBonus error:', error);
      get().addToast('Ошибка при получении бонуса', 'error');
      return { ok: false, error };
    }
  },

  addToast: (message, type = 'info', data = null) => {
    const id = uuidv4();
    set((state) => ({ ...state, toasts: [...state.toasts, { id, message, type, data }] }));
    const customDuration = TOAST_DURATION[type];
    const duration = customDuration ?? (type === 'exchange' ? 15000 : 3000);
    window.setTimeout(() => {
      set((state) => ({ ...state, toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, duration);
  },

  toggleTheme: () => {
    commit(set, get, (state) => ({ ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }));
  },

  updateGuildName: (name) => {
    const nextName = name.trim() || get().family?.name || 'Семейная гильдия';
    commit(set, get, (state) => ({ ...state, family: normalizeFamily({ ...state.family, name: nextName }) }));
    if (isSupabaseConfigured && get().family?.id) {
      runRemote(supabase.from('families').update({ name: nextName }).eq('id', get().family.id).then(({ error }) => (error ? Promise.reject(error) : null)), get, 'updateGuildName');
    }
  },

  resetData: () => {
    if (canUseStorage()) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(CURRENT_MEMBER_KEY);
    }
    set({ ...baseState, authUserId: get().authUserId, toasts: [] });
  },

  exportData: () => {
    const { toasts, isLoading, ...data } = get();
    return JSON.stringify(data, null, 2);
  },

  isCompleted: (taskId, memberId) => completedOnDate(get().completions, taskId, memberId),

  getTasksForMember: (memberId) => {
    const state = get();
    const member = state.members.find((item) => item.id === memberId);
    if (!member) return [];
    return state.tasks.filter((task) => {
      if (task.assigned_to === 'all') return true;
      if (task.assigned_to === 'children') return member.role === 'child';
      if (task.assigned_to === 'parents') return member.role === 'parent';
      return task.assigned_to === member.id;
    });
  },

  getMemberProgress: (memberId, date = todayKey()) => {
    const tasks = get().getTasksForMember(memberId);
    const completed = tasks.filter((task) => completedOnDate(get().completions, task.id, memberId, date)).length;
    const total = tasks.length || 1;
    return { completed, total: tasks.length, percent: Math.round((completed / total) * 100) };
  },

  getFamilyProgress: (date = todayKey()) => {
    const state = get();
    if (!state.members.length) return { completed: 0, total: 0, percent: 0 };
    const progress = state.members.map((member) => get().getMemberProgress(member.id, date));
    const completed = progress.reduce((sum, item) => sum + item.completed, 0);
    const total = progress.reduce((sum, item) => sum + item.total, 0);
    return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
  },

  getStreak: () => {
    const days = lastDays(21).reverse();
    let streak = 0;
    for (const date of days) {
      const progress = get().getFamilyProgress(date);
      if (progress.total > 0 && progress.percent >= 50) streak += 1;
      else break;
    }
    return streak;
  },

  getCurrentMember: () => {
    const state = get();
    const adultMember = state.members.find((member) => member.user_id && member.user_id === state.authUserId);
    if (adultMember) return adultMember;
    const chosen = state.members.find((member) => member.id === state.currentMemberId);
    return chosen || state.members[0] || null;
  },

  loadExchanges: async () => {
    const { family } = get();
    if (!family?.id) return;
    if (!isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('card_exchanges')
        .select('*')
        .eq('family_id', family.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      commit(set, get, (state) => ({ ...state, exchanges: safeArray(data).map(normalizeExchange) }));
    } catch (error) {
      console.error('loadExchanges error:', error);
    }
  },

  getExchangesCountToday: async (memberId = null) => {
    const { currentMemberId } = get();
    const targetMemberId = memberId || currentMemberId;
    if (!targetMemberId) return 0;
    
    if (!isSupabaseConfigured) {
      const localCount = get().exchanges.filter(
        (e) => e.initiatorId === targetMemberId && new Date(e.createdAt).toDateString() === new Date().toDateString()
      ).length;
      return localCount;
    }

    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('member_exchange_limits')
        .select('exchanges_count')
        .eq('member_id', targetMemberId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data?.exchanges_count ?? 0;
    } catch (error) {
      console.error('getExchangesCountToday error:', error);
      return 0;
    }
  },

  setCurrentCollectionMember: (memberId) => {
    commit(set, get, (state) => ({ ...state, currentCollectionMember: memberId }));
  },

  getCollectionForMember: (memberId) => {
    const state = get();
    return state.memberCollections[memberId] || [];
  },

  transferCard: async (fromMemberId, toMemberId, cardId, count = 1) => {
    const state = get();
    const fromCollection = state.memberCollections[fromMemberId] || [];
    const toCollection = state.memberCollections[toMemberId] || [];
    const prevCollections = { 
      [fromMemberId]: [...fromCollection], 
      [toMemberId]: [...toCollection] 
    };
    const prevMemberCollections = { ...state.memberCollections };

    const fromItem = fromCollection.find((c) => c.cardId === cardId);
    if (!fromItem || fromItem.count < count) {
      return { ok: false, reason: 'not_enough_cards' };
    }
    
    commit(set, get, (state) => {
      const newFromCollection = fromCollection.map((c) => 
        c.cardId === cardId ? { ...c, count: c.count - count } : c
      ).filter((c) => c.count > 0);
    
      const existingToItem = toCollection.find((c) => c.cardId === cardId);
      let newToCollection;
      if (existingToItem) {
        newToCollection = toCollection.map((c) =>
          c.cardId === cardId ? { ...c, count: c.count + count } : c
        );
      } else {
        newToCollection = [...toCollection, { cardId, card_id: cardId, count, stars: fromItem.stars, isNew: true, addedAt: Date.now() }];
      }
    
      return {
        ...state,
        memberCollections: {
          ...state.memberCollections,
          [fromMemberId]: newFromCollection,
          [toMemberId]: newToCollection,
        },
      };
    });
    
    if (isSupabaseConfigured && fromMemberId && toMemberId) {
      try {
        const { error: rpcError } = await supabase.rpc('transfer_card', {
          p_from_member_id: fromMemberId,
          p_to_member_id: toMemberId,
          p_card_id: cardId,
          p_count: count,
        });
        if (rpcError) throw rpcError;
      } catch (error) {
        console.error('transferCard sync error:', error);
        commit(set, get, (state) => ({
          ...state,
          memberCollections: prevMemberCollections,
        }));
        get().addToast?.('Ошибка синхронизации передачи карты. Изменения отменены.', 'error');
        return { ok: false, reason: 'sync_error' };
      }
    }
    
    return { ok: true };
  },

  proposeExchange: async (offeredCardId, recipientId, requestedCardId) => {
    const { family, currentMemberId, memberCollections, members } = get();
    if (!family?.id || !currentMemberId) return { ok: false, reason: 'not_member' };
    const initiator = members.find((m) => m.id === currentMemberId);
    const recipient = members.find((m) => m.id === recipientId);
    if (!initiator || initiator.level < 7) return { ok: false, reason: 'initiator_level' };
    if (!recipient || recipient.level < 7) return { ok: false, reason: 'recipient_level' };
    
    const initiatorCollection = memberCollections[currentMemberId] || [];
    const offeredItem = initiatorCollection.find((c) => c.cardId === offeredCardId);
    if (!offeredItem || offeredItem.count < 1) return { ok: false, reason: 'no_card' };
    
    const countToday = await get().getExchangesCountToday(currentMemberId);
    if (countToday >= 3) return { ok: false, reason: 'daily_limit' };
    const prevMemberCollections = { ...memberCollections };


    commit(set, get, (state) => {
      const newInitiatorCollection = state.memberCollections[currentMemberId]?.map((c) =>
        c.cardId === offeredCardId ? { ...c, count: c.count - 1 } : c
      ).filter((c) => c.count > 0) || [];
    
      const exchange = normalizeExchange({
        id: uuidv4(),
        family_id: family.id,
        initiator_id: currentMemberId,
        recipient_id: recipientId,
        offered_card_id: offeredCardId,
        requested_card_id: requestedCardId,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    
      return {
        ...state,
        memberCollections: {
          ...state.memberCollections,
          [currentMemberId]: newInitiatorCollection,
        },
        exchanges: [exchange, ...state.exchanges],
      };
    });
    
    if (isSupabaseConfigured) {
      try {
        await supabase.from('card_exchanges').insert({
          family_id: family.id,
          initiator_id: currentMemberId,
          recipient_id: recipientId,
          offered_card_id: offeredCardId,
          requested_card_id: requestedCardId,
          status: 'pending',
        });
    
        const today = new Date().toISOString().split('T')[0];
        await supabase.from('member_exchange_limits').upsert(
          { member_id: currentMemberId, date: today, exchanges_count: countToday + 1 },
          { onConflict: 'member_id,date' }
        );
      } catch (error) {
        console.error('proposeExchange sync error:', error);
        commit(set, get, (state) => ({
          ...state,
          memberCollections: prevMemberCollections,
        }));
        get().addToast?.('Ошибка синхронизации обмена. Изменения отменены.', 'error');
        return { ok: false, reason: 'sync_error' };
      }
    }
    
    get().addToast('Предложение об отправлено!', 'success');
    return { ok: true };
  },

  acceptExchange: async (exchangeId) => {
    const { exchanges, family, currentMemberId, memberCollections } = get();
    const exchange = exchanges.find((e) => e.id === exchangeId);
    if (!exchange || exchange.status !== 'pending') return { ok: false, reason: 'invalid' };
    if (!exchange.requestedCardId) {
      return get().rejectExchange(exchangeId);
    }

    if (exchange.recipientId !== currentMemberId) {
      return { ok: false, reason: 'not_recipient' };
    }

    const recipientCollection = memberCollections[currentMemberId] || [];
    const requestedItem = recipientCollection.find((c) => c.cardId === exchange.requestedCardId);
    if (!requestedItem || requestedItem.count < 1) {
      get().addToast('У вас нет этой карточки для обмена', 'error');
      return { ok: false, reason: 'no_card' };
    }

    commit(set, get, (state) => {
      const initiatorColl = state.memberCollections[exchange.initiatorId] || [];
      const recipientColl = state.memberCollections[currentMemberId] || [];

      // Initiator already gave away offeredCardId in proposeExchange.
      // Only add the requested card to initiator.
      const newInitiatorColl = [...initiatorColl];
      newInitiatorColl.push({ cardId: exchange.requestedCardId, card_id: exchange.requestedCardId, count: 1, stars: requestedItem.stars, isNew: true, addedAt: Date.now() });

      const newRecipientColl = recipientColl.reduce((acc, c) => {
        if (c.cardId === exchange.requestedCardId) {
          if (c.count > 1) acc.push({ ...c, count: c.count - 1 });
        } else if (c.cardId === exchange.offeredCardId) {
          acc.push({ ...c, count: c.count + 1, isNew: true });
        } else {
          acc.push(c);
        }
        return acc;
      }, []);
      const hasOffered = recipientColl.some(c => c.cardId === exchange.offeredCardId);
      if (!hasOffered) {
        const initItem = initiatorColl.find(c => c.cardId === exchange.offeredCardId);
        newRecipientColl.push({ cardId: exchange.offeredCardId, card_id: exchange.offeredCardId, count: 1, stars: initItem?.stars || 0, isNew: true, addedAt: Date.now() });
      }

      return {
        ...state,
        exchanges: state.exchanges.map((e) =>
          e.id === exchangeId ? { ...e, status: 'accepted', updatedAt: Date.now() } : e
        ),
        memberCollections: {
          ...state.memberCollections,
          [exchange.initiatorId]: newInitiatorColl,
          [currentMemberId]: newRecipientColl,
        },
      };
    });

    if (isSupabaseConfigured && family?.id) {
      try {
        const { error: rpcError } = await supabase.rpc('accept_exchange', {
          p_exchange_id: exchangeId,
          p_recipient_id: currentMemberId,
        });
        if (rpcError) throw rpcError;
      } catch (error) {
        console.error('acceptExchange sync error:', error);
        get().addToast?.('Ошибка синхронизации обмена', 'error');
      }
    }

    get().addToast('Обмен принят! Карточки обменяны.', 'success');
    return { ok: true };
  },

  rejectExchange: async (exchangeId) => {
    const { exchanges, currentMemberId, memberCollections } = get();
    const exchange = exchanges.find((e) => e.id === exchangeId);
    if (!exchange || exchange.status !== 'pending') return { ok: false, reason: 'invalid' };

    if (exchange.recipientId !== currentMemberId) {
      return { ok: false, reason: 'not_recipient' };
    }

    commit(set, get, (state) => {
      const initiatorColl = state.memberCollections[exchange.initiatorId] || [];
      const existingItem = initiatorColl.find((c) => c.cardId === exchange.offeredCardId);
      
      let newInitiatorColl;
      if (existingItem) {
        newInitiatorColl = initiatorColl.map((c) =>
          c.cardId === exchange.offeredCardId ? { ...c, count: c.count + 1 } : c
        );
      } else {
        newInitiatorColl = [...initiatorColl, { cardId: exchange.offeredCardId, card_id: exchange.offeredCardId, count: 1, stars: 0, isNew: false, addedAt: Date.now() }];
      }

      return {
        ...state,
        exchanges: state.exchanges.map((e) =>
          e.id === exchangeId ? { ...e, status: 'rejected', updatedAt: Date.now() } : e
        ),
        memberCollections: {
          ...state.memberCollections,
          [exchange.initiatorId]: newInitiatorColl,
        },
      };
    });

    if (isSupabaseConfigured) {
      try {
        await supabase.from('card_exchanges').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', exchangeId);
      } catch (error) {
        console.error('rejectExchange sync error:', error);
      }
    }

    get().addToast('Обмен отклонён', 'info');
    return { ok: true };
  },

  getPendingExchangesForCurrentUser: () => {
    const { exchanges, currentMemberId } = get();
    return exchanges.filter((e) => e.recipientId === currentMemberId && e.status === 'pending');
  },

  getMySentExchanges: () => {
    const { exchanges, currentMemberId } = get();
    return exchanges.filter((e) => e.initiatorId === currentMemberId);
  },

  setBossDeck: (cardIds) => {
    const { currentMemberId, family } = get();
    if (!currentMemberId) return;
    commit(set, get, (state) => ({
      ...state,
      bossDeck: { ...state.bossDeck, [currentMemberId]: cardIds.slice(0, 4) },
    }));

    if (isSupabaseConfigured && family?.id) {
      runRemote(
        supabase
          .from('battle_deck')
          .delete()
          .eq('family_id', family.id)
          .eq('member_id', currentMemberId)
          .in('slot', [1, 2, 3, 4])
          .then(({ error: deleteError }) => {
            if (deleteError) return Promise.reject(deleteError);
            const rows = cardIds.slice(0, 4).map((cardId, idx) => ({
              member_id: currentMemberId,
              family_id: family.id,
              card_id: cardId,
              slot: idx + 1,
            })).filter((r) => r.card_id);
            if (rows.length > 0) {
              return supabase.from('battle_deck').insert(rows).then(({ error }) => error ? Promise.reject(error) : null);
            }
            return null;
          }),
        get,
        'setBossDeck',
      );
    }
  },

  getBossDeck: () => {
    const { currentMemberId, bossDeck, memberCollections } = get();
    if (!currentMemberId) return [];
    const cardIds = bossDeck[currentMemberId] || [];
    return cardIds
      .map((cardId) => {
        const coll = memberCollections[currentMemberId] || [];
        const item = coll.find((c) => c.cardId === cardId);
        if (!item) return null;
        const card = CARD_LIBRARY.find((c) => c.id === cardId);
        if (!card) return null;
        return { ...item, card };
      })
      .filter(Boolean);
  },

  addBossLog: (text, type = 'info') => {
    commit(set, get, (state) => ({
      ...state,
      boss: {
        ...state.boss,
        logs: [{ id: uuidv4(), text, at: Date.now(), type }, ...state.boss.logs].slice(0, 20),
      },
    }));
  },

  triggerBossAttack: (penalty) => {
    const { boss, family } = get();
    const healAmount = penalty * 2;
    const newHp = Math.min(boss.maxHp, boss.hp + healAmount);
    commit(set, get, (state) => ({
      ...state,
      boss: { ...state.boss, hp: newHp },
    }));
    const logText = `🐲 Семья не выполняла задачи более 4 часов! ${boss.name} восстанавливает +${healAmount} HP`;
    get().addBossLog(logText, 'attack');
    get().addToast(`🐲 Семья бездействовала 4+ часов! ${boss.name} восстановил +${healAmount} HP!`, 'boss_attack');

    if (isSupabaseConfigured && family?.id) {
      const now = new Date().toISOString();
      supabase
        .from('boss_weeks')
        .select('id')
        .eq('family_id', family.id)
        .eq('week_start', getWeekStartKey())
        .maybeSingle()
        .then(({ data: bw }) => {
          if (!bw) return;
          supabase.from('boss_weeks').update({ boss_hp_cur: newHp, last_attack_at: now }).eq('id', bw.id).then(({ error }) => {
            if (error) console.error('triggerBossAttack sync:', error);
          });
        });
    }
  },

  triggerVictory: () => {
    const { family, boss } = get();
    const reward = 250;
    const coins = (family?.coins ?? 0) + reward;
    const defeatedEntry = {
      id: boss.id,
      boss_name: boss.name,
      boss_emoji: boss.emoji,
      boss_subtitle: boss.subtitle,
      week_start: getWeekStartKey(),
      week_end: getWeekEndKey(),
    };
    commit(set, get, (state) => ({
      ...state,
      family: normalizeFamily({ ...state.family, coins }),
      boss: {
        ...state.boss,
        hp: 0,
        logs: [{ id: uuidv4(), text: `🏆 ${state.boss.name} побеждён! +${reward} монет!`, at: Date.now(), type: 'victory' }, ...state.boss.logs].slice(0, 20),
      },
      defeatedBosses: [defeatedEntry, ...state.defeatedBosses],
    }));
    get().addToast(`🏆 ${boss.name} побеждён! +${reward} монет!`, 'victory');
    if (isSupabaseConfigured && family?.id) {
      supabase.from('families').update({ coins }).eq('id', family.id).then(({ error }) => {
        if (error) console.error('victory sync:', error);
      });
      supabase
        .from('boss_weeks')
        .update({ is_won: true, boss_hp_cur: 0 })
        .eq('family_id', family.id)
        .eq('week_start', getWeekStartKey());
    }
  },

  checkBossAttackNeeded: () => {
    const { lastTaskCompletedAt, lastBossIdleAttackAt } = get();
    if (lastBossIdleAttackAt !== null || lastTaskCompletedAt === null) return;

    const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
    if (Date.now() - lastTaskCompletedAt >= FOUR_HOURS_MS) {
      get().triggerBossAttack(15);
      commit(set, get, (state) => ({
        ...state,
        lastBossIdleAttackAt: Date.now(),
      }));
    }
  },

  lastDamageEvent: null,

  setLastDamageEvent: (event) => {
    commit(set, get, (state) => ({ ...state, lastDamageEvent: event }));
    setTimeout(() => {
      commit(set, get, (state) => ({ ...state, lastDamageEvent: null }));
    }, 2000);
  },
}));
