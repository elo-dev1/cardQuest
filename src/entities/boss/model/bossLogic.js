import { todayKey } from '@/shared/lib/date';
import { getActiveSynergies } from '@/shared/data/synergies';
import { getStreakCalc } from '@/entities/family/model/familyLogic';
import { CARD_LIBRARY } from '@/shared/data/cardData';

export const DIFFICULTY_DAMAGE = {
  easy: 10,
  medium: 20,
  hard: 40,
};

export const defaultBoss = {
  name: 'Дракон Лени',
  emoji: '🐲',
  subtitle: 'Повелитель прокрастинации',
  maxHp: 1000,
  hp: 1000,
  weakness: 'activity',
  daysLeft: 3,
  phase: 1,
  logs: [
    { id: 'log-init', text: 'Дракон Лени появился над городом! Гильдия, к бою!', at: Date.now(), type: 'phase' },
  ],
  damageByMember: {},
  damageByMemberToday: {},
};

export const normalizeBoss = (bossWeek, damageRows = [], guildPoints = 100, todayKeyStr = todayKey(), existingLogs = null) => {
   if (!bossWeek) return defaultBoss;

   const damageByMember = (Array.isArray(damageRows) ? damageRows : []).reduce((acc, row) => {
     acc[row.member_id] = (acc[row.member_id] ?? 0) + (row.damage ?? 0);
     return acc;
   }, {});

   const damageByMemberToday = (Array.isArray(damageRows) ? damageRows : [])
     .filter((row) => row.date === todayKeyStr)
     .reduce((acc, row) => {
       acc[row.member_id] = (acc[row.member_id] ?? 0) + (row.damage_today ?? row.damage ?? 0);
       return acc;
     }, {});

   const weekEnd = bossWeek.week_end ? new Date(bossWeek.week_end) : null;
   const daysLeft = weekEnd ? Math.max(0, Math.ceil((weekEnd - new Date()) / 86400000)) : defaultBoss.daysLeft;
   const hp = bossWeek.boss_hp_cur ?? defaultBoss.hp;
   const maxHp = bossWeek.boss_hp_max ?? defaultBoss.maxHp;
   const phase = hp <= maxHp / 2 ? 2 : 1;

   const logs = existingLogs && existingLogs.length > 0
     ? existingLogs
     : [
         { id: `boss-${bossWeek.id}`, text: `⚔️ Битва с "${bossWeek.boss_name ?? defaultBoss.name}" активна`, at: Date.now(), type: 'info' },
       ];

   return {
     name: bossWeek.boss_name ?? defaultBoss.name,
     emoji: bossWeek.boss_emoji ?? defaultBoss.emoji,
     subtitle: bossWeek.boss_subtitle ?? defaultBoss.subtitle,
     maxHp,
     hp,
     weakness: bossWeek.boss_weakness ?? defaultBoss.weakness,
     daysLeft,
     phase,
     damageByMember,
     damageByMemberToday,
     logs,
   };
};

export const getBossDeckForMember = (state, memberId, cardLibrary) => {
  const deck = state.bossDeck[memberId] || [];
  return deck
    .map((cardId) => {
      const coll = state.memberCollections[memberId] || [];
      const item = coll.find((c) => c.cardId === cardId);
      if (!item) return null;
      const card = cardLibrary.find((c) => c.id === cardId);
      if (!card) return null;
      return { ...item, card };
    })
    .filter(Boolean);
};

export const calculateBossDamage = (task, member, state, memberId, getStore) => {
  const baseDamage = DIFFICULTY_DAMAGE[task.difficulty] || 10;
  let damage = baseDamage;

  const damageMultiplier = getStore ? getStore().getBoostMultiplier('damage') : 1;
  damage = Math.round(damage * damageMultiplier);

  if (task.category === state.boss.weakness) {
    damage *= 2;
  }

  const deckCards = getBossDeckForMember(state, memberId, CARD_LIBRARY);
  const matchingCard = deckCards.find((c) => c.card.category === task.category);
  if (matchingCard) {
    const cardAttack = Math.round(matchingCard.card.attack * (matchingCard.stars ? [1, 1.1, 1.25, 1.5][matchingCard.stars] : 1));
    damage += Math.round(cardAttack * 0.3);
  }

  const activeSynergies = getActiveSynergies(deckCards.map((c) => c.card));
  if (activeSynergies.length > 0) {
    damage = Math.round(damage * 1.3);
  }

  const streak = getStreakCalc(state);
  if (streak >= 3) {
    const streakBonus = Math.min(0.35, 0.05 + (streak - 3) * 0.02);
    damage = Math.round(damage * (1 + streakBonus));
  }

  const allActiveToday = state.members.every((m) => {
    const todayDamage = state.boss.damageByMemberToday?.[m.id] || 0;
    return todayDamage > 0 || state.completions.some(
      (c) => (c.memberId ?? c.member_id) === m.id && (c.date === todayKey()),
    );
  });
  if (allActiveToday && state.members.length > 1) {
    damage = Math.round(damage * 1.2);
  }

  const isCrit = Math.random() < 0.05;
  if (isCrit) {
    damage = Math.round(damage * 2.5);
  }

  return { damage, isCrit };
};
