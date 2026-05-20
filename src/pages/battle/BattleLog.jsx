import { motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';

const LOG_TYPE_STYLES = {
  damage: { icon: '⚔️', color: 'text-[var(--sage)]', bg: 'bg-[var(--sage-bg)]' },
  crit: { icon: '💥', color: 'text-[var(--sand)]', bg: 'bg-[var(--sand-bg)]' },
  attack: { icon: '🐲', color: 'text-[var(--clay)]', bg: 'bg-[var(--clay-bg)]' },
  phase: { icon: '⚠️', color: 'text-[var(--clay)]', bg: 'bg-[var(--clay-bg)]' },
  synergy: { icon: '✨', color: 'text-[var(--lavender)]', bg: 'bg-[var(--lavender-bg)]' },
  victory: { icon: '🏆', color: 'text-[var(--sand)]', bg: 'bg-[var(--sand-bg)]' },
  info: { icon: '📜', color: 'text-[var(--text-secondary)]', bg: 'bg-[var(--bg-elevated)]' },
};

export const BattleLog = () => {
  const boss = useStore((state) => state.boss);
  const logs = boss.logs || [];
  return (
    <div className="max-h-[260px] overflow-y-auto rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)] scrollbar-soft">
      <h2 className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">Журнал битвы</h2>
      <div className="space-y-2">
        {(!logs || logs.length === 0) ? (
          <p className="text-center text-sm font-medium text-[var(--text-tertiary)]">Ещё нет событий. Выполняй задачи!</p>
        ) : (
          logs.slice(0, 20).map((log) => {
            const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.info;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-[var(--r-md)] px-4 py-3 text-sm font-medium ${style.color} ${style.bg}`}
              >
                <span className="mr-2">{style.icon}</span>
                {log.text}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
