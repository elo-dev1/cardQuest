import { lastDays } from '@/shared/lib/date';

export const normalizeFamily = (family) => {
  if (!family) return null;
  return {
    ...family,
    coins: family.coins ?? 0,
    guild_level: family.guild_level ?? 1,
    guild_xp: family.guild_xp ?? 0,
    dailyBonusClaimedAt: family.dailyBonusClaimedAt ?? family.last_login_date ?? null,
    ownedItems: family.ownedItems ?? [],
    equippedItems: family.equippedItems ?? {},
    ownedEffects: family.ownedEffects ?? family.owned_effects ?? [],
    activeEffect: family.activeEffect ?? family.active_effect ?? null,
    ownedBackgrounds: family.ownedBackgrounds ?? family.owned_backgrounds ?? [],
    activeBackground: family.activeBackground ?? family.active_bg ?? null,
    activeBoosts: family.activeBoosts ?? family.active_boosts ?? [],
    boostExpiresAt: family.boostExpiresAt ?? family.boost_expires_at ?? {},
  };
};

export const getStreakCalc = (state) => {
  const days = lastDays(21).reverse();
  let streak = 0;
  
  const completionsMap = new Map();
  state.completions.forEach(c => {
    const mId = c.memberId ?? c.member_id;
    const tId = c.taskId ?? c.task_id;
    completionsMap.set(`${mId}|${tId}|${c.date}`, true);
  });

  for (const date of days) {
    const tasks = state.tasks;
    const members = state.members;
    if (!members.length) break;
    
    const allMembersProgress = members.every((member) => {
      const memberTasks = tasks.filter((task) => {
        if (task.assigned_to === 'all') return true;
        if (task.assigned_to === 'children') return member.role === 'child';
        if (task.assigned_to === 'parents') return member.role === 'parent';
        return task.assigned_to === member.id;
      });
      
      if (memberTasks.length === 0) return false;
      
      let completedCount = 0;
      for (const task of memberTasks) {
        if (completionsMap.has(`${member.id}|${task.id}|${date}`)) {
          completedCount++;
        }
      }
      
      return completedCount / memberTasks.length >= 0.5;
    });
    
    if (allMembersProgress) streak += 1;
    else break;
  }
  return streak;
};
