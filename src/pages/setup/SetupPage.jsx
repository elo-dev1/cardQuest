import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { motion } from 'framer-motion';
import { AVATARS, HERO_CLASSES } from '@/shared/data/memberData';
import { useAuth } from '@/features/auth/model/useAuth';
import { useStore } from '@/shared/store/useStore';
import { fireConfetti } from '@/shared/lib/confetti';
import { GlobalConfetti } from '@/shared/ui/GlobalConfetti';
import { ToastContainer } from '@/shared/ui/ToastContainer';

const classEntries = Object.entries(HERO_CLASSES);

const emptyChild = () => ({
  name: '',
  avatar: AVATARS[2],
  classId: 'archer',
  pin: '',
});

export const SetupPage = () => {
  const navigate = useNavigate();
  const { displayName } = useAuth();
  const initFamily = useStore((state) => state.initFamily);
  const isSetupDone = useStore((state) => state.isSetupDone);
  const addToast = useStore((state) => state.addToast);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [hero, setHero] = useState({
    name: displayName || '',
    avatar: AVATARS[0],
    classId: 'warrior',
  });
  const [guildName, setGuildName] = useState('');
  const [children, setChildren] = useState([]);
  const [childDraft, setChildDraft] = useState(emptyChild);

  useEffect(() => {
    if (displayName && !hero.name) setHero((current) => ({ ...current, name: displayName }));
  }, [displayName, hero.name]);

  useEffect(() => {
    if (isSetupDone && !isSubmitting && step !== 4) navigate('/home', { replace: true });
  }, [isSetupDone, isSubmitting, navigate, step]);

  useEffect(() => {
    if (step === 4) fireConfetti();
  }, [step]);

  const canContinue = useMemo(() => {
    if (step === 1) return hero.name.trim().length > 1;
    if (step === 2) return guildName.trim().length > 1;
    return true;
  }, [guildName, hero.name, step]);

  const addChild = () => {
    if (!childDraft.name.trim()) return;
    setChildren((current) => [
      ...current,
      {
        ...childDraft,
        id: uuidv4(),
        name: childDraft.name.trim(),
        pin: childDraft.pin.replace(/\D/g, '').slice(0, 4),
      },
    ]);
    setChildDraft({ ...emptyChild(), avatar: AVATARS[(children.length + 3) % AVATARS.length] });
  };

  const finishSetup = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const result = await initFamily({
        heroName: hero.name,
        avatar: hero.avatar,
        heroClass: hero.classId,
        familyName: guildName,
        children,
        displayName,
      });
      setInviteCode(result.inviteCode);
      setStep(4);
    } catch (setupError) {
      setError(setupError.message || 'Не удалось создать гильдию');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inviteUrl = inviteCode ? `${window.location.origin}/join/${inviteCode}` : '';

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    addToast('Ссылка приглашения скопирована!', 'success');
  };

  const shareInvite = async () => {
    if (!navigator.share) {
      await copyInvite();
      return;
    }
    await navigator.share({
      title: 'Card Quest — приглашение в гильдию',
      text: `Вступай в нашу гильдию "${guildName}"!`,
      url: inviteUrl,
    });
  };

  return (
    <div
      className="grid min-h-screen place-items-center p-6"
      style={{ background: 'var(--bg-app)' }}
    >
      <motion.div
        className="w-full max-w-[620px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-8 shadow-md border border-[var(--border-soft)] sm:p-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
      >
        <div className="mb-7 flex justify-center gap-2 text-xl text-[var(--text-tertiary)]">
          {[1, 2, 3, 4].map((item) => (
            <span key={item}>{item <= step ? '●' : '○'}</span>
          ))}
        </div>

        {error ? <div className="mb-5 rounded-[var(--r-md)] bg-[var(--clay-bg)] px-4 py-3 text-sm font-medium text-[var(--clay)]">{error}</div> : null}

        {step === 1 ? (
          <section>
            <h1 className="font-['DM_Serif_Display'] text-center text-[32px] text-[var(--text-primary)] mb-2">⚔️ Card Quest</h1>
            <p className="mb-8 text-center text-lg font-medium text-[var(--text-secondary)]">
              Добро пожаловать{displayName ? `, ${displayName}` : ''}! Создай своего героя
            </p>

            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">Имя героя</label>
            <input
              className="input-field mb-5"
              value={hero.name}
              onChange={(event) => setHero((current) => ({ ...current, name: event.target.value }))}
              placeholder="Папа"
              autoFocus
            />

            <div className="mb-5">
              <div className="mb-2 text-sm font-medium text-[var(--text-primary)]">Аватар</div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl transition ${
                      hero.avatar === avatar ? 'bg-[var(--charcoal)] text-white' : 'bg-[var(--bg-elevated)]'
                    }`}
                    onClick={() => setHero((current) => ({ ...current, avatar }))}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {classEntries.map(([key, heroClass]) => (
                <button
                  type="button"
                  key={key}
                  className={`rounded-[var(--r-md)] border p-3 text-left transition ${
                    hero.classId === key
                      ? 'border-[var(--charcoal)] bg-[var(--bg-elevated)]'
                      : 'border-[var(--border-soft)] bg-[var(--bg-surface)] hover:border-[var(--border-medium)]'
                  }`}
                  onClick={() => setHero((current) => ({ ...current, classId: key }))}
                >
                  <div className="text-xl">{heroClass.icon}</div>
                  <div className="text-sm font-semibold">{heroClass.label}</div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">Бонус: {heroClass.bonus}</div>
                </button>
              ))}
            </div>

            <button type="button" className="btn-primary w-full" disabled={!canContinue} onClick={() => setStep(2)}>
              Продолжить →
            </button>
          </section>
        ) : null}

        {step === 2 ? (
          <section>
            <h1 className="mb-2 text-2xl font-semibold text-[var(--text-primary)]">Как называется ваша семья?</h1>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">
              Ты будешь создателем гильдии. Остальные взрослые присоединятся по приглашению.
            </p>
            <input
              className="input-field mb-6"
              value={guildName}
              onChange={(event) => setGuildName(event.target.value)}
              placeholder="Клан Ивановых"
              autoFocus
            />
            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setStep(1)}>
                Назад
              </button>
              <button type="button" className="btn-primary flex-1" disabled={!canContinue} onClick={() => setStep(3)}>
                Продолжить →
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section>
            <h1 className="mb-1 text-2xl font-semibold text-[var(--text-primary)]">Есть дети?</h1>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">Этот шаг необязательный. Детям не нужен отдельный аккаунт.</p>

            <div className="mb-5 grid gap-3 rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-4">
              <input
                className="input-field"
                value={childDraft.name}
                onChange={(event) => setChildDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Имя ребёнка"
              />
              <div className="flex gap-2 overflow-x-auto pb-1">
                {AVATARS.map((avatar) => (
                  <button
                    type="button"
                    key={avatar}
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition ${
                      childDraft.avatar === avatar ? 'bg-[var(--charcoal)] text-white' : 'bg-[var(--bg-surface)]'
                    }`}
                    onClick={() => setChildDraft((current) => ({ ...current, avatar }))}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {classEntries.map(([key, heroClass]) => (
                  <button
                    type="button"
                    key={key}
                    className={`rounded-[var(--r-md)] border p-3 text-left transition ${
                      childDraft.classId === key ? 'border-[var(--charcoal)] bg-[var(--bg-surface)] shadow-sm' : 'border-[var(--border-soft)] bg-[var(--bg-surface)]'
                    }`}
                    onClick={() => setChildDraft((current) => ({ ...current, classId: key }))}
                  >
                    <div className="text-xl">{heroClass.icon}</div>
                    <div className="text-sm font-semibold">{heroClass.label}</div>
                  </button>
                ))}
              </div>
              <input
                className="input-field"
                inputMode="numeric"
                maxLength={4}
                value={childDraft.pin}
                onChange={(event) => setChildDraft((current) => ({ ...current, pin: event.target.value.replace(/\D/g, '') }))}
                placeholder="PIN 4 цифры, необязательно"
              />
              <button type="button" className="btn-secondary w-full" onClick={addChild} disabled={!childDraft.name.trim()}>
                + Добавить ребёнка
              </button>
            </div>

            {children.length ? (
              <div className="mb-6 space-y-2">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center justify-between rounded-[var(--r-md)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{child.avatar}</span>
                      <div>
                        <div className="font-semibold">{child.name}</div>
                        <div className="text-xs font-medium text-[var(--text-secondary)]">
                          {HERO_CLASSES[child.classId]?.icon} {HERO_CLASSES[child.classId]?.label}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-full bg-[var(--bg-surface)] font-medium text-[var(--text-secondary)]"
                      onClick={() => setChildren((current) => current.filter((item) => item.id !== child.id))}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setStep(2)}>
                Назад
              </button>
              <button type="button" className="btn-primary flex-1" onClick={finishSetup} disabled={isSubmitting}>
                {children.length ? 'Создать гильдию →' : 'Пропустить →'}
              </button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="text-center">
            <div className="float-soft mb-4 text-[80px]">🏰</div>
            <h1 className="font-['DM_Serif_Display'] mb-2 text-3xl text-[var(--text-primary)]">{guildName} создан!</h1>
            <p className="mb-6 text-sm font-medium text-[var(--text-secondary)]">Пригласи других взрослых по коду или ссылке.</p>

            <div className="mb-5 rounded-[var(--r-md)] border-2 border-dashed border-[var(--border-medium)] bg-[var(--bg-elevated)] p-5">
              <div className="mb-3 font-mono text-[44px] font-semibold tracking-[0.18em] text-[var(--text-primary)]">{inviteCode}</div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={copyInvite}>
                  Скопировать
                </button>
                <button type="button" className="btn-primary px-4 py-2 text-sm" onClick={shareInvite}>
                  Поделиться
                </button>
              </div>
            </div>

            <div className="mb-6 rounded-[var(--r-md)] bg-[var(--bg-elevated)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)]">
              {inviteUrl}
              <br />
              Ссылка действительна 7 дней
            </div>

            <button type="button" className="btn-primary w-full" onClick={() => navigate('/home', { replace: true })}>
              Перейти в гильдию →
            </button>
          </section>
        ) : null}
      </motion.div>
      <ToastContainer />
      <GlobalConfetti />
    </div>
  );
};
