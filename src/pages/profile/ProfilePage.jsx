import { useNavigate } from 'react-router-dom';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { useStore } from '@/shared/store/useStore';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const member = useStore((state) => state.getCurrentMember());
  const family = useStore((state) => state.family);
  const defeatedBosses = useStore((state) => state.defeatedBosses);
  const heroClass = member ? HERO_CLASSES[member.classId] : null;
  const levelProgress = member ? member.xp % 120 : 0;

  if (!member) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-[17px] font-semibold text-[var(--text-primary)]">Профиль</h1>

      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <div className="flex items-center gap-4">
          <MemberAvatar avatar={member.avatar} className="h-16 w-16 rounded-full bg-[var(--bg-elevated)] text-3xl" />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{member.name}</h2>
            <div className="text-sm font-medium text-[var(--text-secondary)]">
              {heroClass?.iconSrc ? <img src={heroClass.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> : heroClass?.icon} {heroClass?.label} · ур. {member.level}
            </div>
            <div className="text-xs font-medium text-[var(--text-tertiary)]">
              {family?.name} · {member.xp} XP
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={(levelProgress / 120) * 100} height={8} variant="sand" />
        </div>
      </section>

      <section className="rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-card)] border border-[var(--border-soft)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Поверженные боссы</h2>
          <span className="badge badge-sand">{defeatedBosses.length}</span>
        </div>

        {defeatedBosses.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-5xl opacity-30">🏆</span>
            <p className="text-sm font-medium text-[var(--text-tertiary)]">
              Пока ни один босс не повержен
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {defeatedBosses.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-4 rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-4"
              >
                <span className="text-3xl">{b.boss_emoji || '🐲'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    {b.boss_name}
                  </div>
                  <div className="text-xs font-medium text-[var(--text-tertiary)]">
                    {b.boss_subtitle || ''}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    🏆
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
