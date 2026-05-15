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
    hpPercent > 50 ? 'linear-gradient(90deg,#22c55e,#16a34a)' :
    hpPercent > 25 ? 'linear-gradient(90deg,#f59e0b,#f97316)' :
    'linear-gradient(90deg,#ef4444,#dc2626)';

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
    <div className={`boss-arena phase-${boss.phase || 1} relative overflow-hidden rounded-[20px] p-6 text-center`}>
      <div className="arena-glow pointer-events-none absolute inset-0 rounded-[20px]" style={{
        background: isPhase2
          ? 'radial-gradient(ellipse at center top, rgba(239,68,68,0.4) 0%, transparent 70%)'
          : 'radial-gradient(ellipse at center top, rgba(124,58,237,0.3) 0%, transparent 70%)',
      }} />

      <AnimatePresence>
        {phaseFlash && (
          <motion.div
            className="phase-flash absolute inset-0 z-30 rounded-[20px] bg-red-600/60"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
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
                className={`damage-float absolute left-1/2 top-0 -translate-x-1/2 text-4xl font-black ${popup.isCrit ? 'damage-crit text-yellow-400' : 'text-red-500'}`}
                initial={{ opacity: 0, y: 0, scale: 0.8 }}
                animate={{ opacity: 1, y: -50, scale: popup.isCrit ? 1.3 : 1.1 }}
                exit={{ opacity: 0, y: -70 }}
                transition={{ duration: 1.2 }}
              >
                -{popup.damage}
                {popup.isCrit && (
                  <span className="ml-1 text-lg text-yellow-300">КРИТ!</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <h1 className="mb-1 text-2xl font-black text-white">{boss.name}</h1>
        <p className="mb-4 text-sm font-bold text-white/55">{boss.subtitle}</p>

        <div className={`mx-auto mb-4 w-full max-w-[400px] ${hpBarClass}`} style={{ height: 12 }}>
          <div
            className="h-full rounded-full transition-all duration-800"
            style={{
              width: `${hpPercent}%`,
              background: hpBarColor,
              boxShadow: `0 0 12px ${hpPercent <= 25 ? 'rgba(239,68,68,0.7)' : hpPercent <= 50 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)'}`,
            }}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-white/70">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.5a6.5 6.5 0 0 0-6.5 6.5c0 4.5 6.5 9.5 6.5 9.5s6.5-5 6.5-9.5a6.5 6.5 0 0 0-6.5-6.5z" />
            </svg>
            {boss.hp} / {boss.maxHp} HP
          </span>
          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-3 py-1">
            🎯 Слабость: {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label}
          </span>
          <span className={`flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 ${daysUrgent ? 'text-red-400' : ''}`}>
            ⏳ Осталось: {boss.daysLeft} {boss.daysLeft === 1 ? 'день' : boss.daysLeft < 5 ? 'дня' : 'дней'}
          </span>
        </div>

        {isPhase2 && (
          <motion.div
            className="mb-2 inline-block rounded-full bg-red-600/80 px-4 py-1 text-xs font-black text-white"
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
