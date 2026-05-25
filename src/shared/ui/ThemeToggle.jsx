import { useStore } from '@/shared/store/useStore';

export const ThemeToggle = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      aria-label="Переключить тему"
      className="grid h-10 w-10 place-items-center rounded-full border border-[var(--border-soft)] bg-[var(--bg-elevated)] text-xl transition hover:bg-[var(--bg-surface)]"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark'
        ? <img src="/common/light.png" alt="" className="h-7 w-7" />
        : <img src="/common/night.png" alt="" className="h-7 w-7" />
      }
    </button>
  );
};
