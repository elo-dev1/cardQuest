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
  const collection = useStore((state) => state.collection);
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

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-black text-white">Статистика</h1>
        <p className="text-sm font-bold text-white/50">Как растёт гильдия за неделю</p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: '🔥', value: getStreak(), label: 'дней' },
          { icon: '✅', value: completions.length, label: 'задач' },
          { icon: '⚔️', value: boss.hp === 0 ? 1 : 0, label: 'боссов' },
          { icon: '🃏', value: `${collection.length}/${CARD_LIBRARY.length}`, label: 'карточек' },
        ].map((item) => (
          <div key={item.label} className="card p-4 text-center">
            <div className="text-3xl">{item.icon}</div>
            <div className="gradient-text mt-2 text-[40px] font-black leading-none">{item.value}</div>
            <div className="mt-1 text-xs font-black uppercase text-[var(--text-muted)]">{item.label}</div>
          </div>
        ))}
      </section>

      <section className="card p-6">
        <h2 className="mb-5 text-lg font-black text-[var(--text-primary)]">Активность за 7 дней</h2>
        <div className="flex h-[140px] items-end justify-between gap-3">
          {days.map((date, index) => {
            const progress = getFamilyProgress(date);
            const isToday = index === days.length - 1;
            const color = isToday ? '#7c3aed' : progress.percent >= 70 ? '#22c55e' : progress.percent >= 35 ? '#f59e0b' : '#ef4444';
            return (
              <div key={date} className="group flex flex-1 flex-col items-center justify-end gap-2">
                <div className="relative w-full rounded-t-xl transition group-hover:brightness-110" style={{ height: `${Math.max(8, progress.percent)}%`, background: color }}>
                  <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 rounded-lg bg-gray-900 px-2 py-1 text-xs font-black text-white group-hover:block">
                    {progress.percent}%
                  </div>
                </div>
                <div className="text-xs font-black text-[var(--text-muted)]">{format(parseISO(date), 'EEEEE', { locale: ru })}</div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">Рейтинг</h2>
          <div className="space-y-4">
            {ranking.map((member, index) => (
              <div key={member.id}>
                <div className="mb-1 flex items-center justify-between text-sm font-black">
                  <span>{['🥇', '🥈', '🥉'][index] || `${index + 1}.`} {member.avatar} {member.name}</span>
                  <span>{member.xp} XP</span>
                </div>
                <ProgressBar value={(member.xp % 120) / 1.2} height={7} color="linear-gradient(90deg,#7c3aed,#f59e0b)" />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">По категориям</h2>
          <div className="space-y-4">
            {categoryStats.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-sm font-black">
                  <span>{item.category.icon} {item.category.label}</span>
                  <span>{item.total}</span>
                </div>
                <ProgressBar value={(item.total / maxCategory) * 100} height={7} color={`linear-gradient(90deg,${item.category.gradient})`} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-black text-white">Достижения (4/35)</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {achievements.map((achievement) => (
            <div key={achievement.title} className={`rounded-2xl p-4 text-center ${achievement.done ? 'bg-white' : achievement.secret ? 'bg-[#12112a]' : 'bg-gray-200 opacity-60'}`}>
              <div className="mb-2 text-3xl">{achievement.secret ? '🔮' : achievement.icon}</div>
              <div className={`text-sm font-black ${achievement.secret ? 'text-white' : 'text-[var(--text-primary)]'}`}>{achievement.title}</div>
              <div className={`mt-1 text-xs font-black ${achievement.done ? 'text-[var(--c-green)]' : achievement.secret ? 'text-white/40' : 'text-gray-500'}`}>
                {achievement.done ? '✓ выполнено' : 'закрыто'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
