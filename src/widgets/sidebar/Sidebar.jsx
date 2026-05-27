import { NavLink, useNavigate } from 'react-router-dom';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { useStore } from '@/shared/store/useStore';

const navItems = [
  { to: "/home", label: "Главная", iconSrc: "/sidebar/home.png" },
  { to: "/tasks", label: "Задачи", iconSrc: "/sidebar/tasks.png" },
  { to: "/collection", label: "Коллекция", iconSrc: "/sidebar/collections.png" },
  { to: "/shop", label: "Магазин", iconSrc: "/sidebar/shop.png" },
  { to: "/battle", label: "Битва", iconSrc: "/sidebar/fight.png" },
  { to: "/stats", label: "Статистика", iconSrc: "/sidebar/stats.png" },
  { to: "/family", label: "Семья", iconSrc: "/sidebar/family.png" },
  { to: "/settings", label: "Настройки", iconSrc: "/sidebar/settings.png" },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const family = useStore((state) => state.family);
  const member = useStore((state) => state.getCurrentMember());
  const heroClass = member ? HERO_CLASSES[member.classId] : null;
  const levelProgress = member ? member.xp % 120 : 0;

  return (
    <aside className="sticky top-6 h-fit w-[220px] shrink-0 rounded-[var(--r-lg)] bg-[var(--bg-sidebar)] p-4">
      <div className="mb-6 px-2 font-['DM_Serif_Display'] text-xl tracking-[-0.02em] text-[var(--text-primary)]">
        ⚔️ Card Quest
      </div>

      {member ? (
        <button
          type="button"
          className="mb-5 w-full rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-3 text-left transition hover:bg-[var(--bg-surface)] border border-[var(--border-soft)]"
          title="Профиль"
          onClick={() => navigate('/profile')}
        >
          <div className="flex items-center gap-3">
            <MemberAvatar avatar={member.avatar} className="h-9 w-9 rounded-full bg-[var(--bg-surface)] text-xl" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {member.name}
              </div>
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                {heroClass?.iconSrc ? <img src={heroClass.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> : heroClass?.icon} {heroClass?.label} · ур. {member.level}
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
            <img src={item.iconSrc} alt="" className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <hr className="my-4 border-[var(--border-soft)]" />

      <div className="mb-3 flex items-center justify-between rounded-full bg-[var(--bg-elevated)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
        <span><img src="/common/money.png" alt="" className="inline-block w-5 h-5 align-text-bottom" /> {family?.coins ?? 0}</span>
      </div>

      <ThemeToggle />
    </aside>
  );
};
