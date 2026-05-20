import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORIES } from '@/shared/data/taskTemplates';

export const BossArena = ({ boss, lastDamageEvent }) => {
  const [isShaking, setIsShaking] = useState(false);
  const [damagePopups, setDamagePopups] = useState([]);
  const [phaseFlash, setPhaseFlash] = useState(false);
  const prevHpRef = useRef(boss.hp);
  const prevPhaseRef = useRef(boss.phase);

  const hpPercent = boss.maxHp ? (boss.hp / boss.maxHp) * 100 : 0;
  const isPhase2 = boss.phase === 2;

  const hpBarColor =
    hpPercent > 50 ? 'var(--sage)' :
    hpPercent > 25 ? 'var(--sand)' :
    'var(--clay)';

  const hpBarClass = hpPercent <= 20 ? 'hp-bar-critical' : '';

  const bossImage = isPhase2 ? '/boss/dragon/angry.png' : '/boss/dragon/standard.png';
  const daysUrgent = boss.daysLeft <= 2;

  useEffect(() => {
    if (lastDamageEvent && lastDamageEvent.damage > 0) {
      const id = Date.now();
      setDamagePopups((prev) => [...prev, { id, damage: lastDamageEvent.damage, isCrit: lastDamageEvent.isCrit }]);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      setTimeout(() => {
        setDamagePopups((prev) => prev.filter((p) => p.id !== id));
      }, 1300);
    }
  }, [lastDamageEvent]);

  useEffect(() => {
    if (prevHpRef.current > boss.hp) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
    }
    prevHpRef.current = boss.hp;
  }, [boss.hp]);

  useEffect(() => {
    if (prevPhaseRef.current !== 2 && boss.phase === 2) {
      setPhaseFlash(true);
      setTimeout(() => setPhaseFlash(false), 800);
    }
    prevPhaseRef.current = boss.phase;
  }, [boss.phase]);

  return (
    <div className={`boss-arena battle-arena-mobile phase-${boss.phase || 1} relative overflow-hidden rounded-[var(--r-lg)]`}>
      <div className="arena-glow pointer-events-none absolute inset-0 rounded-[var(--r-lg)]" style={{
        background: isPhase2
          ? 'radial-gradient(ellipse at center top, rgba(196,123,106,0.2) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center top, rgba(143,175,139,0.15) 0%, transparent 70%)',
      }} />

      <AnimatePresence>
        {phaseFlash && (
          <motion.div
            className="phase-flash absolute inset-0 z-30 rounded-[var(--r-lg)] bg-[var(--clay)]/30"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 text-center">
        <div className="relative mx-auto mb-3 inline-block">
          <img
            src={bossImage}
            alt={boss.name}
            className={`boss-image h-[140px] w-auto object-contain ${isShaking ? 'shaking' : ''}`}
          />

          <AnimatePresence>
            {damagePopups.map((popup) => (
              <motion.div
                key={popup.id}
                className={`damage-float absolute left-1/2 top-0 -translate-x-1/2 text-4xl font-['DM_Serif_Display'] ${popup.isCrit ? 'damage-crit text-[var(--sand)]' : 'text-[var(--clay)]'}`}
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -50, scale: popup.isCrit ? 1.3 : 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 1.2 }}
              >
                -{popup.damage}
                {popup.isCrit && (
                  <span className="ml-1 text-lg text-[var(--sand)]">КРИТ!</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <h1 className="mb-1 font-['DM_Serif_Display'] text-[22px] md:text-[20px] text-[var(--text-primary)]">{boss.name}</h1>
        <p className="mb-4 text-[14px] font-medium text-[var(--text-secondary)]">{boss.subtitle}</p>

        <div className={`mx-auto mb-4 w-full max-w-[400px] ${hpBarClass}`}>
          <div className="rounded-[var(--r-full)] bg-[var(--bg-elevated)] border border-[var(--border-soft)]" style={{ height: 10 }}>
            <div
              className="h-full rounded-[var(--r-full)] transition-all duration-800"
              style={{
                width: `${hpPercent}%`,
                background: hpBarColor,
              }}
            />
          </div>
        </div>

        <div className="mb-2 text-[14px] font-medium text-[var(--text-secondary)]">
          {boss.hp} / {boss.maxHp} HP
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <span className="pill min-h-[36px]">
            🎯 {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label}
          </span>
          <span className={`pill min-h-[36px] ${daysUrgent ? 'text-[var(--clay)]' : ''}`}>
            ⏳ {boss.daysLeft} {boss.daysLeft === 1 ? 'день' : boss.daysLeft < 5 ? 'дня' : 'дней'}
          </span>
        </div>

        {isPhase2 && (
          <motion.div
            className="inline-block rounded-full bg-[var(--clay-bg)] px-4 py-2 text-[13px] font-semibold text-[var(--clay)]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ⚠️ ФАЗА ЯРОСТИ — Босс атакует дважды!
          </motion.div>
        )}
      </div>
    </div>
  );
};
