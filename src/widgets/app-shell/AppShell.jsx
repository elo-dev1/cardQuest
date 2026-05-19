import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/sidebar/Sidebar';
import { RightPanel } from '@/widgets/right-panel/RightPanel';
import { ProfileSelectScreen } from '@/features/profile-select/ProfileSelectScreen';
import { PackOpener } from '@/features/pack-opener/PackOpener';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import { GlobalConfetti } from '@/shared/ui/GlobalConfetti';
import { TaskEffect } from '@/shared/ui/TaskEffect';
import { useStore } from '@/shared/store/useStore';

export const AppShell = () => {
  const isSetupDone = useStore((state) => state.isSetupDone);

  if (!isSetupDone) return <Navigate to="/setup" replace />;

  return (
    <div style={{ background: 'var(--bg-app)' }} className="min-h-screen">
      <div className="desktop-shell mx-auto flex max-w-[1400px] gap-5 p-6">
        <Sidebar />
        <main className="min-w-0 flex-1 xl:max-w-[720px]">
          <Outlet />
        </main>
        <RightPanel />
      </div>
      <ProfileSelectScreen />
      <PackOpener />
      <ToastContainer />
      <GlobalConfetti />
      <TaskEffect />
    </div>
  );
};
