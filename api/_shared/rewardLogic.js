const DIFFICULTY_DAMAGE = {
  easy: 10,
  medium: 20,
  hard: 40,
};

export const getRewardForTask = (task, member, getStore) => {
  const base = DIFFICULTY_DAMAGE[task.difficulty] || 10;
  const xpMultiplier = getStore ? getStore().getBoostMultiplier('xp') : 1;
  const coinsMultiplier = getStore ? getStore().getBoostMultiplier('money') : 1;
  return {
    xp: Math.round(base / 2 * xpMultiplier),
    coins: Math.round(base / 2 * coinsMultiplier),
    damage: base,
  };
};
