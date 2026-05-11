import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AVATARS, HERO_CLASSES } from '@/shared/data/memberData';
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
      style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.25), transparent 60%), #1a1040' }}
    >
      <section className="w-full max-w-[520px] rounded-[24px] bg-white p-8 shadow-card sm:p-10">
        {isChecking || authLoading ? (
          <div className="py-14 text-center">
            <div className="mb-4 text-5xl">🏰</div>
            <h1 className="gradient-text text-3xl font-black">Проверяем приглашение</h1>
          </div>
        ) : null}

        {!isChecking && error && !invite ? (
          <div className="py-10 text-center">
            <div className="mb-4 text-6xl">⛔</div>
            <h1 className="mb-2 text-2xl font-black text-[var(--text-primary)]">Приглашение не найдено</h1>
            <p className="mb-6 text-sm font-bold text-[var(--text-muted)]">{error}</p>
            <Link to="/" className="btn-secondary inline-block">
              На главную
            </Link>
          </div>
        ) : null}

        {!isChecking && invite && !userId ? (
          <div className="text-center">
            <div className="mb-4 text-6xl">🏰</div>
            <h1 className="gradient-text mb-2 text-3xl font-black">Вас приглашают в гильдию</h1>
            <p className="mb-6 text-xl font-black text-[var(--text-primary)]">"{invite.familyName}"</p>
            <p className="mb-6 text-sm font-bold text-[var(--text-muted)]">Чтобы принять приглашение, войди или создай аккаунт.</p>
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
            <h1 className="gradient-text mb-2 text-center text-3xl font-black">Ты вступаешь в "{invite.familyName}"</h1>
            <p className="mb-6 text-center text-sm font-bold text-[var(--text-muted)]">Создай своего героя для этой гильдии.</p>

            {error ? <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</div> : null}

            <label className="mb-5 block">
              <span className="mb-1 block text-sm font-black text-[var(--text-primary)]">Имя героя</span>
              <input
                className="input-field"
                value={profile.name}
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                placeholder="Мама"
              />
            </label>

            <div className="mb-5">
              <div className="mb-2 text-sm font-black text-[var(--text-primary)]">Аватар</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
                      profile.avatar === avatar ? 'bg-[var(--c-purple)] text-white shadow-purple' : 'bg-gray-100'
                    }`}
                    onClick={() => setProfile((current) => ({ ...current, avatar }))}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-2">
              {classEntries.map(([key, heroClass]) => (
                <button
                  type="button"
                  key={key}
                  className={`rounded-xl border p-3 text-left transition ${
                    profile.heroClass === key
                      ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)] shadow-purple'
                      : 'border-gray-200 bg-white hover:border-purple-200'
                  }`}
                  onClick={() => setProfile((current) => ({ ...current, heroClass: key }))}
                >
                  <div className="text-xl">{heroClass.icon}</div>
                  <div className="text-sm font-black">{heroClass.label}</div>
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
            <h1 className="gradient-text mb-2 text-3xl font-black">Добро пожаловать!</h1>
            <p className="mb-6 text-sm font-bold text-[var(--text-muted)]">Ты теперь часть "{invite.familyName}".</p>
            <button type="button" className="btn-primary w-full" onClick={() => navigate('/home', { replace: true })}>
              Начать приключение →
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
};
