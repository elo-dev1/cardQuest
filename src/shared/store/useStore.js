import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TASK_TEMPLATES } from '@/shared/data/taskTemplates';
import { STARTER_CARDS, UPGRADE_COSTS } from '@/shared/data/cardData';
import { todayKey, lastDays } from '@/shared/lib/date';
import { isSupabaseConfigured, supabase } from '@/shared/lib/supabase';
import { generateInviteCode } from '@/features/invite/model/inviteActions';

const STORAGE_KEY = 'card-quest-state-v1';
const CURRENT_MEMBER_KEY = 'card-quest-current-member-id';

const defaultBoss = {
  name: 'Дракон Прокрастинации',
  emoji: '🐉',
  subtitle: 'Хранитель отложенных дел',
  maxHp: 1200,
  hp: 860,
  weakness: 'study',
  daysLeft: 3,
  logs: [
    { id: 'log-1', text: '⚔️ Гильдия готовится к битве!', at: Date.now() - 3600000 },
    { id: 'log-2', text: '🐉 Босс ворчит над списком дел.', at: Date.now() - 7200000 },
  ],
  damageByMember: {},
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
  theme: 'dark',
};

const canUseStorage = () => typeof window !== 'undefined' && window.localStorage;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeFamily = (family) => {
  if (!family) return null;
  return {
    ...family,
    coins: family.coins ?? 0,
    gems: family.gems ?? family.crystals ?? 0,
    crystals: family.crystals ?? family.gems ?? 0,
    guild_level: family.guild_level ?? 1,
    guild_xp: family.guild_xp ?? 0,
    dailyBonusClaimedAt: family.dailyBonusClaimedAt ?? family.last_login_date ?? null,
    ownedItems: family.ownedItems ?? [],
    equippedItems: family.equippedItems ?? {},
  };
};

const normalizeMember = (member, index = 0) => {
  const role = member.role ?? (member.member_role === 'child' ? 'child' : 'parent');
  const heroClass = member.classId ?? member.hero_class ?? member.heroClass ?? 'mage';
  return {
    ...member,
    id: member.id ?? uuidv4(),
    name: member.name ?? 'Герой',
    role,
    member_role: member.member_role ?? (role === 'child' ? 'child' : index === 0 ? 'owner' : 'parent'),
    avatar: member.avatar ?? '🧙',
    hero_class: heroClass,
    classId: heroClass,
    pin: member.pin ?? '',
    xp: member.xp ?? 0,
    coins: member.coins ?? 0,
    level: member.level ?? 1,
    xp_next: member.xp_next ?? 120,
    total_tasks: member.total_tasks ?? 0,
    isChild: role === 'child',
    order: member.order ?? index,
  };
};

const normalizeTask = (task, index = 0) => ({
  ...task,
  id: task.id ?? uuidv4(),
  category: task.category ?? 'home',
  difficulty: task.difficulty ?? 'easy',
  assigned_to: task.assigned_to ?? 'all',
  repeat_type: task.repeat_type ?? 'daily',
  is_active: task.is_active ?? true,
  sort_order: task.sort_order ?? index,
});

const normalizeCompletion = (completion) => ({
  ...completion,
  taskId: completion.taskId ?? completion.task_id,
  task_id: completion.task_id ?? completion.taskId,
  memberId: completion.memberId ?? completion.member_id,
  member_id: completion.member_id ?? completion.memberId,
});

const normalizeReward = (reward) => ({
  ...reward,
  taskId: reward.taskId ?? reward.task_id,
  task_id: reward.task_id ?? reward.taskId,
  memberId: reward.memberId ?? reward.member_id,
  member_id: reward.member_id ?? reward.memberId,
});

const normalizeCollectionItem = (item) => ({
  ...item,
  cardId: item.cardId ?? item.card_id,
  card_id: item.card_id ?? item.cardId,
  count: item.count ?? 1,
  isNew: item.isNew ?? item.is_new ?? false,
  stars: item.stars ?? 0,
  addedAt: item.addedAt ?? item.obtained_at ? new Date(item.obtained_at).getTime() : 0,
});

const normalizeExchange = (exchange) => ({
  ...exchange,
  initiatorId: exchange.initiator_id ?? exchange.initiatorId,
  initiator_id: exchange.initiator_id ?? exchange.initiatorId,
  recipientId: exchange.recipient_id ?? exchange.recipientId,
  recipient_id: exchange.recipient_id ?? exchange.recipientId,
  offeredCardId: exchange.offered_card_id ?? exchange.offeredCardId,
  offered_card_id: exchange.offered_card_id ?? exchange.offeredCardId,
  requestedCardId: exchange.requested_card_id ?? exchange.requestedCardId,
  requested_card_id: exchange.requested_card_id ?? exchange.requestedCardId,
});

