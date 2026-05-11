import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { CardView } from '@/entities/card/CardView';

export const BattlePage = () => {
  const boss = useStore((state) => state.boss);
  const members = useStore((state) => state.members);
  const collection = useStore((state) => state.collection);
  const [deckModal, setDeckModal] = useState(false);
  const ownedCards = useMemo(
    () => collection.map((item) => ({ ...item, card: CARD_LIBRARY.find((card) => card.id === item.cardId) })).filter((item) => item.card),
    [collection],
  );
  const deck = ownedCards.slice(0, 4);
  const hpPercent = boss.maxHp ? (boss.hp / boss.maxHp) * 100 : 0;
  const totalDamage = Object.values(boss.damageByMember || {}).reduce((sum, value) => sum + value, 0);

  return (
    <div className="space-y-5">
      <section
        className="relative overflow-hidden rounded-[20px] p-8 text-center text-white"
        style={{ background: 'linear-gradient(135deg, #1a0a2e, #3b0764)' }}
      >
        <div className="pointer-events-none absolute inset-x-10 top-8 h-32 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="float-soft relative z-10 mb-3 text-[80px]">{boss.emoji}</div>
        <h1 className="relative z-10 text-3xl font-black">{boss.name}</h1>
        <p className="relative z-10 mb-5 text-sm font-bold text-white/55">{boss.subtitle}</p>
        <ProgressBar value={hpPercent} height={12} color="linear-gradient(90deg,#ef4444,#f97316)" />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm font-black text-white/70">
          <span>{boss.hp}/{boss.maxHp} HP</span>
          <span className="rounded-full bg-white/10 px-3 py-1">
            Слабость: {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label}
          </span>
          <span>Осталось: {boss.daysLeft} дня 14 ч</span>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-[var(--text-primary)]">Колода гильдии</h2>
            <button type="button" className="btn-ghost !bg-gray-100 !px-3 !py-2 !text-sm !text-gray-700" onClick={() => setDeckModal(true)}>
              Сменить карты
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {deck.map((item) => (
              <div key={item.card.id} className="text-center">
                <CardView card={item.card} count={item.count} />
                <div className="mt-2 text-xs font-black text-[var(--text-muted)]">⚔️ {item.card.attack}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-black text-[var(--text-primary)]">Урон участников</h2>
          <div className="space-y-4">
            {members.map((member) => {
              const damage = boss.damageByMember?.[member.id] || 0;
              return (
                <div key={member.id}>
                  <div className="mb-1 flex items-center justify-between text-sm font-black">
                    <span>{member.avatar} {member.name}</span>
                    <span>{damage}</span>
                  </div>
                  <ProgressBar value={totalDamage ? (damage / totalDamage) * 100 : 0} height={7} color="linear-gradient(90deg,#7c3aed,#f59e0b)" />
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-xl bg-[#f8f7ff] p-4 text-center text-xl font-black text-[var(--text-primary)]">
            Итого: {totalDamage} урона
          </div>
        </section>
      </div>

      <section className="card-dark max-h-[220px] overflow-y-auto p-5 scrollbar-soft">
        <h2 className="mb-3 text-lg font-black text-white">Лог битвы</h2>
        <div className="space-y-2">
          {boss.logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-white/70"
            >
              {log.text}
            </motion.div>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {deckModal ? (
          <motion.div
            className="fixed inset-0 z-[9995] grid place-items-center bg-black/65 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeckModal(false)}
          >
            <motion.div
              className="card w-full max-w-[720px] p-6"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-[var(--text-primary)]">Выбор карт</h2>
                <button type="button" className="text-2xl font-black text-gray-400" onClick={() => setDeckModal(false)}>
                  ×
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {ownedCards.map((item) => (
                  <CardView key={item.card.id} card={item.card} count={item.count} onClick={() => setDeckModal(false)} />
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
