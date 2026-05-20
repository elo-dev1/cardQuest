import { useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, DIFFICULTY } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { fireConfetti, fireTaskEffect } from '@/shared/lib/confetti';

const categoryBorderColors = {
  health: '#06b6d4',
  activity: '#f97316',
  study: '#3b82f6',
  home: '#10b981',
  care: '#ec4899',
  special: '#8b5cf6',
};

export const TaskItem = ({ task, memberId, index = 0, isInteractive = true }) => {
  const completeTask = useStore((state) => state.completeTask);
  const uncompleteTask = useStore((state) => state.uncompleteTask);
  const isCompleted = useStore((state) => state.isCompleted(task.id, memberId));
  const addToast = useStore((state) => state.addToast);
  const activeEffect = useStore((state) => state.family?.activeEffect);
  const [floating, setFloating] = useState(null);
  const [animating, setAnimating] = useState(false);
  const category = CATEGORIES[task.category];
  const difficulty = DIFFICULTY[task.difficulty];
  const borderColor = categoryBorderColors[task.category] || '#8b5cf6';

  const toggle = async () => {
    if (!isInteractive) return;
    if (isCompleted) {
      await uncompleteTask(task.id, memberId);
      return;
    }
    setAnimating(true);
    setTimeout(() => setAnimating(false), 350);
    const result = await completeTask(task.id, memberId);
    if (result.wasNewReward) {
      if (activeEffect) {
        fireTaskEffect(activeEffect.replace('effect_', ''));
      } else {
        fireConfetti();
      }
      setFloating(`+${result.reward.xp} XP · +${result.reward.coins} 💰`);
      addToast(`Молодец! +${result.reward.xp} XP заработано 🎉`, 'reward');
      window.setTimeout(() => setFloating(null), 1500);
    }
  };

  return (
    <motion.button
      type="button"
      layout
      onClick={isInteractive ? toggle : undefined}
      initial={{ opacity: 0, y: isCompleted ? -28 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 60, scale: 0.85, transition: { duration: 0.45, ease: 'easeOut' } }}
      transition={{ layout: { duration: 0.45, ease: 'easeOut' }, delay: isCompleted ? 0.05 : index * 0.04, type: 'spring', stiffness: 250, damping: 30 }}
      className={`task-card relative flex w-full items-center gap-4 rounded-[var(--r-md)] border border-[var(--border-soft)] p-4 text-left ${
        isCompleted
          ? 'bg-[var(--sage-bg)] border-[var(--sage-light)]'
          : animating
            ? 'bg-[var(--bg-surface)] ring-2 ring-[var(--sage)] ring-offset-2'
            : 'bg-[var(--bg-surface)] hover:shadow-sm'
      } ${!isInteractive ? 'opacity-60' : ''}`}
      style={{
        cursor: isInteractive ? 'pointer' : 'default',
        borderLeft: `8px solid ${isCompleted ? 'var(--sage)' : borderColor}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <span className={`block text-[16px] font-semibold leading-tight transition-colors ${isCompleted ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}>
          {task.title}
        </span>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            {category?.icon} {category?.label}
          </span>
          <span className="inline-flex rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">
            {difficulty.label}
          </span>
        </div>
      </div>

      <div className="relative shrink-0">
        <span
          className={`relative grid h-[28px] w-[28px] place-items-center rounded-full border-2 text-sm font-semibold transition-all duration-[400ms] ease-out ${
            animating
              ? 'scale-110 border-[var(--sage)] bg-[var(--sage)] text-white'
              : isCompleted
                ? 'border-[var(--sage)] bg-[var(--sage)] text-white'
                : 'border-[var(--border-medium)] bg-[var(--bg-surface)] text-transparent'
          }`}
        >
          ✓
        </span>
        {floating ? (
          <span className="points-float pointer-events-none absolute -top-2 left-5 whitespace-nowrap text-xs font-semibold text-[var(--sand)]">
            {floating}
          </span>
        ) : null}
      </div>
    </motion.button>
  );
};
