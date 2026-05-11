import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CARD_LIBRARY, RARITIES, STAR_LEVELS, UPGRADE_COSTS } from '@/shared/data/cardData';
import { CATEGORIES } from '@/shared/data/taskTemplates';
import { useStore } from '@/shared/store/useStore';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { SegmentedControl } from '@/shared/ui/SegmentedControl';
import { CardView } from '@/entities/card/CardView';
import { CardExchangeModal } from '@/features/card-exchange/ui/CardExchangeModal';

const rarityOptions = [
  ['all', 'Все'],
  ['common', 'Обычные'],
  ['uncommon', 'Необычные'],
  ['rare', 'Редкие'],
  ['epic', 'Эпические'],
  ['legendary', 'Легендарные'],
];

const albums = [
  { id: 'habits', icon: '🌱', title: 'Привычки героя', rarity: ['common', 'uncommon'] },
  { id: 'guild', icon: '🏰', title: 'Сила гильдии', rarity: ['rare', 'epic'] },
  { id: 'legend', icon: '👑', title: 'Легенды семьи', rarity: ['legendary'] },
];

export const CollectionPage = () => {
  const memberCollections = useStore((state) => state.memberCollections);
  const currentCollectionMember = useStore((state) => state.currentCollectionMember);
  const setCurrentCollectionMember = useStore((state) => state.setCurrentCollectionMember);
  const upgradeCard = useStore((state) => state.upgradeCard);
  const addToast = useStore((state) => state.addToast);
  const members = useStore((state) => state.members);
  const [tab, setTab] = useState('cards');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const currentMemberId = useStore((state) => state.currentMemberId);
  const [showExchangeModal, setShowExchangeModal] = useState(false);
  
  const otherMembers = members.filter((m) => m.id !== currentCollectionMember);
  const currentCollection = memberCollections[currentCollectionMember] || [];
  const collectionMap = useMemo(() => new Map(currentCollection.map((item) => [item.cardId, item])), [currentCollection]);
  const ownedCount = currentCollection.length;
  const visibleCards = CARD_LIBRARY.filter((card) => rarityFilter === 'all' || card.rarity === rarityFilter);

  const progressByRarity = Object.keys(RARITIES).map((rarity) => {
    const total = CARD_LIBRARY.filter((card) => card.rarity === rarity).length;
    const owned = CARD_LIBRARY.filter((card) => card.rarity === rarity && collectionMap.has(card.id)).length;
    return { rarity, total, owned, percent: total ? Math.round((owned / total) * 100) : 0 };
  });

  const handleUpgrade = () => {
    if (!selectedCard) return;
    const item = collectionMap.get(selectedCard.id);
    if (!item || item.stars >= 3) {
      addToast('Карточка уже на максимальном уровне!', 'error');
      return;
    }
    if (item.count < 2) {
      addToast('Нужен дубликат для улучшения', 'error');
      return;
    }
    setShowUpgradeModal(true);
  };

  const confirmUpgrade = () => {
    if (!selectedCard) return;
    const result = upgradeCard(selectedCard.id);
    if (result.ok) {
      addToast(`${selectedCard.emoji} ${selectedCard.name} улучшена до ★${result.stars}!`, 'success');
      setShowUpgradeModal(false);
      setSelectedCard(null);
    } else {
      addToast('Не удалось улучшить', 'error');
    }
  };

  const getUpgradeInfo = () => {
    if (!selectedCard) return null;
    const item = collectionMap.get(selectedCard.id);
    const family = useStore.getState().family;
    const currentStars = item?.stars ?? 0;
    if (currentStars >= 3) return null;
    const nextStars = currentStars + 1;
    const cost = UPGRADE_COSTS[nextStars];
    const starLevel = STAR_LEVELS[nextStars];
    const newAttack = Math.round(selectedCard.attack * starLevel.multiplier);
    const newDefense = Math.round(selectedCard.defense * starLevel.multiplier);
    const hasEnoughCoins = (family?.coins ?? 0) >= cost.costCoins;
    return {
      currentStars,
      nextStars,
      cost,
      currentLevel: STAR_LEVELS[currentStars],
      nextLevel: starLevel,
      newAttack,
      newDefense,
      canUpgrade: item && item.count >= 2 && hasEnoughCoins,
      hasEnoughCoins,
      familyCoins: family?.coins ?? 0,
    };
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {members.map((member) => {
          const isSelected = member.id === currentCollectionMember;
          const memberColl = memberCollections[member.id] || [];
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setCurrentCollectionMember(member.id)}
              className={`flex items-center gap-2 shrink-0 rounded-full px-4 py-2 transition ${
                isSelected
                  ? 'bg-[var(--c-purple)] text-white shadow-purple'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              <span className="text-xl">{member.avatar}</span>
              <span className="font-bold text-sm">{member.name}</span>
              <span className="text-xs opacity-70">({memberColl.length})</span>
            </button>
          );
        })}
      </div>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-white">Коллекция</h1>
          <p className="text-sm font-bold text-white/50">{ownedCount} / {CARD_LIBRARY.length} карточек</p>
        </div>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'cards', label: 'Карточки' },
            { value: 'albums', label: 'Альбомы' },
          ]}
        />
      </header>

      {tab === 'cards' ? (
        <>
          <section className="flex gap-2 overflow-x-auto pb-1">
            {rarityOptions.map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setRarityFilter(value)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                  rarityFilter === value ? 'bg-[var(--c-purple)] text-white shadow-purple' : 'bg-white/10 text-white/60'
                }`}
              >
                {label}
              </button>
            ))}
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {progressByRarity.slice(0, 5).map((item) => {
              const rarity = RARITIES[item.rarity];
              return (
                <div key={item.rarity} className="card p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xl">◆</span>
                    <span className="text-xs font-black" style={{ color: rarity.color }}>
                      {item.owned}/{item.total}
                    </span>
                  </div>
                  <div className="mb-2 text-xs font-black text-[var(--text-muted)]">{rarity.label}</div>
                  <ProgressBar value={item.percent} height={5} color={rarity.color} />
                </div>
              );
            })}
          </section>

          <section className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {visibleCards.map((card) => {
              const owned = collectionMap.get(card.id);
              return (
                <CardView
                  key={card.id}
                  card={card}
                  locked={!owned}
                  count={owned?.count}
                  stars={owned?.stars ?? 0}
                  isNew={owned?.isNew}
                  onClick={() => owned && setSelectedCard(card)}
                />
              );
            })}
          </section>
        </>
      ) : (
        <section className="grid gap-3">
          {albums.map((album, index) => {
            const total = CARD_LIBRARY.filter((card) => album.rarity.includes(card.rarity)).length;
            const owned = CARD_LIBRARY.filter((card) => album.rarity.includes(card.rarity) && collectionMap.has(card.id)).length;
            const locked = index > 0 && owned === 0;
            return (
              <div key={album.id} className={`card flex items-center gap-4 p-5 ${locked ? 'opacity-50' : ''}`}>
                <div className="grid h-[60px] w-[60px] place-items-center rounded-2xl bg-[#f8f7ff] text-4xl">
                  {locked ? '🔒' : album.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-[var(--text-primary)]">{album.title}</h2>
                  <p className="mb-2 text-sm font-bold text-[var(--text-muted)]">Собери все и получи бонус</p>
                  <ProgressBar value={total ? (owned / total) * 100 : 0} height={7} color="linear-gradient(90deg,#7c3aed,#f59e0b)" />
                </div>
                <div className="text-sm font-black text-[var(--text-muted)]">{owned}/{total}</div>
              </div>
            );
          })}
        </section>
      )}

      <AnimatePresence>
        {selectedCard ? (
          <motion.div
            className="fixed inset-0 z-[9995] grid place-items-center bg-black/65 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
onClick={() => { setSelectedCard(null); setShowUpgradeModal(false); }}
          >
            <motion.div
              className="card w-full max-w-[360px] p-4"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button type="button" className="absolute right-3 top-3 text-2xl font-black text-gray-400" onClick={() => { setSelectedCard(null); setShowUpgradeModal(false); }}>
                ×
              </button>
              
              <div className="flex flex-col items-center">
                <CardView card={selectedCard} count={collectionMap.get(selectedCard.id)?.count} stars={collectionMap.get(selectedCard.id)?.stars ?? 0} size="lg" />
                
                <h2 className="mt-3 text-xl font-black text-[var(--text-primary)]">{selectedCard.name}</h2>
                
                <div className="mt-2 flex gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black text-white"
                    style={{ background: RARITIES[selectedCard.rarity].color }}
                  >
                    {RARITIES[selectedCard.rarity].label}
                  </span>
                  {(collectionMap.get(selectedCard.id)?.stars ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-700">
                      {STAR_LEVELS[collectionMap.get(selectedCard.id)?.stars ?? 0].label}
                    </span>
                  )}
                </div>

                <div className="mt-4 w-full">
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      className="btn-secondary flex-1" 
                      onClick={handleUpgrade}
                      disabled={(collectionMap.get(selectedCard.id)?.stars ?? 0) >= 3 || (collectionMap.get(selectedCard.id)?.count ?? 0) < 2}
                    >
                      ⬆️ Улучшить
                    </button>
                    {otherMembers.length > 0 && (
                      <button type="button" className="btn-primary flex-1" onClick={() => setShowExchangeModal(true)}>
                        🔄 Обмен
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="text-xs font-black text-gray-400">Атака</div>
                    <div className="text-lg font-black text-[var(--text-primary)]">⚔️ {Math.round(selectedCard.attack * STAR_LEVELS[collectionMap.get(selectedCard.id)?.stars ?? 0].multiplier)}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3 text-center">
                    <div className="text-xs font-black text-gray-400">Защита</div>
                    <div className="text-lg font-black text-[var(--text-primary)]">🛡️ {Math.round(selectedCard.defense * STAR_LEVELS[collectionMap.get(selectedCard.id)?.stars ?? 0].multiplier)}</div>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <span className="text-sm font-black text-[var(--text-purple)]">
                    {CATEGORIES[selectedCard.category]?.icon} {CATEGORIES[selectedCard.category]?.label}
                  </span>
                </div>

                {selectedCard.lore && (
                  <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">{selectedCard.lore}</p>
                )}

                {selectedCard.ability && (
                  <div className="mt-3 rounded-lg bg-[var(--c-purple-pale)] p-3 text-center text-xs font-black text-[var(--text-purple)]">
                    {selectedCard.ability}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CardExchangeModal
        isOpen={showExchangeModal}
        onClose={() => { setShowExchangeModal(false); setSelectedCard(null); }}
        offeredCard={selectedCard}
      />

      <AnimatePresence>
        {showUpgradeModal && selectedCard && getUpgradeInfo() && (
          <motion.div
            className="fixed inset-0 z-[9996] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              className="card w-full max-w-[320px] p-5"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h2 className="text-xl font-black text-[var(--text-primary)]">Улучшение карточки</h2>
                <p className="mt-1 text-sm font-bold text-gray-500">до ★{getUpgradeInfo().nextStars}</p>
              </div>

              <div className="mt-4 flex justify-center">
                <CardView 
                  card={selectedCard} 
                  count={collectionMap.get(selectedCard.id)?.count - 1} 
                  stars={getUpgradeInfo().nextStars} 
                  size="lg" 
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white p-3 text-center">
                  <div className="text-xs font-bold text-gray-400">Стоимость</div>
                  <div className={`text-lg font-black ${getUpgradeInfo().hasEnoughCoins ? 'text-[var(--text-primary)]' : 'text-red-500'}`}>
                    {getUpgradeInfo().cost.costCoins} 🪙
                  </div>
                  <div className="text-xs text-gray-500">Баланс: {getUpgradeInfo().familyCoins}</div>
                </div>
                <div className="rounded-lg bg-white p-3 text-center">
                  <div className="text-xs font-bold text-gray-400">Дубликаты</div>
                  <div className="text-lg font-black text-[var(--text-primary)]">×1</div>
                  <div className="text-xs text-gray-500">Доступно: {(collectionMap.get(selectedCard.id)?.count ?? 0)}</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <div className="text-center text-sm font-black text-gray-500 mb-2">Новые характеристики</div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-400">Атака</div>
                    <div className="font-black text-[var(--text-primary)]">
                      {Math.round(selectedCard.attack * STAR_LEVELS[collectionMap.get(selectedCard.id)?.stars ?? 0].multiplier)} → <span className="text-green-600">{getUpgradeInfo().newAttack}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Защита</div>
                    <div className="font-black text-[var(--text-primary)]">
                      {Math.round(selectedCard.defense * STAR_LEVELS[collectionMap.get(selectedCard.id)?.stars ?? 0].multiplier)} → <span className="text-green-600">{getUpgradeInfo().newDefense}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button 
                  type="button" 
                  className="btn-secondary flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  ← Назад
                </button>
                <button 
                  type="button" 
                  className={`btn-primary flex-1 ${!getUpgradeInfo().canUpgrade ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={confirmUpgrade}
                  disabled={!getUpgradeInfo().canUpgrade}
                >
                  ⬆️ Улучшить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};