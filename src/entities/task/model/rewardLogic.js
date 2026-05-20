export const normalizeReward = (reward) => ({
  ...reward,
  taskId: reward.taskId ?? reward.task_id,
  task_id: reward.task_id ?? reward.taskId,
  memberId: reward.memberId ?? reward.member_id,
  member_id: reward.member_id ?? reward.memberId,
});

export const getRewardForTask = (task, member, getStore) => {
  const DIFFICULTY_DAMAGE = {
    easy: 10,
    medium: 20,
    hard: 40,
  };
  const base = DIFFICULTY_DAMAGE[task.difficulty] || 10;
  const xpMultiplier = getStore ? getStore().getBoostMultiplier('xp') : 1;
  const coinsMultiplier = getStore ? getStore().getBoostMultiplier('money') : 1;
  return {
    xp: Math.round(base / 2 * xpMultiplier),
    coins: Math.round(base / 2 * coinsMultiplier),
    damage: base,
  };
};
