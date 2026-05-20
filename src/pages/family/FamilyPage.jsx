import { HERO_CLASSES } from '@/shared/data/memberData';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { BACKGROUND_TYPES } from '@/shared/data/shopItems';

export const FamilyPage = () => {
  const family = useStore((state) => state.family);
  const members = useStore((state) => state.members);
  const getMemberProgress = useStore((state) => state.getMemberProgress);
  const addToast = useStore((state) => state.addToast);
  const activeBg = BACKGROUND_TYPES.find((bg) => bg.id === family?.activeBackground);

  const podium = members.slice().sort((a, b) => b.xp - a.xp);
  const [second, first, third] = [podium[1], podium[0], podium[2]];
  const podiumItems = [
    { member: second, medal: '🥈', avatar: 'h-14 w-14 text-3xl', xp: 'text-2xl', y: 'translate-y-2' },
    { member: first, medal: '🥇', avatar: 'h-[72px] w-[72px] text-4xl', y: '-translate-y-5' },
    { member: third, medal: '🥉', avatar: 'h-14 w-14 text-3xl', xp: 'text-2xl', y: 'translate-y-2' },
  ].filter((item) => item.member);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Семья</h1>
        <p className="text-[13px] font-medium text-[var(--text-secondary)]">Герои, уровни и общий челлендж</p>
      </header>

      {/* Пьедестал */}
      <section
        className="rounded-[var(--r-lg)] overflow-hidden p-8"
        style={
          activeBg
            ? { 
                backgroundImage: `url(${activeBg.image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
              }
            : { background: 'linear-gradient(to bottom, var(--bg-surface), var(--sand-bg))' }
        }
      >
        <div className="flex items-end justify-center gap-8">
          {podiumItems.map(({ member, medal, avatar, y }) => (
            <div key={member.id} className={`text-center ${y}`}>
              <div className={`${avatar} mx-auto grid place-items-center rounded-full bg-gradient-to-br from-[var(--sand)] to-[var(--lavender)] p-[3px]`}>
                <span className="grid h-full w-full place-items-center rounded-full bg-[var(--bg-surface)]">{member.avatar}</span>
              </div>
              <div className="mt-3 text-2xl">{medal}</div>
              <div className={`font-semibold ${activeBg ? 'text-white' : 'text-[var(--text-primary)]'}`}>{member.name}</div>
              <div className={`font-['DM_Serif_Display'] leading-none ${activeBg ? 'text-white' : 'text-[var(--sand)]'}`}>{member.xp}</div>
              <div className={`text-xs font-medium ${activeBg ? 'text-white/70' : 'text-[var(--text-tertiary)]'}`}>XP</div>
            </div>
          ))}
        </div>
      </section>

      {/* Участники */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Участники</h2>
          <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => addToast('Добавление участников доступно в настройках.', 'info')}>
            + Добавить
          </button>
        </div>
        {members.map((member) => {
          const heroClass = HERO_CLASSES[member.classId];
          const progress = getMemberProgress(member.id);
          return (
            <div key={member.id} className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] flex flex-wrap items-center gap-4 p-5 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-elevated)] text-2xl">{member.avatar}</div>
              <div className="min-w-[160px] flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{member.name}</h3>
                <p className="text-[13px] font-medium text-[var(--text-secondary)]">
                  {heroClass?.icon} {heroClass?.label} · ур. {member.level}
                </p>
              </div>
              <div className="min-w-[180px] flex-1">
                <div className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{member.xp} XP</div>
                <ProgressBar value={(member.xp % 120) / 1.2} height={6} variant="sage" />
              </div>
              <div className="text-sm font-medium text-[var(--text-secondary)]">Сегодня: {progress.completed}/{progress.total}</div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-[var(--bg-elevated)] text-xl font-medium text-[var(--text-tertiary)]">
                ⋮
              </button>
            </div>
          );
        })}
      </section>

      {/* Челлендж */}
      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--border-soft)]" style={{ borderLeft: '4px solid var(--lavender)' }}>
        <div className="mb-3 flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Челлендж недели</h2>
            <p className="text-[13px] font-medium text-[var(--text-secondary)]">Закройте 50 задач всей семьёй и получите эпический пак.</p>
          </div>
        </div>
        <ProgressBar value={58} height={8} variant="sage" />
        <div className="mt-3 flex items-center justify-between text-[13px] font-medium text-[var(--text-secondary)]">
          <span>29/50 задач · награда: 🟣 пак</span>
          <span>4 дня</span>
        </div>
      </section>
    </div>
  );
};
