import { useStore } from '@/shared/store/useStore';

export const ThemeToggle = () => {
  const theme = useStore((state) => state.theme);
  const toggleTheme = useStore((state) => state.toggleTheme);

  return (
    <button
      type="button"
      aria-label="Переключить тему"
      className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/15"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};