const normalizeMemberCollections = (collections, members) => {
  const result = {};
  const collectionsByMember = safeArray(collections).reduce((acc, item) => {
    if (!acc[item.member_id]) acc[item.member_id] = [];
    acc[item.member_id].push(normalizeCollectionItem(item));
    return acc;
  }, {});

  members.forEach((member) => {
    result[member.id] = collectionsByMember[member.id] || [];
  });

  return result;
};

const normalizeBoss = (bossWeek, damageRows = []) => {
  if (!bossWeek) return defaultBoss;
  const boss = bossWeek.bosses ?? bossWeek.boss ?? {};
  const damageByMember = safeArray(damageRows).reduce((acc, row) => {
    acc[row.member_id] = (acc[row.member_id] ?? 0) + (row.damage ?? 0);
    return acc;
  }, {});

  const weekEnd = bossWeek.week_end ? new Date(bossWeek.week_end) : null;
  const daysLeft = weekEnd ? Math.max(0, Math.ceil((weekEnd - new Date()) / 86400000)) : defaultBoss.daysLeft;

  return {
    name: boss.name ?? defaultBoss.name,
    emoji: boss.emoji ?? defaultBoss.emoji,
    subtitle: boss.subtitle ?? defaultBoss.subtitle,
    maxHp: bossWeek.boss_hp_max ?? boss.hp ?? defaultBoss.maxHp,
    hp: bossWeek.boss_hp_cur ?? bossWeek.hp ?? defaultBoss.hp,
    weakness: boss.weakness ?? defaultBoss.weakness,
    daysLeft,
    damageByMember,
    logs: [
      { id: `boss-${bossWeek.id}`, text: `⚔️ Битва с "${boss.name ?? defaultBoss.name}" активна`, at: Date.now() },
      ...defaultBoss.logs.slice(0, 4),
    ],
  };
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
    toasts: [],
    isLoading: false,
    isSetupDone: Boolean(state.family),
  };
};

const loadState = () => {
  if (!canUseStorage()) return baseState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;
    return normalizeState(JSON.parse(raw));
  } catch {
    return baseState;
  }
};

