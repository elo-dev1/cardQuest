import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { lastDays } from '@/shared/lib/date';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';

const achievements = [
  { icon: '🔥', title: 'Первый стрик', done: true },
  { icon: '✅', title: '10 задач', done: true },
  { icon: '🃏', title: 'Коллекционер', done: true },
  { icon: '⚔️', title: 'Первый удар', done: true },
  { icon: '📚', title: 'Мудрец', done: false },
  { icon: '🏃', title: 'Скорость', done: false },
  { icon: '🏠', title: 'Порядок', done: false },
  { icon: '🔮', title: '???', done: false, secret: true },
];

export const StatsPage = () => {
  const members = useStore((state) => state.members);
  const tasks = useStore((state) => state.tasks);
  const completions = useStore((state) => state.completions);
  const memberCollections = useStore((state) => state.memberCollections);
  const boss = useStore((state) => state.boss);
  const getStreak = useStore((state) => state.getStreak);
  const getFamilyProgress = useStore((state) => state.getFamilyProgress);
  const days = lastDays(7);
  const ranking = members.slice().sort((a, b) => b.xp - a.xp);
  const categoryStats = Object.entries(CATEGORIES)
    .filter(([key]) => key !== 'special')
    .map(([key, category]) => {
      const total = completions.filter((completion) => tasks.find((task) => task.id === completion.taskId)?.category === key).length;
      return { key, category, total };
    });
  const maxCategory = Math.max(1, ...categoryStats.map((item) => item.total));
  const totalUniqueCards = Object.values(memberCollections)
    .flat()
    .reduce((acc, item) => acc.add(item.cardId), new Set()).size;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Статистика</h1>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Как растёт гильдия за неделю</p>
      </header>

      {/* Стрик — hero-секция */}
      <section className="rounded-[var(--r-lg)] bg-[var(--sand-bg)] p-8 text-center">
        <div className="text-5xl mb-2">🔥</div>
        <div className="font-['DM_Serif_Display'] text-[64px] leading-none text-[var(--sand)]">{getStreak()}</div>
        <div className="mt-1 text-sm font-medium text-[var(--text-secondary)]">дней подряд</div>
      </section>

      {/* Summary cards */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: '✅', value: completions.length, label: 'задач' },
          { icon: '⚔️', value: boss.hp === 0 ? 1 : 0, label: 'боссов' },
          { icon: '🃏', value: `${totalUniqueCards}/${CARD_LIBRARY.length}`, label: 'карточек' },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 text-center shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="font-['DM_Serif_Display'] text-[40px] leading-none text-[var(--text-primary)]">{item.value}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{item.label}</div>
          </div>
        ))}
      </section>

      {/* График 7 дней */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <h2 className="mb-5 text-[15px] font-semibold text-[var(--text-primary)]">Активность за 7 дней</h2>
        <div className="flex h-[160px] items-end justify-between gap-3">
          {days.map((date, index) => {
            const progress = getFamilyProgress(date);
            const isToday = index === days.length - 1;
            const barHeight = Math.max(4, (progress.percent / 100) * 120);
            const bgColor = isToday ? 'var(--charcoal)' : progress.percent >= 70 ? 'var(--sage-bg)' : progress.percent >= 35 ? 'var(--sand-bg)' : 'var(--clay-bg)';
            return (
              <div key={date} className="group flex flex-1 flex-col items-center justify-end gap-2">
                <div className="relative w-full rounded-t-xl transition group-hover:brightness-95" style={{ height: `${barHeight}px`, background: bgColor }}>
                  <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded-lg bg-[var(--charcoal)] px-2 py-1 text-xs font-medium text-white group-hover:block">
                    {progress.percent}%
                  </div>
                </div>
                <div className="text-xs font-medium text-[var(--text-tertiary)]">{format(parseISO(date), 'EEEEE', { locale: ru })}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Рейтинг */}
        <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">Рейтинг</h2>
          <div className="space-y-4">
            {ranking.map((member, index) => (
              <div key={member.id} className={index === 0 ? 'rounded-[var(--r-md)] bg-[var(--sand-bg)] p-3' : ''}>
                <div className="mb-1 flex items-center justify-between text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <span className="font-['DM_Serif_Display'] text-lg">{['🥇', '🥈', '🥉'][index] || `${index + 1}.`}</span>
                    <span>{member.avatar} {member.name}</span>
                  </span>
                  <span className="text-[var(--text-secondary)]">{member.xp} XP</span>
                </div>
                <ProgressBar value={(member.xp % 120) / 1.2} height={6} variant="sage" />
              </div>
            ))}
          </div>
        </section>

        {/* По категориям */}
        <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--text-primary)]">По категориям</h2>
          <div className="space-y-4">
            {categoryStats.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-sm font-medium">
                  <span>{item.category.icon} {item.category.label}</span>
                  <span className="text-[var(--text-secondary)]">{item.total}</span>
                </div>
                <ProgressBar value={(item.total / maxCategory) * 100} height={6} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Достижения */}
      <section>
        <h2 className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">Достижения (4/35)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {achievements.map((achievement) => (
            <div key={achievement.title} className={`rounded-[var(--r-md)] p-4 text-center ${achievement.done ? 'bg-[var(--bg-surface)] shadow-[var(--shadow-card)] border border-[var(--border-soft)]' : achievement.secret ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--bg-elevated)] opacity-60'}`}>
              <div className="mb-2 text-3xl">{achievement.secret ? '🔮' : achievement.icon}</div>
              <div className={`text-sm font-medium ${achievement.secret ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{achievement.title}</div>
              <div className={`mt-1 text-xs font-medium ${achievement.done ? 'text-[var(--sage)]' : achievement.secret ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-tertiary)]'}`}>
                {achievement.done ? '✓ выполнено' : 'закрыто'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
