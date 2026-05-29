export const DIFFICULTY_DAMAGE = {
  easy: 10,
  medium: 20,
  hard: 40,
};

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export const calculateBossDamage = (task, member, state, memberId, getStore) => {
  const baseDamage = DIFFICULTY_DAMAGE[task.difficulty] || 10;
  let damage = baseDamage;

  const damageMultiplier = getStore ? getStore().getBoostMultiplier('damage') : 1;
  damage = Math.round(damage * damageMultiplier);

  if (task.category === state.boss.weakness) {
    damage *= 2;
  }

  const allActiveToday = state.members.every((m) => {
    const todayDamage = state.boss.damageByMemberToday?.[m.id] || 0;
    return todayDamage > 0 || state.completions.some(
      (c) => (c.memberId ?? c.member_id) === m.id && (c.date === getTodayKey()),
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
