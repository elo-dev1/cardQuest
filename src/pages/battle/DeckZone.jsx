import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { getActiveSynergies, getNearSynergyHint } from '@/shared/data/synergies';
import { CardView } from '@/entities/card/CardView';

const DeckSlot = ({ cardId, onRemove, onClick, isEmpty }) => {
  if (isEmpty) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="slot-empty flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[12px] bg-white/5 text-white/40 transition hover:bg-white/10"
        style={{ aspectRatio: '5/7' }}
      >
        <span className="text-2xl">+</span>
        <span className="mt-1 text-[10px] font-bold">Добавить</span>
      </button>
    );
  }

  const card = CARD_LIBRARY.find((c) => c.id === cardId);
  const { memberCollections, getCurrentMember } = useStore.getState();
  const currentMember = getCurrentMember();
  const coll = memberCollections[currentMember?.id] || [];
  const item = coll.find((c) => c.cardId === cardId);
  const stars = item?.stars || 0;

  return (
    <div className="group relative h-full" style={{ aspectRatio: '5/7' }}>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100"
        >
          ×
        </button>
      )}
      <div className="h-full w-full cursor-pointer" onClick={onClick}>
        <CardView card={card} stars={stars} count={item?.count} size="fill" />
      </div>
      {card && (
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-10">
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-500">⚔️ {Math.round(card.attack * [1, 1.1, 1.25, 1.5][stars])}</span>
        </div>
      )}
    </div>
  );
};

export const DeckZone = ({ onOpenBuilder }) => {
  const bossDeck = useStore((state) => state.bossDeck);
  const getCurrentMember = useStore((state) => state.getCurrentMember);
  const memberCollections = useStore((state) => state.memberCollections);
  const currentMember = getCurrentMember();

  const deckCardIds = bossDeck[currentMember?.id] || [];
  const deckCards = deckCardIds
    .map((cardId) => {
      const coll = memberCollections[currentMember?.id] || [];
      const item = coll.find((c) => c.cardId === cardId);
      const card = CARD_LIBRARY.find((c) => c.id === cardId);
      return item && card ? { ...item, card } : null;
    })
    .filter(Boolean);

  const activeSynergies = useMemo(() => getActiveSynergies(deckCards.map((c) => c.card)), [deckCards]);
  const nearHint = useMemo(() => getNearSynergyHint(deckCards.map((c) => c.card)), [deckCards]);

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-black text-[var(--text-primary)]">Моя колода</h2>
        <button type="button" className="btn-secondary !px-4 !py-2 !text-sm" onClick={onOpenBuilder}>
          Собрать колоду
        </button>
      </div>

      <div className="mb-4 flex gap-3">
        {[0, 1, 2, 3].map((slotIndex) => {
          const cardId = deckCardIds[slotIndex];
          return (
            <div key={slotIndex} className="flex-1">
              <DeckSlot
                cardId={cardId}
                isEmpty={!cardId}
                onClick={() => onOpenBuilder(slotIndex)}
                onRemove={cardId ? () => {
                  const next = [...deckCardIds];
                  next.splice(slotIndex, 1);
                  useStore.getState().setBossDeck(next);
                } : undefined}
              />
            </div>
          );
        })}
      </div>

      {activeSynergies.length > 0 && (
        <motion.div
          className="synergy-active rounded-xl p-3"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {activeSynergies.map((syn) => (
            <div key={syn.id} className="flex items-center gap-2 text-sm font-bold text-green-700">
              <span>✨</span>
              <span>Синергия активна: {syn.name} — {syn.description}</span>
            </div>
          ))}
        </motion.div>
      )}

      {nearHint && (
        <div className="synergy-hint mt-2 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-yellow-700">
            <span>💡</span>
            <span>Добавь ещё {nearHint.missing} карту для синергии «{nearHint.synergy.name}»</span>
          </div>
        </div>
      )}
    </div>
  );
};
