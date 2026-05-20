import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { DIFFICULTY } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { CardView } from '@/entities/card/CardView';

export const HomePage = () => {
  const member = useStore((state) => state.getCurrentMember());
  const collection = useStore((state) => (member ? state.getCollectionForMember(member.id) : []));
  const tasks = useStore((state) => (member ? state.getTasksForMember(member.id) : []));
  const progress = useStore((state) => (member ? state.getMemberProgress(member.id) : { completed: 0, total: 0, percent: 0 }));
  const completions = useStore((state) => state.completions);
  
  const todayRewards = useMemo(() => {
    return tasks
      .filter((task) => completions.some((item) => item.taskId === task.id && item.memberId === member?.id))
      .reduce(
        (acc, task) => {
          const reward = DIFFICULTY[task.difficulty];
          return { xp: acc.xp + reward.xp, coins: acc.coins + reward.coins };
        },
        { xp: 0, coins: 0 },
      );
  }, [tasks, completions, member?.id]);

  const lastCards = useMemo(() => {
    return collection
      .slice()
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
      .slice(0, 3)
      .map((item) => ({ ...item, card: CARD_LIBRARY.find((card) => card.id === item.cardId) }))
      .filter((item) => item.card);
  }, [collection]);
  const earnedPack = progress.percent >= 80;

  const openPack = () => {
    window.dispatchEvent(new CustomEvent('open-pack', { detail: { packId: 'basic' } }));
  };

  return (
    <div className="space-y-6">
      {/* Приветствие */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-['DM_Serif_Display'] text-[28px] tracking-[-0.02em] text-[var(--text-primary)]">
            Привет, {member?.name || 'герой'} 👋
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)]">
            {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
          </p>
        </div>
      </header>

      {/* Стат-плитки */}
      <section className="grid grid-cols-3 gap-[10px]">
        {[
          { value: `${progress.completed}/${progress.total}`, label: 'задач', icon: '✅' },
          { value: `+${todayRewards.xp}`, label: 'XP', icon: '⭐' },
          { value: `+${todayRewards.coins}`, label: 'монет', icon: '💰' },
        ].map((item) => (
          <div key={item.label} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 text-center shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
            <div className="text-2xl mb-1">{item.icon}</div>
            <div className="font-['DM_Serif_Display'] text-[28px] leading-none text-[var(--text-primary)]">{item.value}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-tertiary)]">{item.label}</div>
          </div>
        ))}
      </section>

      <ProgressBar value={progress.percent} height={10} variant="sage" />

      {/* Баннер прогресса пака */}
      {earnedPack ? (
        <motion.section
          className="flex items-center gap-5 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid h-[64px] w-[64px] shrink-0 place-items-center rounded-[var(--r-md)] bg-[var(--sand-bg)] text-4xl">🎁</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[var(--text-primary)]">До следующего пака</h2>
            <div className="mt-2">
              <ProgressBar value={progress.percent} height={7} variant="sand" />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0 px-6 py-2.5 text-sm"
            onClick={openPack}
          >
            Открыть
          </button>
        </motion.section>
      ) : null}

      {/* Последние карточки */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Коллекция</h2>
          <Link to="/collection" className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            Все →
          </Link>
        </div>
        <div className="flex gap-3">
          {lastCards.map((item) => (
            <CardView key={item.card.id} card={item.card} count={item.count} isNew={item.isNew} />
          ))}
        </div>
      </section>

      {/* Квест недели */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]" style={{ borderLeft: '4px solid var(--sage)' }}>
        <div className="mb-3">
          <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Квест недели: Ритм героев</h2>
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">Выполните 50 семейных задач за неделю.</p>
        </div>
        <ProgressBar value={46} height={8} variant="sage" />
        <div className="mt-3 flex items-center justify-between text-[13px] font-medium text-[var(--text-secondary)]">
          <span>Награда: редкий пак + 150 💰</span>
          <span>4 дня</span>
        </div>
      </section>
    </div>
  );
};
