import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { DIFFICULTY } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { CardView } from '@/entities/card/CardView';

export const HomePage = () => {
  const member = useStore((state) => state.getCurrentMember());
  const collection = useStore((state) => state.collection);
  const tasks = useStore((state) => (member ? state.getTasksForMember(member.id) : []));
  const progress = useStore((state) => (member ? state.getMemberProgress(member.id) : { completed: 0, total: 0, percent: 0 }));
  const completions = useStore((state) => state.completions);
  const todayRewards = tasks
    .filter((task) => completions.some((item) => item.taskId === task.id && item.memberId === member?.id))
    .reduce(
      (acc, task) => {
        const reward = DIFFICULTY[task.difficulty];
        return { xp: acc.xp + reward.xp, coins: acc.coins + reward.coins };
      },
      { xp: 0, coins: 0 },
    );
  const lastCards = collection
    .slice()
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
    .slice(0, 3)
    .map((item) => ({ ...item, card: CARD_LIBRARY.find((card) => card.id === item.cardId) }))
    .filter((item) => item.card);
  const earnedPack = progress.percent >= 80;

  const openPack = () => {
    window.dispatchEvent(new CustomEvent('open-pack', { detail: { packId: 'basic' } }));
  };

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="gradient-text text-3xl font-black">Добро пожаловать, {member?.name || 'герой'}! 👋</h1>
          <p className="mt-1 text-base font-bold text-white/60">Сегодня отличный день для подвигов</p>
        </div>
        <div className="rounded-xl bg-white/10 px-3 py-2 text-right text-xs font-black text-white/60">
          {format(new Date(), 'EEE, d MMM', { locale: ru })}
        </div>
      </header>

      <section className="card p-5">
        <div className="mb-4 grid grid-cols-3 gap-4">
          {[
            { value: `${progress.completed}/${progress.total}`, label: 'задач' },
            { value: `+${todayRewards.xp}`, label: 'XP' },
            { value: `+${todayRewards.coins}`, label: '💰' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-[#f8f7ff] p-4 text-center">
              <div className="text-[40px] font-black leading-none text-[var(--text-primary)]">{item.value}</div>
              <div className="mt-1 text-xs font-black uppercase text-[var(--text-muted)]">{item.label}</div>
            </div>
          ))}
        </div>
        <ProgressBar value={progress.percent} height={10} color="linear-gradient(90deg,#7c3aed,#a855f7)" />
        <div className="mt-2 text-sm font-black text-[var(--text-muted)]">
          {progress.completed}/{progress.total} задач выполнено
        </div>
        <Link to="/tasks" className="btn-primary mt-4 block w-full text-center">
          ✅ Перейти к задачам →
        </Link>
      </section>

      {earnedPack ? (
        <motion.section
          className="flex items-center gap-5 rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid h-[60px] w-[60px] shrink-0 place-items-center rounded-2xl bg-white/15 text-4xl glow-gold">🎁</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black">Пак почти в руках</h2>
            <p className="text-sm font-bold text-white/65">Выполните дневной план и откройте награды.</p>
            <div className="mt-3">
              <ProgressBar value={progress.percent} height={7} color="linear-gradient(90deg,#fbbf24,#f59e0b)" />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <button
              type="button"
              className="btn-primary px-4 py-2 text-sm"
              onClick={openPack}
            >
              Открыть пак
            </button>
            <button type="button" className="btn-ghost px-4 py-2 text-sm">
              Позже
            </button>
          </div>
        </motion.section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Последние карточки</h2>
          <Link to="/collection" className="text-sm font-black text-[var(--c-gold-light)]">
            Вся коллекция →
          </Link>
        </div>
        <div className="flex gap-3">
          {lastCards.map((item) => (
            <CardView key={item.card.id} card={item.card} count={item.count} isNew={item.isNew} />
          ))}
        </div>
      </section>

      <section className="card-dark p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="text-4xl">🧭</div>
          <div>
            <h2 className="text-lg font-black text-white">Квест недели: Ритм героев</h2>
            <p className="text-sm font-bold text-white/55">Выполните 50 семейных задач за неделю.</p>
          </div>
        </div>
        <ProgressBar value={46} height={9} color="linear-gradient(90deg,#22c55e,#f59e0b)" />
        <div className="mt-3 flex items-center justify-between text-sm font-black text-white/60">
          <span>Награда: редкий пак + 150 💰</span>
          <span>4 дня</span>
        </div>
      </section>
    </div>
  );
};
