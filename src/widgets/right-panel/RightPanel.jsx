import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { useStore } from '@/shared/store/useStore';
import { todayKey } from '@/shared/lib/date';

export const RightPanel = () => {
  const navigate = useNavigate();
  const family = useStore((state) => state.family);
  const members = useStore((state) => state.members);
  const boss = useStore((state) => state.boss);
  const getMemberProgress = useStore((state) => state.getMemberProgress);
  const getFamilyProgress = useStore((state) => state.getFamilyProgress);
  const getStreak = useStore((state) => state.getStreak);
  const claimDailyBonus = useStore((state) => state.claimDailyBonus);
  const addToast = useStore((state) => state.addToast);
  const streak = getStreak();
  const familyProgress = getFamilyProgress();
  const bonusClaimed = family?.dailyBonusClaimedAt === todayKey();
  const bossHpPercent = boss.maxHp ? Math.round((boss.hp / boss.maxHp) * 100) : 0;

  const handleBonus = () => {
    if (claimDailyBonus()) addToast('Ежедневный бонус получен: +20 монет 🎁', 'reward');
  };

  return (
    <aside className="sticky top-6 h-fit w-[300px] shrink-0 rounded-[20px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-5">
      <section className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-white/45">Гильдия</div>
            <h2 className="truncate text-lg font-black text-white">{family?.name}</h2>
          </div>
          <span className="rounded-full bg-[var(--c-purple-pale)] px-3 py-1 text-xs font-black text-white">
            ур. {family?.guild_level || 1}
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar
            value={(family?.guild_xp || 0) % 120}
            height={8}
            color="linear-gradient(90deg,#7c3aed,#a855f7)"
            label={`${familyProgress.completed}/${familyProgress.total} задач сегодня`}
          />
        </div>
      </section>

      <section className="mb-5">
        <h3 className="mb-3 text-sm font-black text-white">Семья сегодня</h3>
        <div className="space-y-3">
          {members.map((member) => {
            const progress = getMemberProgress(member.id);
            return (
              <div key={member.id} className="grid grid-cols-[32px_1fr_auto] items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">{member.avatar}</div>
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                    <span>{member.name}</span>
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <ProgressBar value={progress.percent} height={5} color="linear-gradient(90deg,#22c55e,#a3e635)" />
                </div>
                <span className="text-xs font-black text-white/50">{progress.percent}%</span>
              </div>
            );
          })}
        </div>
      </section>

      {streak > 0 ? (
        <div className="mb-5 rounded-xl bg-orange-500/10 px-4 py-3 text-sm font-black text-orange-300">
          🔥 {streak} дней подряд!
        </div>
      ) : null}

      <section className="mb-5 rounded-2xl bg-white/5 p-4">
        <div className="mb-2 flex items-center gap-3">
          <div className="text-3xl">{boss.emoji}</div>
          <div>
            <h3 className="text-sm font-black text-white">{boss.name}</h3>
            <div className="text-xs font-bold text-white/45">
              Слабость: {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label}
            </div>
          </div>
        </div>
        <ProgressBar value={bossHpPercent} height={9} color="linear-gradient(90deg,#ef4444,#f97316)" />
        <div className="mt-2 flex items-center justify-between text-xs font-extrabold text-white/60">
          <span>{boss.hp}/{boss.maxHp} HP</span>
          <span>{boss.daysLeft} дня</span>
        </div>
        <button type="button" className="btn-secondary mt-3 w-full px-4 py-2 text-sm" onClick={() => navigate('/battle')}>
          Атаковать →
        </button>
      </section>

      <section className="rounded-2xl bg-[var(--c-purple-pale)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-white">Ежедневный бонус</h3>
            <p className="text-xs font-bold text-white/50">🎁 +20 монет</p>
          </div>
          <div className="text-3xl">🎁</div>
        </div>
        <button type="button" className="btn-primary w-full px-4 py-2 text-sm" disabled={bonusClaimed} onClick={handleBonus}>
          {bonusClaimed ? 'Забрано ✓' : 'Забрать'}
        </button>
      </section>
    </aside>
  );
};
