import { motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';

const LOG_TYPE_STYLES = {
  damage: { icon: '⚔️', color: 'text-green-600', bg: 'bg-green-50' },
  crit: { icon: '💥', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  attack: { icon: '🐲', color: 'text-red-600', bg: 'bg-red-50' },
  phase: { icon: '⚠️', color: 'text-orange-600', bg: 'bg-orange-50' },
  synergy: { icon: '✨', color: 'text-purple-600', bg: 'bg-purple-50' },
  victory: { icon: '🏆', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  info: { icon: '📜', color: 'text-gray-600', bg: 'bg-gray-50' },
};

export const BattleLog = () => {
  const boss = useStore((state) => state.boss);
  const logs = boss.logs || [];
  return (
    <div className="card-dark max-h-[260px] overflow-y-auto p-5 scrollbar-soft">
      <h2 className="mb-3 text-lg font-black text-white">Журнал битвы</h2>
      <div className="space-y-2">
        {(!logs || logs.length === 0) ? (
          <p className="text-center text-sm font-bold text-white/40">Ещё нет событий. Выполняй задачи!</p>
        ) : (
          logs.slice(0, 20).map((log) => {
            const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.info;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={`rounded-xl px-4 py-3 text-sm font-bold ${style.color} ${style.bg}`}
              >
                <span className="mr-2">{style.icon}</span>
                {log.text}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
