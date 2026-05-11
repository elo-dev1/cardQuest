import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';

const toastStyles = {
  success: 'border-l-[4px] border-l-[var(--c-green)]',
  reward: 'border-l-[4px] border-l-[var(--c-gold)]',
  error: 'border-l-[4px] border-l-[var(--c-red)]',
  info: 'border-l-[4px] border-l-blue-500',
  exchange: 'border-l-[4px] border-l-[var(--c-purple)]',
};

const toastIcon = {
  success: '✅',
  reward: '🏆',
  error: '⚠️',
  info: 'ℹ️',
  exchange: '🔄',
};

export const ToastContainer = () => {
  const toasts = useStore((state) => state.toasts);

  return (
    <div className="fixed bottom-6 right-6 z-[9998] flex w-[340px] max-w-[calc(100vw-32px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className={`card flex flex-col gap-3 px-4 py-3 text-sm font-bold text-[var(--text-primary)] ${
              toastStyles[toast.type] || toastStyles.info
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg leading-none">{toastIcon[toast.type] || toastIcon.info}</span>
              <span>{toast.message}</span>
            </div>
            {toast.type === 'exchange' && toast.data?.onAccept && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toast.data.onAccept}
                  className="flex-1 rounded-lg bg-[var(--c-green)] px-3 py-2 text-xs font-black text-white transition hover:opacity-90"
                >
                  ✅ Принять
                </button>
                <button
                  type="button"
                  onClick={toast.data.onReject}
                  className="flex-1 rounded-lg bg-gray-200 px-3 py-2 text-xs font-black text-gray-600 transition hover:bg-gray-300"
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
