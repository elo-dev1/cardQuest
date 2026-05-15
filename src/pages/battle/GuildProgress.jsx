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
    <div className="card p-5">
      <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">Урон по боссу</h2>

      <div className="mb-5 space-y-4">
        {membersWithProgress.map((member) => (
          <div key={member.id}>
            <div className="mb-1 flex items-center justify-between text-sm font-black">
              <span className="flex items-center gap-2">
                <span>{member.avatar}</span>
                <span>{member.name}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="text-red-500">{member.damage}</span>
                {member.todayDmg > 0 ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                    +{member.todayDmg} сегодня
                  </span>
                ) : (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                    ⚠️ Не атаковал
                  </span>
                )}
              </div>
            </div>
            <ProgressBar
              value={totalDamage > 0 ? (member.damage / totalDamage) * 100 : 0}
              height={7}
              color="linear-gradient(90deg,#7c3aed,#a855f7)"
            />
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-[#f8f7ff] p-4 text-center text-sm font-black text-[var(--text-primary)]">
        Всего сегодня: <span className="text-red-500">{todayDamage}</span> урона из <span>{boss.maxHp}</span> HP
      </div>
    </div>
  );
};
