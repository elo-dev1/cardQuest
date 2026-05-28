import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { MemberAvatar } from '@/shared/ui/MemberAvatar';
import { useStore } from '@/shared/store/useStore';
import { verifyPin } from '@/shared/lib/crypto';

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'ok'];

export const ProfileSelectScreen = () => {
  const members = useStore((state) => state.members);
  const authUserId = useStore((state) => state.authUserId);
  const currentMemberId = useStore((state) => state.currentMemberId);
  const setCurrentMember = useStore((state) => state.setCurrentMember);
  const addToast = useStore((state) => state.addToast);
  const [selected, setSelected] = useState(null);
  const [pin, setPin] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [attempts, setAttempts] = useState(0);

  const adultMember = members.find((member) => member.user_id && member.user_id === authUserId);
  const selectableMembers = adultMember
    ? [adultMember]
    : members;
  const visible = currentMemberId === null && members.length > 0 && !adultMember;

  const chooseMember = (member) => {
    if (!member.pin) {
      setCurrentMember(member.id);
      return;
    }
    setSelected(member);
    setPin('');
  };

  const submitPin = async (value = pin) => {
    if (!selected) return;
    
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
      addToast(`Слишком много попыток. Подождите ${remaining} сек.`, 'error');
      return;
    }

    if (await verifyPin(value, selected.pin)) {
      setCurrentMember(selected.id);
      setSelected(null);
      setPin('');
      setAttempts(0);
      return;
    }

    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    
    if (nextAttempts >= 3) {
      setLockoutUntil(Date.now() + 30000);
      addToast('Слишком много попыток. Блокировка на 30 секунд.', 'error');
    } else {
      setInvalid(true);
      addToast(`Неверный PIN. Попыток осталось: ${3 - nextAttempts}`, 'error');
    }
    
    setPin('');
    window.setTimeout(() => setInvalid(false), 380);
  };

  const pressDigit = (digit) => {
    if (digit === 'ok') {
      submitPin();
      return;
    }
    if (digit === '⌫') {
      setPin((current) => current.slice(0, -1));
      return;
    }
    setPin((current) => {
      const next = `${current}${digit}`.slice(0, 4);
      if (next.length === 4) {
        window.setTimeout(async () => await submitPin(next), 80);
      }
      return next;
    });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="profile-select-mobile fixed inset-0 z-[9996] grid place-items-center p-6 backdrop-blur-sm md:grid md:place-items-center md:p-6"
          style={{ background: 'var(--bg-overlay)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
            <motion.div
              className={`w-full max-w-[480px] rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 md:p-8 shadow-lg border border-[var(--border-soft)] ${invalid ? 'shake' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <h2 className="mb-2 text-center text-2xl font-semibold text-[var(--text-primary)]">Привет! Кто ты? 👋</h2>
            <p className="mb-6 text-center text-sm font-medium text-[var(--text-secondary)]">
              Выберите героя, чтобы продолжить семейный квест.
            </p>

            {!selected ? (
              <div className="profile-grid-mobile grid grid-cols-2 gap-3">
                {selectableMembers.map((member) => {
                  const heroClass = HERO_CLASSES[member.classId ?? member.hero_class];
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className="profile-card-mobile rounded-[var(--r-md)] border border-[var(--border-soft)] bg-[var(--bg-elevated)] p-4 text-center transition hover:-translate-y-1 hover:bg-[var(--bg-surface)]"
                      onClick={() => chooseMember(member)}
                    >
                      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-[var(--sand)] to-[var(--lavender)] p-[3px] text-3xl">
                        <MemberAvatar avatar={member.avatar} className="h-full w-full rounded-full bg-[var(--bg-surface)]" />
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">{member.name}</div>
                      <div className="text-xs font-medium text-[var(--text-secondary)]">
                        {heroClass?.iconSrc ? <img src={heroClass.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> : heroClass?.icon} {heroClass?.label} · ур. {member.level}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <button type="button" className="mb-4 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition" onClick={() => setSelected(null)}>
                  ← Назад к героям
                </button>
                <div className="mb-5 text-center">
                  <MemberAvatar avatar={selected.avatar} className="h-16 w-16 rounded-full bg-[var(--bg-surface)] text-5xl" />
                  <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{selected.name}</div>
                </div>
                <div className="mb-5 flex justify-center gap-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <span
                      key={index}
                      className={`h-3 w-3 rounded-full ${index < pin.length ? 'bg-[var(--sand)]' : 'bg-[var(--bg-elevated)]'}`}
                    />
                  ))}
                </div>
                <div className="numpad-mobile mx-auto grid max-w-[260px] grid-cols-3 gap-3">
                  {digits.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      className="numpad-btn-mobile grid h-14 place-items-center rounded-[var(--r-md)] bg-[var(--bg-elevated)] text-xl font-semibold text-[var(--text-primary)] transition hover:bg-[var(--bg-surface)]"
                      onClick={() => pressDigit(digit)}
                    >
                      {digit === 'ok' ? '✓' : digit}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