const saveState = (state) => {
  if (!canUseStorage()) return;
  const { toasts, isLoading, ...persisted } = state;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
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

const getRewardForTask = (task, member) => {
  return {
    xp: 10,
    coins: 10,
    damage: 10 + Math.max(0, Math.floor((member?.level || 1) * 2)),
  };
};

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
  if ('gems' in dbPatch) {
    dbPatch.crystals = dbPatch.gems;
    delete dbPatch.gems;
  }
  delete dbPatch.dailyBonusClaimedAt;
  delete dbPatch.ownedItems;
  delete dbPatch.equippedItems;
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

      const { data: bossWeek } = await supabase
        .from('boss_weeks')
        .select('*, bosses(*)')
        .eq('family_id', family.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: bossDamage } = bossWeek
        ? await supabase.from('boss_damage').select('*').eq('boss_week_id', bossWeek.id)
        : { data: [] };

      const { data: exchangesData } = await supabase
          .from('card_exchanges')
          .select('*')
          .eq('family_id', family.id)
          .order('created_at', { ascending: false });

      const memberCollectionsMap = normalizeMemberCollections(memberCollectionsData || [], membersData);
      const selectedMember = membersData.find(m => m.user_id === userId) || membersData[0];

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
        boss: normalizeBoss(bossWeek, bossDamage),
        currentMemberId: selectedMember?.id,
        theme: get().theme,
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
        .insert({ name: familyName, owner_id: supabaseUserId, coins: 1250, crystals: 45 })
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
      gems: 45,
      crystals: 45,
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
          }),
        get,
        'addTask',
      );
    }
  },

  deleteTask: (id) => {
    commit(set, get, (state) => ({
      ...state,
      tasks: state.tasks.filter((task) => task.id !== id),
      completions: state.completions.filter((item) => (item.taskId ?? item.task_id) !== id),
    }));

    if (isSupabaseConfigured) {
      runRemote(supabase.from('tasks').delete().eq('id', id).then(({ error }) => (error ? Promise.reject(error) : null)), get, 'deleteTask');
    }
  },

  completeTask: async (taskId, memberId) => {
    const state = get();
    const date = todayKey();
    const task = state.tasks.find((item) => item.id === taskId);
    const member = state.members.find((item) => item.id === memberId);
    if (!task || !member) return { wasNewReward: false, reward: { xp: 0, coins: 0, damage: 0 } };
    if (completedOnDate(state.completions, taskId, memberId, date)) {
      return { wasNewReward: false, reward: getRewardForTask(task, member) };
    }

    const reward = getRewardForTask(task, member);
    const wasAlreadyAwarded = awardedOnDate(state.rewardsAwarded, taskId, memberId, date);
    const completion = normalizeCompletion({ id: uuidv4(), taskId, memberId, date, completed_at: new Date().toISOString() });
    const award = normalizeReward({ id: uuidv4(), taskId, memberId, date, xp_given: reward.xp, coins_given: reward.coins });

    let newMember = member;
    let newFamily = state.family;
    let newBoss = state.boss;

    commit(set, get, (current) => {
      const members = wasAlreadyAwarded
        ? current.members
        : current.members.map((item) => {
            if (item.id !== memberId) return item;
            const xp = item.xp + reward.xp;
            newMember = { ...item, xp, coins: item.coins + reward.coins, level: xpToLevel(xp), total_tasks: (item.total_tasks ?? 0) + 1 };
            return newMember;
          });

      const family = wasAlreadyAwarded
        ? current.family
        : normalizeFamily({
            ...current.family,
            coins: current.family.coins + reward.coins,
            guild_xp: current.family.guild_xp + reward.xp,
            guild_level: xpToLevel(current.family.guild_xp + reward.xp),
          });
      newFamily = family;

      const boss = wasAlreadyAwarded
        ? current.boss
        : {
            ...current.boss,
            hp: Math.max(0, current.boss.hp - reward.damage),
            damageByMember: {
              ...current.boss.damageByMember,
              [memberId]: (current.boss.damageByMember?.[memberId] || 0) + reward.damage,
            },
            logs: [
              { id: uuidv4(), text: `⚔️ ${member.name} нанёс ${reward.damage} урона!`, at: Date.now() },
              ...current.boss.logs,
            ].slice(0, 12),
          };
      newBoss = boss;

      return {
        ...current,
        completions: [...current.completions, completion],
        rewardsAwarded: wasAlreadyAwarded ? current.rewardsAwarded : [...current.rewardsAwarded, award],
        members,
        family,
        boss,
      };
    });

    if (isSupabaseConfigured) {
      try {
        const { error: completionError } = await supabase.from('completions').insert({
          task_id: taskId,
          member_id: memberId,
          date,
        });
        if (completionError && completionError.code !== '23505') throw completionError;

        if (!wasAlreadyAwarded) {
          const { error: rewardError } = await supabase.from('rewards_awarded').insert({
            task_id: taskId,
            member_id: memberId,
            date,
            xp_given: reward.xp,
            coins_given: reward.coins,
          });
          if (rewardError && rewardError.code !== '23505') throw rewardError;

          await supabase
            .from('members')
            .update({
              xp: newMember.xp,
              level: newMember.level,
              total_tasks: newMember.total_tasks,
            })
            .eq('id', memberId);
          await supabase.from('families').update(familyPatchToDb({
            coins: newFamily.coins,
            guild_xp: newFamily.guild_xp,
            guild_level: newFamily.guild_level,
          })).eq('id', newFamily.id);
        }
      } catch (error) {
        console.error('completeTask sync error:', error);
        get().addToast('Награда начислена локально, но Supabase не синхронизировался.', 'error');
      }
    }

    return { wasNewReward: !wasAlreadyAwarded, reward, boss: newBoss };
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
          .then(({ error }) => (error ? Promise.reject(error) : null)),
        get,
        'addCardToCollection',
      );
    }

    return result;
  },

  upgradeCard: (cardId, memberId = null) => {
    const state = get();
    const targetMemberId = memberId || state.currentCollectionMember || state.currentMemberId;
    const { family } = state;
    
    if (!targetMemberId) return { ok: false, reason: 'no_member' };
    
    const memberColl = state.memberCollections[targetMemberId] || [];
    const item = memberColl.find((c) => c.cardId === cardId);
    if (!item || item.stars >= 3) return { ok: false, reason: 'max_level' };

    const nextStars = item.stars + 1;
    const cost = UPGRADE_COSTS[nextStars];
    if (!cost) return { ok: false, reason: 'max_level' };

    if (item.count < cost.required) return { ok: false, reason: 'not_enough_copies' };
    if ((family?.coins ?? 0) < cost.costCoins) return { ok: false, reason: 'not_enough_coins' };

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

    if (isSupabaseConfigured && targetMemberId) {
      runRemote(
        supabase
          .from('member_collections')
          .upsert({ member_id: targetMemberId, card_id: cardId, count: newCount, stars: nextStars }, { onConflict: 'member_id,card_id' })
          .then(({ error }) => (error ? Promise.reject(error) : null)),
        get,
        'upgradeCard',
      );
      runRemote(supabase.from('families').update({ coins: family.coins - cost.costCoins }).eq('id', family.id).then(({ error }) => (error ? Promise.reject(error) : null)), get, 'upgradeCard coins');
    }

    return { ok: true, stars: nextStars };
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

  spendCoins: (amount) => {
    const state = get();
    if (!state.family || state.family.coins < amount) return false;
    const coins = state.family.coins - amount;
    commit(set, get, (current) => ({ ...current, family: normalizeFamily({ ...current.family, coins }) }));

    if (isSupabaseConfigured) {
      runRemote(supabase.from('families').update({ coins }).eq('id', state.family.id).then(({ error }) => (error ? Promise.reject(error) : null)), get, 'spendCoins');
    }
    return true;
  },

  addCoins: (amount) => {
    const state = get();
    const coins = (state.family?.coins ?? 0) + amount;
    commit(set, get, (current) => ({ ...current, family: normalizeFamily({ ...current.family, coins }) }));
    if (isSupabaseConfigured && state.family?.id) {
      runRemote(supabase.from('families').update({ coins }).eq('id', state.family.id).then(({ error }) => (error ? Promise.reject(error) : null)), get, 'addCoins');
    }
  },

  buyItem: (item) => {
    const state = get();
    if (state.family.ownedItems?.includes(item.id)) {
      commit(set, get, (current) => ({
        ...current,
        family: normalizeFamily({
          ...current.family,
          equippedItems: { ...current.family.equippedItems, [item.type]: item.id },
        }),
      }));
      return { ok: true, alreadyOwned: true };
    }
    if (state.family.coins < item.price) return { ok: false, alreadyOwned: false };
    commit(set, get, (current) => ({
      ...current,
      family: normalizeFamily({
        ...current.family,
        coins: current.family.coins - item.price,
        ownedItems: [...(current.family.ownedItems || []), item.id],
        equippedItems: { ...current.family.equippedItems, [item.type]: item.id },
      }),
    }));
    return { ok: true, alreadyOwned: false };
  },

  claimDailyBonus: () => {
    const date = todayKey();
    const state = get();
    if (state.family?.dailyBonusClaimedAt === date) return false;
    const coins = state.family.coins + 20;
    commit(set, get, (current) => ({
      ...current,
      family: normalizeFamily({
        ...current.family,
        coins,
        dailyBonusClaimedAt: date,
        last_login_date: date,
        login_streak: (current.family.login_streak ?? 0) + 1,
      }),
    }));

    if (isSupabaseConfigured) {
      runRemote(
        supabase
          .from('families')
          .update({ coins, last_login_date: date, login_streak: (state.family.login_streak ?? 0) + 1 })
          .eq('id', state.family.id)
          .then(({ error }) => (error ? Promise.reject(error) : null)),
        get,
        'claimDailyBonus',
      );
    }
    return true;
  },

  addToast: (message, type = 'info', data = null) => {
    const id = uuidv4();
    set((state) => ({ ...state, toasts: [...state.toasts, { id, message, type, data }] }));
    const duration = type === 'exchange' ? 15000 : 3000;
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
        const { data: fromData } = await supabase
          .from('member_collections')
          .select('count, stars')
          .eq('member_id', fromMemberId)
          .eq('card_id', cardId)
          .maybeSingle();

        if (fromData && fromData.count > count) {
          await supabase
            .from('member_collections')
            .upsert({ member_id: fromMemberId, card_id: cardId, count: fromData.count - count, stars: fromData.stars }, { onConflict: 'member_id,card_id' });
        } else if (fromData && fromData.count === count) {
          await supabase.from('member_collections').delete().eq('member_id', fromMemberId).eq('card_id', cardId);
        }

        const { data: toData } = await supabase
          .from('member_collections')
          .select('count, stars')
          .eq('member_id', toMemberId)
          .eq('card_id', cardId)
          .maybeSingle();

        if (toData) {
          await supabase
            .from('member_collections')
            .upsert({ member_id: toMemberId, card_id: cardId, count: toData.count + count, stars: toData.stars }, { onConflict: 'member_id,card_id' });
        } else {
          await supabase
            .from('member_collections')
            .insert({ member_id: toMemberId, card_id: cardId, count, stars: fromItem.stars });
        }
      } catch (error) {
        console.error('transferCard sync error:', error);
      }
    }

    return { ok: true };
  },

  proposeExchange: async (offeredCardId, recipientId, requestedCardId) => {
    const { family, currentMemberId, memberCollections } = get();
    if (!family?.id || !currentMemberId) return { ok: false, reason: 'not_member' };

    const initiatorCollection = memberCollections[currentMemberId] || [];
    const offeredItem = initiatorCollection.find((c) => c.cardId === offeredCardId);
    if (!offeredItem || offeredItem.count < 1) return { ok: false, reason: 'no_card' };

    const countToday = await get().getExchangesCountToday(currentMemberId);
    if (countToday >= 3) return { ok: false, reason: 'daily_limit' };

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

      const newInitiatorColl = [
        ...initiatorColl.filter((c) => c.cardId !== exchange.offeredCardId),
        { cardId: exchange.requestedCardId, card_id: exchange.requestedCardId, count: 1, stars: requestedItem.stars, isNew: true, addedAt: Date.now() }
      ];

      const newRecipientColl = recipientColl.map((c) => {
        if (c.cardId === exchange.requestedCardId && c.count > 1) {
          return { ...c, count: c.count - 1 };
        }
        if (c.cardId === exchange.requestedCardId && c.count === 1) {
          return null;
        }
        if (c.cardId === exchange.offeredCardId) {
          const existing = initiatorColl.find((c2) => c2.cardId === exchange.offeredCardId);
          return { ...c, count: c.count + (existing?.count || 1), isNew: true };
        }
        return c;
      }).filter(Boolean);

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
        await supabase.from('card_exchanges').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', exchangeId);

        const { data: requestedData } = await supabase
          .from('member_collections')
          .select('count, stars')
          .eq('member_id', currentMemberId)
          .eq('card_id', exchange.requestedCardId)
          .maybeSingle();

        if (requestedData && requestedData.count > 1) {
          await supabase
            .from('member_collections')
            .upsert({ member_id: currentMemberId, card_id: exchange.requestedCardId, count: requestedData.count - 1, stars: requestedData.stars }, { onConflict: 'member_id,card_id' });
        } else if (requestedData && requestedData.count === 1) {
          await supabase.from('member_collections').delete().eq('member_id', currentMemberId).eq('card_id', exchange.requestedCardId);
        }

        const { data: offeredData } = await supabase
          .from('member_collections')
          .select('count')
          .eq('member_id', exchange.initiatorId)
          .eq('card_id', exchange.offeredCardId)
          .maybeSingle();

        if (offeredData) {
          await supabase
            .from('member_collections')
            .upsert({ member_id: exchange.initiatorId, card_id: exchange.requestedCardId, count: 1, stars: requestedData?.stars || 0 }, { onConflict: 'member_id,card_id' });
        } else {
          await supabase
            .from('member_collections')
            .insert({ member_id: exchange.initiatorId, card_id: exchange.requestedCardId, count: 1, stars: requestedData?.stars || 0 });
        }

        const { data: offeredForRecipientData } = await supabase
          .from('member_collections')
          .select('count, stars')
          .eq('member_id', currentMemberId)
          .eq('card_id', exchange.offeredCardId)
          .maybeSingle();

        if (offeredForRecipientData) {
          await supabase
            .from('member_collections')
            .upsert({ member_id: currentMemberId, card_id: exchange.offeredCardId, count: offeredForRecipientData.count + 1, stars: offeredForRecipientData.stars }, { onConflict: 'member_id,card_id' });
        } else {
          const initItem = memberCollections[exchange.initiatorId]?.find(c => c.cardId === exchange.offeredCardId);
          await supabase
            .from('member_collections')
            .insert({ member_id: currentMemberId, card_id: exchange.offeredCardId, count: 1, stars: initItem?.stars || 0 });
        }
      } catch (error) {
        console.error('acceptExchange sync error:', error);
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
}));
