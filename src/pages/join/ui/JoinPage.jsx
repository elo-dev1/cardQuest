import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AVATARS, HERO_CLASSES } from '@/shared/data/memberData';
import { AvatarPicker } from '@/shared/ui/AvatarPicker';
import { useAuth } from '@/features/auth/model/useAuth';
import { acceptInvitation, checkInviteCode } from '@/features/invite/model/inviteActions';
import { useStore } from '@/shared/store/useStore';

const classEntries = Object.entries(HERO_CLASSES);

export const JoinPage = () => {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const { userId, displayName, loading: authLoading } = useAuth();
  const loadAll = useStore((state) => state.loadAll);
  const family = useStore((state) => state.family);
  const isSetupDone = useStore((state) => state.isSetupDone);
  const addToast = useStore((state) => state.addToast);
  const [invite, setInvite] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState({
    name: displayName || '',
    avatar: AVATARS[0],
    heroClass: 'healer',
  });

  useEffect(() => {
    let mounted = true;
    setIsChecking(true);
    checkInviteCode(code)
      .then((result) => {
        if (!mounted) return;
        if (!result.valid) {
          setError(result.error);
          setInvite(null);
          return;
        }
        setInvite(result);
        setError('');
      })
      .catch((inviteError) => {
        if (mounted) setError(inviteError.message || 'Не удалось проверить приглашение');
      })
      .finally(() => mounted && setIsChecking(false));
    return () => {
      mounted = false;
    };
  }, [code]);

  useEffect(() => {
    if (displayName && !profile.name) setProfile((current) => ({ ...current, name: displayName }));
  }, [displayName, profile.name]);

  const canJoin = useMemo(() => profile.name.trim().length > 1 && invite?.valid, [invite, profile.name]);

  const join = async () => {
    if (!canJoin || !userId || isJoining) return;
    if (isSetupDone && family?.id && invite?.familyId && family.id !== invite.familyId) {
      setError('Ты уже состоишь в другой гильдии. Сначала выйди из неё.');
      return;
    }

    setIsJoining(true);
    setError('');
    try {
      await acceptInvitation({
        code,
        userId,
        name: profile.name,
        avatar: profile.avatar,
        heroClass: profile.heroClass,
      });
      await loadAll(userId);
      setSuccess(true);
      addToast(`Добро пожаловать в "${invite.familyName}"!`, 'success');
    } catch (joinError) {
      setError(joinError.message || 'Не удалось принять приглашение');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main
      className="grid min-h-screen place-items-center p-6"
      style={{ background: 'var(--bg-app)' }}
    >
      <section className="w-full max-w-[520px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-8 shadow-md border border-[var(--border-soft)] sm:p-10">
        {isChecking || authLoading ? (
          <div className="py-14 text-center">
            <div className="mb-4 text-5xl">🏰</div>
            <h1 className="font-['DM_Serif_Display'] text-3xl text-[var(--text-primary)]">Проверяем приглашение</h1>
          </div>
        ) : null}

        {!isChecking && error && !invite ? (
          <div className="py-10 text-center">
            <div className="mb-4 text-6xl">⛔</div>
            <h1 className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">Приглашение не найдено</h1>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">{error}</p>
            <Link to="/" className="btn-secondary inline-block">
              На главную
            </Link>
          </div>
        ) : null}

        {!isChecking && invite && !userId ? (
          <div className="text-center">
            <div className="mb-4 text-6xl">🏰</div>
            <h1 className="font-['DM_Serif_Display'] mb-2 text-3xl text-[var(--text-primary)]">Вас приглашают в гильдию</h1>
            <p className="mb-6 text-xl font-semibold text-[var(--text-primary)]">"{invite.familyName}"</p>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">Чтобы принять приглашение, войди или создай аккаунт.</p>
            <div className="grid grid-cols-2 gap-3">
              <Link to={`/auth?redirect=/join/${code}`} className="btn-secondary text-center">
                Войти
              </Link>
              <Link to={`/auth?redirect=/join/${code}`} className="btn-primary text-center">
                Регистрация
              </Link>
            </div>
          </div>
        ) : null}

        {!isChecking && invite && userId && !success ? (
          <div>
            <h1 className="font-['DM_Serif_Display'] mb-2 text-center text-3xl text-[var(--text-primary)]">Ты вступаешь в "{invite.familyName}"</h1>
            <p className="mb-6 text-center text-sm font-medium text-[var(--text-secondary)]">Создай своего героя для этой гильдии.</p>

            {error ? <div className="mb-5 rounded-[var(--r-md)] bg-[var(--clay-bg)] px-4 py-3 text-sm font-medium text-[var(--clay)]">{error}</div> : null}

            <label className="mb-5 block">
              <span className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Имя героя</span>
              <input
                className="input-field"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                placeholder="Мама"
              />
            </label>

            <div className="mb-7">
              <AvatarPicker value={profile.avatar} onChange={(avatar) => setProfile((current) => ({ ...current, avatar }))} />
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2">
              {classEntries.map(([key, heroClass]) => (
                <button
                  type="button"
                  key={key}
                  className={`rounded-[var(--r-md)] border p-3 text-left transition ${
                    profile.heroClass === key
                      ? 'border-[var(--charcoal)] bg-[var(--bg-elevated)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]'
                  }`}
                  onClick={() => setProfile((current) => ({ ...current, heroClass: key }))}
                >
                  <div className="flex items-center justify-center h-7 w-7">{heroClass.iconSrc ? <img src={heroClass.iconSrc} alt="" className="w-5 h-5" /> : <span className="text-xl">{heroClass.icon}</span>}</div>
                  <div className="text-sm font-semibold">{heroClass.label}</div>
                </button>
              ))}
            </div>

            <button type="button" className="btn-primary w-full" disabled={!canJoin || isJoining} onClick={join}>
              {isJoining ? 'Вступаем...' : 'Вступить в гильдию →'}
            </button>
          </div>
        ) : null}

        {success ? (
          <div className="py-10 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h1 className="font-['DM_Serif_Display'] mb-2 text-3xl text-[var(--text-primary)]">Добро пожаловать!</h1>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">Ты теперь часть "{invite.familyName}".</p>
            <button type="button" className="btn-primary w-full" onClick={() => navigate('/home', { replace: true })}>
              Начать приключение →
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
};
