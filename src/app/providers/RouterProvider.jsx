import { useEffect } from 'react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/widgets/app-shell/AppShell';
import { AuthPage } from '@/pages/auth/ui/AuthPage';
import { JoinPage } from '@/pages/join/ui/JoinPage';
import { SetupPage } from '@/pages/setup/SetupPage';
import { HomePage } from '@/pages/home/HomePage';
import { TasksPage } from '@/pages/tasks/TasksPage';
import { CollectionPage } from '@/pages/collection/CollectionPage';
import { ShopPage } from '@/pages/shop/ShopPage';
import { BattlePage } from '@/pages/battle/BattlePage';
import { StatsPage } from '@/pages/stats/StatsPage';
import { FamilyPage } from '@/pages/family/FamilyPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { useAuth } from '@/features/auth/model/useAuth';
import { useStore } from '@/shared/store/useStore';

const SplashScreen = () => (
  <div
    className="grid min-h-screen place-items-center p-6 text-center text-white"
    style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), #1a1040' }}
  >
    <div>
      <div className="float-soft mb-4 text-6xl">⚔️</div>
      <div className="gradient-text text-3xl font-black">Card Quest</div>
      <div className="mt-2 text-sm font-bold text-white/50">Загружаем гильдию...</div>
    </div>
  </div>
);

export const AppRouter = () => {
  const { userId, loading: authLoading } = useAuth();
  const loadAll = useStore((state) => state.loadAll);
  const loadedUserId = useStore((state) => state.authUserId);
  const isSetupDone = useStore((state) => state.isSetupDone);
  const isLoading = useStore((state) => state.isLoading);
  const isUserDataReady = !userId || loadedUserId === userId;

  useEffect(() => {
    if (!authLoading && userId) loadAll(userId);
  }, [authLoading, loadAll, userId]);

  const AuthGuard = () => {
    if (authLoading || (userId && !isUserDataReady) || isLoading) return <SplashScreen />;
    if (!userId) return <Navigate to="/auth" replace />;
    return <Outlet />;
  };

  const FamilyGuard = () => {
    if (authLoading || (userId && !isUserDataReady) || isLoading) return <SplashScreen />;
    if (!userId) return <Navigate to="/auth" replace />;
    if (!isSetupDone) return <Navigate to="/setup" replace />;
    return <Outlet />;
  };

  const RootRedirect = () => {
    if (authLoading || (userId && !isUserDataReady) || isLoading) return <SplashScreen />;
    if (!userId) return <Navigate to="/auth" replace />;
    if (!isSetupDone) return <Navigate to="/setup" replace />;
    return <Navigate to="/home" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/join/:code" element={<JoinPage />} />
        <Route path="/reset-password" element={<AuthPage />} />

        <Route element={<AuthGuard />}>
          <Route path="/setup" element={<SetupPage />} />
          <Route element={<FamilyGuard />}>
            <Route element={<AppShell />}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/battle" element={<BattlePage />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/family" element={<FamilyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
