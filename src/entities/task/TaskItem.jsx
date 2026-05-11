import { useState } from 'react';
import { motion } from 'framer-motion';
import { CATEGORIES, DIFFICULTY } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { fireConfetti } from '@/shared/lib/confetti';

export const TaskItem = ({ task, memberId, index = 0, isInteractive = true }) => {
  const completeTask = useStore((state) => state.completeTask);
  const uncompleteTask = useStore((state) => state.uncompleteTask);
  const isCompleted = useStore((state) => state.isCompleted(task.id, memberId));
  const addToast = useStore((state) => state.addToast);
  const [floating, setFloating] = useState(null);
  const category = CATEGORIES[task.category];
  const difficulty = DIFFICULTY[task.difficulty];

  const toggle = async () => {
    if (!isInteractive) return;
    if (isCompleted) {
      await uncompleteTask(task.id, memberId);
      return;
    }
    const result = await completeTask(task.id, memberId);
    if (result.wasNewReward) {
      fireConfetti();
      setFloating(`+${result.reward.xp} XP · +${result.reward.coins} 💰`);
      addToast(`Молодец! +${result.reward.xp} XP заработано 🎉`, 'reward');
      window.setTimeout(() => setFloating(null), 1500);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={isInteractive ? toggle : undefined}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex min-h-[86px] w-full items-center gap-3 rounded-[14px] border-[1.5px] p-4 text-left transition hover:-translate-y-0.5 ${
        isCompleted ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-card'
      } ${!isInteractive ? 'opacity-60' : ''}`}
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
    >
      <span
        className={`relative grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border-2 text-sm font-black ${
          isCompleted ? 'border-[var(--c-green)] bg-[var(--c-green)] text-white' : 'border-gray-300 bg-white text-transparent'
        }`}
      >
        ✓
        {floating ? (
          <span className="points-float pointer-events-none absolute -top-2 left-5 whitespace-nowrap text-xs font-black text-[var(--c-gold)]">
            {floating}
          </span>
        ) : null}
      </span>
      <span className="text-xl">{category?.icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[15px] font-black leading-tight ${isCompleted ? 'text-gray-400 line-through' : 'text-[var(--text-primary)]'}`}>
          {task.title}
        </span>
        <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-black text-gray-500">
          {difficulty.label}
        </span>
      </span>
    </motion.button>
  );
};
