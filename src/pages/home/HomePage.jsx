import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { useStore } from '@/shared/store/useStore';
import { todayKey } from '@/shared/lib/date';
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
      .filter((task) => completions.some((item) => item.taskId === task.id && item.memberId === member?.id && item.date === todayKey()))
      .reduce(
        (acc, task) => {
          const base = { easy: 10, medium: 20, hard: 40 }[task.difficulty] || 10;
          return { xp: acc.xp + Math.round(base / 2), coins: acc.coins + Math.round(base / 2) };
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
    <div className="space-y-6 -mt-3 md:mt-0">
      {/* Приветствие — мобильная версия: только дата */}
      <header className="hidden md:block">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-[28px] tracking-[-0.02em] text-[var(--text-primary)]">
              Привет, {member?.name || 'герой'} 👋
            </h1>
            <p className="mt-1 text-[13px] font-medium text-[var(--text-secondary)]">
              {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
            </p>
          </div>
        </div>
      </header>

      {/* Мобильная дата — только на мобайле */}
      <div className="block md:hidden h-8 flex items-center">
        <span className="text-xs font-medium text-[var(--text-tertiary)]">
          {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
        </span>
      </div>

      {/* Стат-плитки — мобильная версия */}
      <section className="stat-tiles-mobile md:grid md:grid-cols-3 md:gap-[10px]">
        {[
          { value: `${progress.completed}/${progress.total}`, label: 'задач', icon: '/common/completed.png' },
          { value: `+${todayRewards.xp}`, label: 'XP', icon: '/common/xp.png' },
          { value: `+${todayRewards.coins}`, label: 'монет', icon: '/common/money.png' },
        ].map((item) => (
          <div key={item.label} className="stat-tile-mobile md:rounded-[var(--r-lg)] md:bg-[var(--bg-surface)] md:p-4 md:text-center md:shadow-[var(--shadow-card)] md:border md:border-[var(--border-soft)]">
            <div className="text-2xl mb-1 hidden md:block"><img src={item.icon} alt="" className="inline-block w-7 h-7" /></div>
            <div className="stat-tile-number md:font-['DM_Serif_Display'] md:text-[28px] md:leading-none md:text-[var(--text-primary)]">{item.value}</div>
            <div className="stat-tile-label md:mt-1 md:text-[11px] md:font-medium md:uppercase md:tracking-wide md:text-[var(--text-tertiary)]">{item.label}</div>
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
          <div className="grid h-[48px] w-[48px] md:h-[64px] md:w-[64px] shrink-0 place-items-center rounded-[var(--r-md)] bg-[var(--sand-bg)] text-3xl md:text-4xl">🎁</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-[var(--text-primary)]">До следующего пака</h2>
            <div className="mt-2">
              <ProgressBar value={progress.percent} height={7} variant="sand" />
            </div>
          </div>
          <button
            type="button"
            className="btn-primary shrink-0 px-4 md:px-6 py-2.5 text-sm"
            onClick={openPack}
          >
            Открыть
          </button>
        </motion.section>
      ) : null}

      {/* Последние карточки — горизонтальный скролл на мобайле */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Коллекция</h2>
          <Link to="/collection" className="text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
            Все →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 md:overflow-x-visible md:pb-0" style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
          {lastCards.map((item) => (
            <div key={item.card.id} className="shrink-0" style={{ scrollSnapAlign: 'start', width: '80px' }}>
              <CardView card={item.card} count={item.count} isNew={item.isNew} />
            </div>
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
          <span>Награда: редкий пак + 150 <img src="/common/money.png" alt="" className="inline-block w-4 h-4 align-text-bottom" /></span>
          <span>4 дня</span>
        </div>
      </section>
    </div>
  );
};
