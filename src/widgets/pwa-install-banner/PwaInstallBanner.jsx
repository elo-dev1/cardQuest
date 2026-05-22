import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { promptInstall, isInstallable, isStandalone } from '@/shared/lib/pwa';

export const PwaInstallBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const check = () => {
      if (isInstallable()) {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setVisible(true);
        }
      }
    };

    window.addEventListener('pwa-install-ready', check);
    check();

    return () => window.removeEventListener('pwa-install-ready', check);
  }, []);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="pwa-install-banner"
        >
          <div className="pwa-banner-content">
            <span className="pwa-banner-icon">🃏</span>
            <div className="pwa-banner-text">
              <p className="pwa-banner-title">Установите Card Quest</p>
              <p className="pwa-banner-subtitle">
                Быстрый доступ с главного экрана
              </p>
            </div>
          </div>
          <div className="pwa-banner-actions">
            <button
              type="button"
              className="pwa-banner-dismiss"
              onClick={handleDismiss}
            >
              Позже
            </button>
            <button
              type="button"
              className="pwa-banner-install"
              onClick={handleInstall}
            >
              Установить
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
