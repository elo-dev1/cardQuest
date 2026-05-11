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
    <aside className="sticky top-6 h-fit w-[240px] shrink-0 rounded-[20px] border border-[var(--border)] bg-[var(--bg-sidebar)] p-5">
      <div className="gradient-text mb-5 text-xl font-black">⚔️ Card Quest</div>

      {member ? (
        <button
          type="button"
          className="mb-5 w-full rounded-[14px] border border-[var(--border)] bg-[var(--c-purple-pale)] p-3 text-left transition hover:bg-white/10"
          title="Сменить участника"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xl">
              {member.avatar}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-black text-white">
                {member.name}
              </div>
              <div className="text-xs font-bold text-white/55">
                {heroClass?.icon} {heroClass?.label} · ур. {member.level}
              </div>
            </div>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={(levelProgress / 120) * 100}
              height={6}
              color="linear-gradient(90deg,#fde68a,#f59e0b)"
            />
          </div>
        </button>
      ) : null}

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-xl px-3.5 py-2.5 text-sm font-extrabold transition ${
                isActive
                  ? "border-l-[3px] border-l-[var(--c-purple-mid)] bg-[rgba(124,58,237,0.2)] text-white glow-purple"
                  : "text-white/50 hover:bg-white/5 hover:text-white/80"
              }`
            }
          >
            <span className="mr-2 inline-block w-5">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <hr className="my-5 border-white/10" />

      <div className="mb-4 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-white">
        <span>💰 {family?.coins ?? 0}</span>
        <span>💎 {family?.gems ?? 0}</span>
      </div>

      <ThemeToggle />
    </aside>
  );
};
