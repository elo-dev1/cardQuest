import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PwaUpdatePrompt = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(true);
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  const handleUpdate = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="pwa-update-prompt"
        >
          <span>Доступна новая версия</span>
          <button type="button" onClick={handleUpdate}>
            Обновить
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
