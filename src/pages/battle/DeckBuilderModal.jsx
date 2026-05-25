import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [sheetOffset, setSheetOffset] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

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

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (diff > 0) {
      setSheetOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (sheetOffset > 100) {
      onClose();
    } else {
      setSheetOffset(0);
    }
  };

  const deckCardIds = localDeck.filter(Boolean);

  /* ===== MOBILE BOTTOM SHEET ===== */
  const mobileContent = (
    <div
      className="flex flex-col"
      style={{ transform: `translateY(${sheetOffset}px)`, transition: isDragging.current ? 'none' : 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {/* Handle для закрытия */}
      <div
        className="bottom-sheet-handle"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Заголовок */}
      <div className="flex items-center justify-between px-1 mb-4">
        <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">Колода</h2>
        <button
          type="button"
          className="h-10 w-10 grid place-items-center rounded-full bg-[var(--bg-elevated)] text-xl font-medium text-[var(--text-tertiary)]"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* Подсказка о слабости босса */}
      <div className="mb-4 rounded-[var(--r-md)] bg-[var(--clay-bg)] p-3.5 text-[14px] font-medium text-[var(--clay)]">
        🎯 Босс слаб к <img src={CATEGORIES[boss.weakness]?.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> {CATEGORIES[boss.weakness]?.label}
      </div>

      {/* Слоты колоды — горизонтальный скролл */}
      <div className="deck-builder-slots-mobile mb-4">
        {[0, 1, 2, 3].map((slotIndex) => {
          const cardId = localDeck[slotIndex];
          const card = cardId ? CARD_LIBRARY.find((c) => c.id === cardId) : null;
          const item = cardId ? coll.find((c) => c.cardId === cardId) : null;
          return (
            <div key={slotIndex} className="deck-builder-slot-mobile">
              {card ? (
                <div className="relative h-full w-full" style={{ aspectRatio: '5/7' }}>
                  <button
                    type="button"
                    onClick={() => removeFromSlot(slotIndex)}
                    className="deck-remove-btn-mobile absolute right-1 top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--clay)] text-[12px] font-semibold text-white"
                  >
                    ×
                  </button>
                  <CardView card={card} stars={item?.stars || 0} count={item?.count} size="fill" />
                </div>
              ) : (
                <div className="slot-empty flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[var(--r-md)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)]" style={{ aspectRatio: '5/7' }}>
                  <span className="text-3xl">+</span>
                  <span className="mt-1 text-[12px] font-semibold">Добавить</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Синергии */}
      {activeSynergies.length > 0 && (
        <div className="mb-4 rounded-[var(--r-md)] bg-[var(--lavender-bg)] p-3 text-[14px] font-medium text-[var(--lavender)]">
          {activeSynergies.map((syn) => (
            <div key={syn.id} className="flex items-center gap-2">
              <span>✨</span>
              <span>{syn.name}: {syn.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Фильтры категорий — горизонтальный скролл */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2" style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveFilter(cat)}
              className={`pill shrink-0 min-h-[44px] text-[13px] font-medium ${activeFilter === cat ? 'active' : ''}`}
            >
              {cat === 'all' ? 'Все' : <><img src={CATEGORIES[cat]?.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> {CATEGORIES[cat]?.label}</>}
            </button>
        ))}
      </div>

      {/* Сетка карточек */}
      <div className="deck-cards-grid-mobile">
        {filteredCards.map((item) => {
          const card = item.card;
          const isSelected = deckCardIds.includes(card.id);
          const isWeakness = card.category === boss.weakness;
          const canSelect = deckCardIds.length < 4 || isSelected;
          const opacity = !canSelect ? 'opacity-40' : '';

          return (
            <div key={card.id} className={`relative ${opacity}`} style={{ aspectRatio: '5/7' }}>
              {isWeakness && (
                <span className="weakness-dot" style={{ width: '10px', height: '10px', top: '6px', right: '6px' }} />
              )}
              <div className="h-full w-full" onClick={() => canSelect && toggleCard(card.id)}>
                <CardView card={card} stars={item.stars || 0} count={item.count} size="fill" selected={isSelected} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Кнопка сохранения */}
      <div className="sticky bottom-0 pt-3 pb-4 bg-[var(--bg-surface)] border-t border-[var(--border-soft)]">
        <button
          type="button"
          className="btn-primary w-full min-h-[48px] text-[15px]"
          onClick={handleSave}
        >
          Сохранить колоду ({deckCardIds.length}/4)
        </button>
      </div>
    </div>
  );

  /* ===== DESKTOP CENTERED MODAL ===== */
  const desktopContent = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Собери колоду для битвы</h2>
        <button type="button" className="text-2xl font-medium text-[var(--text-tertiary)]" onClick={onClose}>×</button>
      </div>

      <div className="mb-4 rounded-[var(--r-md)] bg-[var(--clay-bg)] p-3 text-sm font-medium text-[var(--clay)]">
        🎯 Босс слаб к <img src={CATEGORIES[boss.weakness]?.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> {CATEGORIES[boss.weakness]?.label} — выбирай такие карточки!
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
                    className="absolute right-1 top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--clay)] text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ×
                  </button>
                  <CardView card={card} stars={item?.stars || 0} count={item?.count} size="fill" />
                </div>
              ) : (
                <div className="slot-empty flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-[var(--r-md)] bg-[var(--bg-elevated)] text-[var(--text-tertiary)] transition hover:bg-[var(--bg-surface)]" style={{ aspectRatio: '5/7' }}>
                  <span className="text-2xl">+</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeSynergies.length > 0 && (
        <div className="mb-4 rounded-[var(--r-md)] bg-[var(--lavender-bg)] p-3 text-sm font-medium text-[var(--lavender)]">
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
              className={`pill text-xs ${activeFilter === cat ? 'active' : ''}`}
            >
              {cat === 'all' ? 'Все' : <><img src={CATEGORIES[cat]?.iconSrc} alt="" className="inline-block w-4 h-4 align-text-bottom" /> {CATEGORIES[cat]?.label}</>}
            </button>
        ))}
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto">
        <div className="flex flex-row flex-wrap gap-2">
          {filteredCards.map((item) => {
            const card = item.card;
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
          Сохранить колоду ({deckCardIds.length}/4)
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[9994] backdrop-blur-sm"
        style={{ background: 'var(--bg-overlay)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Mobile Bottom Sheet */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[9995] block md:hidden"
        initial={{ y: '100%' }}
        animate={{ y: sheetOffset > 0 ? sheetOffset : 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bottom-sheet" style={{ maxHeight: '90dvh' }}>
          {mobileContent}
        </div>
      </motion.div>

      {/* Desktop Centered Modal */}
      <motion.div
        className="hidden md:grid md:place-items-center md:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className="relative flex max-h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[var(--r-lg)] bg-[var(--bg-surface)] p-6 shadow-lg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {desktopContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
