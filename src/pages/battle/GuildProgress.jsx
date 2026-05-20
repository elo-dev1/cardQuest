import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';
import { todayKey } from '@/shared/lib/date';
import { ProgressBar } from '@/shared/ui/ProgressBar';

export const GuildProgress = () => {
  const members = useStore((state) => state.members);
  const boss = useStore((state) => state.boss);

  const totalDamage = Object.values(boss.damageByMember || {}).reduce((sum, v) => sum + v, 0);
  const todayDamage = Object.values(boss.damageByMemberToday || {}).reduce((sum, v) => sum + v, 0);

  const membersWithProgress = useMemo(() =>
    members.map((member) => {
      const damage = boss.damageByMember?.[member.id] || 0;
      const todayDmg = boss.damageByMemberToday?.[member.id] || 0;
      return { ...member, damage, todayDmg };
    }), [members, boss]);

  return (
    <div className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
      <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">Урон по боссу</h2>

      <div className="mb-5 space-y-4">
        {membersWithProgress.map((member) => (
          <div key={member.id}>
            <div className="mb-1 flex items-center justify-between text-sm font-medium">
              <span className="flex items-center gap-2">
                <span>{member.avatar}</span>
                <span className="text-[var(--text-primary)]">{member.name}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[var(--clay)]">{member.damage}</span>
                {member.todayDmg > 0 ? (
                  <span className="rounded-full bg-[var(--sage-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--sage)]">
                    +{member.todayDmg} сегодня
                  </span>
                ) : (
                  <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-tertiary)]">
                    ⚠️ Не атаковал
                  </span>
                )}
              </div>
            </div>
            <ProgressBar
              value={totalDamage > 0 ? (member.damage / totalDamage) * 100 : 0}
              height={6}
              variant="lavender"
            />
          </div>
        ))}
      </div>

      <div className="rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-4 text-center text-sm font-medium text-[var(--text-primary)]">
        Всего сегодня: <span className="text-[var(--clay)]">{todayDamage}</span> урона из <span>{boss.maxHp}</span> HP
      </div>
    </div>
  );
};
