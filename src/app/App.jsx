import { useEffect } from 'react';
import { AppRouter } from '@/app/providers/RouterProvider';
import { useStore } from '@/shared/store/useStore';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import { ExchangeNotifications } from '@/features/card-exchange/ui/ExchangeNotifications';

export const App = () => {
  const theme = useStore((state) => state.theme);
  const isSetupDone = useStore((state) => state.isSetupDone);
  const loadExchanges = useStore((state) => state.loadExchanges);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (isSetupDone) {
      loadExchanges();
    }
  }, [isSetupDone, loadExchanges]);

  return (
    <>
      <AppRouter />
      <ToastContainer />
      <ExchangeNotifications />
    </>
  );
};
