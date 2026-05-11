import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CARD_LIBRARY, RARITIES } from '@/shared/data/cardData';
import { useStore } from '@/shared/store/useStore';
import { CardView } from '@/entities/card/CardView';

export const CardExchangeModal = ({ isOpen, onClose, offeredCard }) => {
  const members = useStore((state) => state.members);
  const memberCollections = useStore((state) => state.memberCollections);
  const currentMemberId = useStore((state) => state.currentMemberId);
  const proposeExchange = useStore((state) => state.proposeExchange);
  const addToast = useStore((state) => state.addToast);
  const getExchangesCountToday = useStore((state) => state.getExchangesCountToday);

  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedOfferedCard, setSelectedOfferedCard] = useState(offeredCard);
  const [selectedRequestedCard, setSelectedRequestedCard] = useState(null);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherMembers = useMemo(
    () => members.filter((m) => m.id !== currentMemberId),
    [members, currentMemberId]
  );

  const initiatorCollection = useMemo(
    () => memberCollections[currentMemberId] || [],
    [memberCollections, currentMemberId]
  );
  
  const initiatorCollectionMap = useMemo(
    () => new Map(initiatorCollection.map((item) => [item.cardId, item])),
    [initiatorCollection]
  );

  const recipientCollection = useMemo(
    () => selectedRecipient ? (memberCollections[selectedRecipient.id] || []) : [],
    [memberCollections, selectedRecipient]
  );

  const recipientCollectionMap = useMemo(
    () => new Map(recipientCollection.map((item) => [item.cardId, item])),
    [recipientCollection]
  );

  const availableOfferedCards = useMemo(
    () => CARD_LIBRARY.filter((card) => initiatorCollectionMap.has(card.id)),
    [initiatorCollectionMap]
  );

  const availableRequestedCards = useMemo(
    () => selectedRecipient ? CARD_LIBRARY.filter((card) => recipientCollectionMap.has(card.id)) : [],
    [recipientCollectionMap, selectedRecipient]
  );

  const handleSubmit = async () => {
    if (!selectedRecipient || !selectedOfferedCard || !selectedRequestedCard) return;

    setIsSubmitting(true);

    const countToday = await getExchangesCountToday(currentMemberId);
    if (countToday >= 3) {
      addToast('Достигнут лимит обменов на сегодня (3/3)', 'error');
      setIsSubmitting(false);
      return;
    }

    const result = await proposeExchange(selectedOfferedCard.id, selectedRecipient.id, selectedRequestedCard.id);

    setIsSubmitting(false);

    if (result.ok) {
      setStep(1);
      setSelectedRecipient(null);
      setSelectedOfferedCard(null);
      setSelectedRequestedCard(null);
      onClose();
    } else if (result.reason === 'no_card') {
      addToast('У вас нет этой карточки', 'error');
    } else if (result.reason === 'daily_limit') {
      addToast('Достигнут лимит обменов на сегодня (3/3)', 'error');
    }
  };

  const canProceed = step === 1 ? selectedRecipient : step === 2 ? selectedOfferedCard : selectedRequestedCard;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/65 p-3 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="card w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-4"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-[var(--text-primary)]">Предложить обмен</h2>
            <button type="button" className="text-2xl font-black text-gray-400" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step >= 1 ? 'bg-[var(--c-purple)] text-white' : 'bg-gray-200 text-gray-400'}`}>1</span>
              <span className={`text-sm font-bold ${step >= 1 ? 'text-[var(--text-primary)]' : 'text-gray-400'}`}>Получатель</span>
            </div>

            {step >= 1 && (
              <div className="grid grid-cols-2 gap-2">
                {otherMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => { setSelectedRecipient(member); setStep(2); }}
                    className={`flex items-center gap-2 rounded-lg border-2 p-2 transition ${
                      selectedRecipient?.id === member.id
                        ? 'border-[var(--c-purple)] bg-[var(--c-purple-pale)]'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-xl">{member.avatar}</div>
                    <div className="text-left">
                      <div className="font-black text-sm text-[var(--text-primary)]">{member.name}</div>
                      <div className="text-xs font-bold text-gray-400">{member.role === 'child' ? 'Ребёнок' : 'Взрослый'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step >= 2 ? 'bg-[var(--c-purple)] text-white' : 'bg-gray-200 text-gray-400'}`}>2</span>
              <span className={`text-sm font-bold ${step >= 2 ? 'text-[var(--text-primary)]' : 'text-gray-400'}`}>Вы отдаёте</span>
            </div>

            {step >= 2 && (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {availableOfferedCards.map((card) => {
                  const owned = initiatorCollectionMap.get(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => { setSelectedOfferedCard(card); setStep(3); }}
                      className={`relative ${selectedOfferedCard?.id === card.id ? 'ring-2 ring-[var(--c-purple)] ring-offset-1' : ''}`}
                    >
                      <CardView card={card} count={owned?.count} stars={owned?.stars ?? 0} size="sm" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${step >= 3 ? 'bg-[var(--c-purple)] text-white' : 'bg-gray-200 text-gray-400'}`}>3</span>
              <span className={`text-sm font-bold ${step >= 3 ? 'text-[var(--text-primary)]' : 'text-gray-400'}`}>Вы получаете</span>
            </div>

            {step >= 3 && selectedRecipient && (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                {availableRequestedCards.map((card) => {
                  const owned = recipientCollectionMap.get(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => { setSelectedRequestedCard(card); }}
                      className={`relative ${selectedRequestedCard?.id === card.id ? 'ring-2 ring-[var(--c-purple)] ring-offset-1' : ''}`}
                    >
                      <CardView card={card} count={owned?.count} stars={owned?.stars ?? 0} size="sm" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {step >= 3 && selectedRecipient && selectedOfferedCard && selectedRequestedCard && (
            <div className="mb-4 rounded-xl bg-gray-50 p-3">
              <div className="text-xs font-bold text-gray-500">Обмен с {selectedRecipient.name}:</div>
              <div className="mt-1 flex items-center justify-center gap-3">
                <div className="text-center">
                  <div className="text-xl">{selectedOfferedCard?.emoji}</div>
                  <div className="text-[10px] font-black text-gray-500">{selectedOfferedCard?.name}</div>
                </div>
                <div className="text-xl">↔</div>
                <div className="text-center">
                  <div className="text-xl">{selectedRequestedCard?.emoji}</div>
                  <div className="text-[10px] font-black text-gray-500">{selectedRequestedCard?.name}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary flex-1 py-2 text-sm">
                ← Назад
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && selectedRecipient) setStep(2);
                  else if (step === 2 && selectedOfferedCard) setStep(3);
                }}
                disabled={!canProceed}
                className={`btn-primary flex-1 py-2 text-sm ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Далее →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed || isSubmitting}
                className={`btn-primary flex-1 py-2 text-sm ${!canProceed || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Отправка...' : 'Предложить обмен'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};