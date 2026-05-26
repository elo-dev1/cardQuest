import { useEffect } from 'react';
import { AppRouter } from '@/app/providers/RouterProvider';
import { useStore } from '@/shared/store/useStore';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import { ExchangeNotifications } from '@/features/card-exchange/ui/ExchangeNotifications';
import { subscribeToPush } from '@/shared/lib/pwa';

export const App = () => {
  const theme = useStore((state) => state.theme);
  const isSetupDone = useStore((state) => state.isSetupDone);
  const loadExchanges = useStore((state) => state.loadExchanges);
  const family = useStore((state) => state.family);
  const member = useStore((state) => state.getCurrentMember());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    if (isSetupDone) {
      loadExchanges();
    }
  }, [isSetupDone, loadExchanges]);

  useEffect(() => {
    if (isSetupDone && family?.id && member?.id) {
      subscribeToPush(member.id, family.id);
    }
  }, [isSetupDone, family?.id, member?.id]);

  return (
    <>
      <AppRouter />
      <ToastContainer />
      <ExchangeNotifications />
    </>
  );
};
