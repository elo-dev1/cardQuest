import { NavLink } from "react-router-dom";
import { ProgressBar } from "@/shared/ui/ProgressBar";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { HERO_CLASSES } from "@/shared/data/memberData";
import { useStore } from "@/shared/store/useStore";

const navItems = [
  { to: "/home", label: "Главная", icon: "🏠" },
  { to: "/tasks", label: "Задачи", icon: "✅" },
  { to: "/collection", label: "Коллекция", icon: "🃏" },
  { to: "/shop", label: "Магазин", icon: "🛒" },
  { to: "/battle", label: "Битва", icon: "⚔️" },
  { to: "/stats", label: "Статистика", icon: "📊" },
  { to: "/family", label: "Семья", icon: "👨‍👩‍👧" },
  { to: "/settings", label: "Настройки", icon: "⚙️" },
];

export const Sidebar = () => {
  const family = useStore((state) => state.family);
  const member = useStore((state) => state.getCurrentMember());
  const heroClass = member ? HERO_CLASSES[member.classId] : null;
  const levelProgress = member ? member.xp % 120 : 0;

  return (
    <aside className="sticky top-6 h-fit w-[220px] shrink-0 rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-4">
      <div className="mb-6 px-2 font-['DM_Serif_Display'] text-xl tracking-[-0.02em] text-[var(--text-primary)]">
        ⚔️ Card Quest
      </div>

      {member ? (
        <button
          type="button"
          className="mb-5 w-full rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-3 text-left transition hover:bg-[var(--bg-surface)]"
          title="Сменить участника"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-surface)] text-xl">
              {member.avatar}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {member.name}
              </div>
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                {heroClass?.icon} {heroClass?.label} · ур. {member.level}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={(levelProgress / 120) * 100}
              height={6}
              variant="sand"
            />
          </div>
        </button>
      ) : null}

      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-[var(--r-md)] px-3 py-2.5 text-sm font-medium transition nav-item ${
                isActive
                  ? 'nav-active bg-[var(--charcoal)] text-white font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <span className="w-5 text-center text-[17px]">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <hr className="my-4 border-[var(--border-soft)]" />

      <div className="mb-3 flex items-center justify-between rounded-full bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
        <span>💰 {family?.coins ?? 0}</span>
        <span>💎 {family?.gems ?? 0}</span>
      </div>

      <ThemeToggle />
    </aside>
  );
};
