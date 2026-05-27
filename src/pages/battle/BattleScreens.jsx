import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const CONFETTI_COLORS = [
  'var(--sand)', 'var(--clay)', 'var(--sage)', 'var(--slate)', 'var(--lavender)', '#ec4899', '#f97316', '#14b8a6',
];

const generateConfetti = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    y: 30 + Math.random() * 20,
    tx: -100 + Math.random() * 200,
    ty: 200 + Math.random() * 400,
    tr: -720 + Math.random() * 1440,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 0.5,
  }));

export const VictoryScreen = ({ bossName, reward = 250, onClose }) => {
  const [particles] = useState(() => generateConfetti(60));

  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="victory-overlay fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="victory-ray pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[300px] origin-left bg-gradient-to-r from-[var(--sand)]/50 to-transparent"
          style={{
            transform: `rotate(${i * 30}deg)`,
            width: `${300 + i * 50}px`,
          }}
        />
      ))}

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
          animate={{
            opacity: 0,
            x: p.tx,
            y: p.ty + window?.innerHeight || 800,
            rotate: p.tr,
            scale: 0.5,
          }}
          transition={{ duration: 2.5, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <motion.div
          className="mb-6 text-[120px]"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          🏆
        </motion.div>

        <motion.h1
          className="mb-4 text-center text-5xl font-['DM_Serif_Display'] leading-tight"
          style={{
            background: 'linear-gradient(135deg, var(--sand), #f97316, var(--sand-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ПОБЕДА!
        </motion.h1>

        <motion.p
          className="mb-2 text-xl font-medium text-[var(--text-secondary)]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {bossName} повержен!
        </motion.p>

        <motion.div
          className="mt-4 rounded-[var(--r-lg)] bg-[var(--sand-bg)] px-8 py-4 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-2xl font-['DM_Serif_Display'] text-[var(--sand)]">+{reward} монет!</p>
          <p className="text-sm font-medium text-[var(--text-secondary)]">Награда зачислена</p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export const DefeatScreen = ({ bossName, bossEmoji = '🐲', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="defeat-overlay fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--bg-elevated)]/50 to-transparent" />

      <motion.div
        className="relative z-10 flex flex-col items-center px-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-6 text-[100px] opacity-40 grayscale">{bossEmoji}</div>

        <h1
          className="mb-4 text-center text-4xl font-['DM_Serif_Display']"
          style={{
            background: 'linear-gradient(135deg, var(--text-secondary), var(--text-tertiary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {bossName} выжил...
        </h1>

        <p className="mb-2 text-center text-lg font-medium text-[var(--text-secondary)]">
          но гильдия не сдаётся!
        </p>

        <div className="mt-4 rounded-[var(--r-lg)] bg-[var(--bg-elevated)] px-8 py-4 text-center">
          <p className="text-xl font-semibold text-[var(--text-primary)]">Новая неделя — новый шанс.</p>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">HP босса уменьшено на 10%</p>
        </div>

        <button
          type="button"
          className="btn-secondary mt-6"
          onClick={onClose}
        >
          К бою!
        </button>
      </motion.div>
    </motion.div>
  );
};
