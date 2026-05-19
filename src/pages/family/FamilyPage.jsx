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
    { member: first, medal: '🥇', avatar: 'h-[72px] w-[72px] text-4xl', xp: 'text-[32px]', y: '-translate-y-5' },
    { member: third, medal: '🥉', avatar: 'h-14 w-14 text-3xl', xp: 'text-2xl', y: 'translate-y-2' },
  ].filter((item) => item.member);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-3xl font-black text-white">Семья</h1>
        <p className="text-sm font-bold text-white/50">Герои, уровни и общий челлендж</p>
      </header>

      <section
        className="card overflow-hidden p-8"
        style={
          activeBg
            ? { 
                backgroundImage: `url(${activeBg.image})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)' 
              }
            : { background: 'linear-gradient(to bottom, #fff, rgba(245,158,11,0.08))' }
        }
      >
        <div className="flex items-end justify-center gap-8">
          {podiumItems.map(({ member, medal, avatar, xp, y }) => (
            <div key={member.id} className={`text-center ${y}`}>
              <div className={`${avatar} mx-auto grid place-items-center rounded-full bg-gradient-to-br from-amber-300 to-fuchsia-500 p-[3px]`}>
                <span className="grid h-full w-full place-items-center rounded-full bg-white">{member.avatar}</span>
              </div>
              <div className="mt-3 text-2xl">{medal}</div>
              <div className={`font-black ${activeBg ? 'text-white' : 'text-[var(--text-primary)]'}`}>{member.name}</div>
              <div className={`gradient-text ${xp} font-black leading-none`}>{member.xp}</div>
              <div className={`text-xs font-black ${activeBg ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>XP</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white">Участники</h2>
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => addToast('Добавление участников доступно в настройках.', 'info')}>
            + Добавить
          </button>
        </div>
        {members.map((member) => {
          const heroClass = HERO_CLASSES[member.classId];
          const progress = getMemberProgress(member.id);
          return (
            <div key={member.id} className="card flex flex-wrap items-center gap-4 p-5">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f8f7ff] text-3xl">{member.avatar}</div>
              <div className="min-w-[160px] flex-1">
                <h3 className="font-black text-[var(--text-primary)]">{member.name}</h3>
                <p className="text-sm font-bold text-[var(--text-muted)]">
                  {heroClass?.icon} {heroClass?.label} · ур. {member.level}
                </p>
              </div>
              <div className="min-w-[180px] flex-1">
                <div className="mb-1 text-xs font-black text-[var(--text-muted)]">{member.xp} XP</div>
                <ProgressBar value={(member.xp % 120) / 1.2} height={7} color="linear-gradient(90deg,#7c3aed,#f59e0b)" />
              </div>
              <div className="font-black text-[var(--text-muted)]">Сегодня: {progress.completed}/{progress.total}</div>
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full bg-gray-100 text-xl font-black text-gray-500">
                ⋮
              </button>
            </div>
          );
        })}
      </section>

      <section className="card-dark p-6">
        <div className="mb-3 flex items-center gap-3">
          <div className="text-4xl">🎯</div>
          <div>
            <h2 className="text-lg font-black text-white">Челлендж недели</h2>
            <p className="text-sm font-bold text-white/55">Закройте 50 задач всей семьёй и получите эпический пак.</p>
          </div>
        </div>
        <ProgressBar value={58} height={9} color="linear-gradient(90deg,#22c55e,#f59e0b)" />
        <div className="mt-3 flex items-center justify-between text-sm font-black text-white/60">
          <span>29/50 задач · награда: 🟣 пак</span>
          <span>4 дня</span>
        </div>
      </section>
    </div>
  );
};
