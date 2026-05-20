import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';

const toastStyles = {
  success: 'border-l-[4px] border-l-[var(--sage)]',
  reward: 'border-l-[4px] border-l-[var(--sand)]',
  error: 'border-l-[4px] border-l-[var(--clay)]',
  info: 'border-l-[4px] border-l-[var(--slate)]',
  exchange: 'border-l-[4px] border-l-[var(--lavender)]',
  damage: 'border-l-[4px] border-l-[var(--sage)]',
  crit: 'border-l-[4px] border-l-[var(--sand)]',
  boss_attack: 'border-l-[4px] border-l-[var(--clay)]',
  boss_phase: 'border-l-[4px] border-l-[var(--clay-light)]',
  victory: 'border-l-[4px] border-l-[var(--sand)]',
};

const toastIcon = {
  success: '✅',
  reward: '🏆',
  error: '⚠️',
  info: 'ℹ️',
  exchange: '🔄',
  damage: '⚔️',
  crit: '💥',
  boss_attack: '🐲',
  boss_phase: '⚠️',
  victory: '🏆',
};

const toastDuration = {
  damage: 2000,
  crit: 3000,
  boss_attack: 3000,
  boss_phase: 4000,
  victory: 4000,
};

export const ToastContainer = () => {
  const toasts = useStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 16, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.98 }}
            className={`rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4 text-sm font-medium text-[var(--text-primary)] shadow-md ${
              toastStyles[toast.type] || toastStyles.info
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{toastIcon[toast.type] || toastIcon.info}</span>
              <span>{toast.message}</span>
            </div>
            {toast.type === 'exchange' && toast.data?.onAccept && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={toast.data.onAccept}
                  className="flex-1 rounded-full bg-[var(--sage)] px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  ✅ Принять
                </button>
                <button
                  type="button"
                  onClick={toast.data.onReject}
                  className="flex-1 rounded-full bg-[var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface)]"
                >
                  ❌ Отклонить
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
