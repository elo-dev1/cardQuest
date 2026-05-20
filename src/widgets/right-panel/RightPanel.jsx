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
    <aside className="sticky top-6 h-fit w-[300px] shrink-0">
      {/* Guild block */}
      <div className="mb-3 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Гильдия</div>
            <h2 className="font-['DM_Serif_Display'] text-[17px] tracking-[-0.01em] text-[var(--text-primary)]">{family?.name}</h2>
          </div>
          <span className="badge badge-sand">
            ур. {family?.guild_level || 1}
          </span>
        </div>
        <div className="mt-3">
          <ProgressBar
            value={((family?.guild_xp || 0) % 120) / 1.2}
            height={6}
            variant="sage"
            label={`${familyProgress.completed}/${familyProgress.total} задач сегодня`}
          />
        </div>
      </div>

      {/* Family today block */}
      <div className="mb-3 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Семья сегодня</h3>
        <div className="space-y-2">
          {members.map((member) => {
            const progress = getMemberProgress(member.id);
            return (
              <div key={member.id} className="flex items-center gap-2.5">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--bg-elevated)] text-sm">{member.avatar}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
                    <span>{member.name}</span>
                    <span>{progress.completed}/{progress.total}</span>
                  </div>
                  <ProgressBar value={progress.percent} height={5} variant="sage" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Streak block */}
      {streak > 0 ? (
        <div className="mb-3 rounded-[var(--r-md)] bg-[var(--sand-bg)] px-4 py-3 text-center">
          <span className="font-['DM_Serif_Display'] text-[18px] text-[var(--sand)]">🔥 {streak} дней</span>
        </div>
      ) : null}

      {/* Boss block */}
      <div className="mb-3 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] border border-[var(--clay-bg)]">
        <div className="mb-2 flex items-center gap-3">
          <div className="text-2xl">{boss.emoji}</div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{boss.name}</h3>
            <div className="text-xs font-medium text-[var(--text-tertiary)]">
              {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label}
            </div>
          </div>
        </div>
        <ProgressBar value={bossHpPercent} height={8} variant="clay" />
        <div className="mt-2 flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
          <span>{boss.hp}/{boss.maxHp} HP</span>
          <span>{boss.daysLeft} дн.</span>
        </div>
        <button type="button" className="btn-secondary mt-3 w-full px-4 py-2 text-sm" onClick={() => navigate('/battle')}>
          ⚔️ К битве
        </button>
      </div>

      {/* Daily bonus block */}
      <div className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <button
          type="button"
          className={`w-full rounded-full px-4 py-2.5 text-sm font-medium daily-bonus-btn transition ${
            bonusClaimed
              ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-default'
              : 'bg-[var(--charcoal)] text-white'
          }`}
          disabled={bonusClaimed}
          onClick={handleBonus}
        >
          {bonusClaimed ? '🎁 Уже получено' : '🎁 +20 монет'}
        </button>
      </div>
    </aside>
  );
};
