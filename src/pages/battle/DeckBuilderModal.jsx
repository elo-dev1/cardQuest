import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@/shared/store/useStore';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { getActiveSynergies } from '@/shared/data/synergies';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { CardView } from '@/entities/card/CardView';

const CATEGORY_ORDER = ['all', 'health', 'activity', 'study', 'home', 'care', 'special'];

export const DeckBuilderModal = ({ onClose, initialSlot }) => {
  const boss = useStore((state) => state.boss);
  const bossDeck = useStore((state) => state.bossDeck);
  const getCurrentMember = useStore((state) => state.getCurrentMember);
  const memberCollections = useStore((state) => state.memberCollections);
  const setBossDeckAction = useStore((state) => state.setBossDeck);

  const currentMember = getCurrentMember();
  const [activeFilter, setActiveFilter] = useState('all');
  const baseDeck = bossDeck[currentMember?.id] || [];
  const [localDeck, setLocalDeck] = useState(
    initialSlot !== undefined && !baseDeck[initialSlot]
      ? [...baseDeck, null]
      : baseDeck,
  );

  const coll = memberCollections[currentMember?.id] || [];
  const availableCards = coll
    .map((item) => ({ ...item, card: CARD_LIBRARY.find((c) => c.id === item.cardId) }))
    .filter((item) => item.card && item.count > 0);

  const filteredCards = activeFilter === 'all'
    ? availableCards
    : availableCards.filter((item) => item.card.category === activeFilter);

  const deckCards = localDeck
    .map((cardId) => {
      if (!cardId) return null;
      const item = coll.find((c) => c.cardId === cardId);
      const card = CARD_LIBRARY.find((c) => c.id === cardId);
      return item && card ? { ...item, card } : null;
    })
    .filter(Boolean);

  const activeSynergies = useMemo(() => getActiveSynergies(deckCards.map((c) => c.card)), [deckCards]);

  const toggleCard = useCallback((cardId) => {
    const deckWithoutNulls = localDeck.filter(Boolean);
    if (deckWithoutNulls.includes(cardId)) {
      setLocalDeck(deckWithoutNulls.filter((id) => id !== cardId));
    } else if (deckWithoutNulls.length < 4) {
      setLocalDeck([...deckWithoutNulls, cardId]);
    }
  }, [localDeck]);

  const removeFromSlot = useCallback((slotIndex) => {
    setLocalDeck((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next.filter(Boolean);
    });
  }, []);

  const handleSave = useCallback(() => {
    setBossDeckAction(localDeck.filter(Boolean));
    onClose();
  }, [localDeck, setBossDeckAction, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[9995] grid place-items-center bg-black/65 p-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="card relative flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden p-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-[var(--text-primary)]">Собери колоду для битвы</h2>
          <button type="button" className="text-2xl font-black text-gray-400" onClick={onClose}>×</button>
        </div>

        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
          🎯 Босс слаб к {CATEGORIES[boss.weakness]?.icon} {CATEGORIES[boss.weakness]?.label} — выбирай такие карточки!
        </div>

        <div className="mb-4 flex gap-2">
          {[0, 1, 2, 3].map((slotIndex) => {
            const cardId = localDeck[slotIndex];
            const card = cardId ? CARD_LIBRARY.find((c) => c.id === cardId) : null;
            const item = cardId ? coll.find((c) => c.cardId === cardId) : null;
            return (
              <div key={slotIndex} className="flex-1">
                {card ? (
                  <div className="group relative h-full w-full" style={{ aspectRatio: '5/7' }}>
                    <button
                      type="button"
                      onClick={() => removeFromSlot(slotIndex)}
                      className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white opacity-0 transition group-hover:opacity-100"
                    >
                      ×
                    </button>
                    <CardView card={card} stars={item?.stars || 0} count={item?.count} size="fill" />
                  </div>
                ) : (
                  <div className="slot-empty flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[12px] bg-white/5 text-white/40 transition hover:bg-white/10" style={{ aspectRatio: '5/7' }}>
                    <span className="text-2xl">+</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeSynergies.length > 0 && (
          <div className="mb-4 rounded-xl bg-purple-100 p-3 text-sm font-bold text-purple-700">
            {activeSynergies.map((syn) => (
              <div key={syn.id} className="flex items-center gap-2">
                <span>✨</span>
                <span>{syn.name}: {syn.description}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                activeFilter === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Все' : `${CATEGORIES[cat]?.icon} ${CATEGORIES[cat]?.label}`}
            </button>
          ))}
        </div>

        <div className="custom-scrollbar flex-1 overflow-y-auto">
          <div className="flex flex-row flex-wrap gap-2">
            {filteredCards.map((item) => {
              const card = item.card;
              const deckCardIds = localDeck.filter(Boolean);
              const isSelected = deckCardIds.includes(card.id);
              const isWeakness = card.category === boss.weakness;
              const canSelect = deckCardIds.length < 4 || isSelected;
              const opacity = !canSelect ? 'opacity-40' : '';

              return (
                <div key={card.id} className={`relative ${opacity}`} style={{ width: '100px', height: '140px' }}>
                  {isWeakness && (
                    <span className="weakness-dot" />
                  )}
                  <div className="h-full w-full" onClick={() => canSelect && toggleCard(card.id)}>
                    <CardView card={card} stars={item.stars || 0} count={item.count} size="fill" selected={isSelected} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
          >
            Сохранить колоду ({localDeck.filter(Boolean).length}/4)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
