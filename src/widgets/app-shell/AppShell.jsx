import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { RightPanel } from '@/widgets/right-panel/RightPanel';
import { MobileHeader } from '@/widgets/mobile-header/MobileHeader';
import { TabBar } from '@/widgets/tab-bar/TabBar';
import { ProfileSelectScreen } from '@/features/profile-select/ProfileSelectScreen';
import { PackOpener } from '@/features/pack-opener/PackOpener';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import { GlobalConfetti } from '@/shared/ui/GlobalConfetti';
import { TaskEffect } from '@/shared/ui/TaskEffect';
import { ExchangeNotifications } from '@/features/card-exchange/ui/ExchangeNotifications';
import { PwaInstallBanner } from '@/widgets/pwa-install-banner/PwaInstallBanner';
import { PwaUpdatePrompt } from '@/widgets/pwa-update-prompt/PwaUpdatePrompt';
import '@/widgets/pwa-install-banner/PwaInstallBanner.css';
import '@/widgets/pwa-update-prompt/PwaUpdatePrompt.css';
import { useStore } from '@/shared/store/useStore';

export const AppShell = () => {
  const isSetupDone = useStore((state) => state.isSetupDone);

  if (!isSetupDone) return <Navigate to="/setup" replace />;

  return (
    <div className="app-shell">
      <aside className="sidebar hidden md:flex">
        <Sidebar />
      </aside>

      <main className="main-content">
        <MobileHeader />
        <div className="mobile-page-padding">
          <Outlet />
        </div>
      </main>

      <aside className="right-panel hidden lg:flex flex-col gap-3">
        <RightPanel />
      </aside>

      <TabBar className="md:hidden" />

      <ProfileSelectScreen />
      <PackOpener />
      <ToastContainer />
      <GlobalConfetti />
      <TaskEffect />
      <ExchangeNotifications />

      <PwaInstallBanner />
      <PwaUpdatePrompt />
    </div>
  );
};
