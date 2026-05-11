import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HERO_CLASSES } from '@/shared/data/memberData';
import { useStore } from '@/shared/store/useStore';

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

  const submitPin = (value = pin) => {
    if (!selected) return;
    if (value === selected.pin) {
      setCurrentMember(selected.id);
      setSelected(null);
      setPin('');
      return;
    }
    setInvalid(true);
    setPin('');
    addToast('Неверный PIN. Попробуйте ещё раз.', 'error');
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
      if (next.length === 4) window.setTimeout(() => submitPin(next), 80);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[9996] grid place-items-center bg-[rgba(10,5,30,0.85)] p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`card-dark w-full max-w-[480px] p-8 ${invalid ? 'shake' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
          >
            <h2 className="mb-2 text-center text-2xl font-black text-white">Привет! Кто ты? 👋</h2>
            <p className="mb-6 text-center text-sm font-bold text-white/50">
              Выберите героя, чтобы продолжить семейный квест.
            </p>

            {!selected ? (
              <div className="grid grid-cols-2 gap-3">
                {selectableMembers.map((member) => {
                  const heroClass = HERO_CLASSES[member.classId ?? member.hero_class];
                  return (
                    <button
                      key={member.id}
                      type="button"
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:-translate-y-1 hover:bg-white/10"
                      onClick={() => chooseMember(member)}
                    >
                      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-fuchsia-500 p-[3px] text-3xl">
                        <span className="grid h-full w-full place-items-center rounded-full bg-[var(--bg-sidebar)]">{member.avatar}</span>
                      </div>
                      <div className="font-black text-white">{member.name}</div>
                      <div className="text-xs font-bold text-white/50">
                        {heroClass?.icon} {heroClass?.label} · ур. {member.level}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <button type="button" className="mb-4 text-sm font-bold text-white/50 hover:text-white" onClick={() => setSelected(null)}>
                  ← Назад к героям
                </button>
                <div className="mb-5 text-center">
                  <div className="text-5xl">{selected.avatar}</div>
                  <div className="mt-2 text-lg font-black text-white">{selected.name}</div>
                </div>
                <div className="mb-5 flex justify-center gap-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <span
                      key={index}
                      className={`h-3 w-3 rounded-full ${index < pin.length ? 'bg-[var(--c-gold)]' : 'bg-white/15'}`}
                    />
                  ))}
                </div>
                <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-3">
                  {digits.map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      className="grid h-14 place-items-center rounded-2xl bg-white/10 text-xl font-black text-white transition hover:bg-white/15"
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
