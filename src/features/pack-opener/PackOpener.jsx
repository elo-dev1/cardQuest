import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CARD_LIBRARY } from '@/shared/data/cardData';
import { PACK_TYPES } from '@/shared/data/shopItems';
import { CardView } from '@/entities/card/CardView';
import { useStore } from '@/shared/store/useStore';
import { fireConfetti } from '@/shared/lib/confetti';

const rarityWeights = {
  basic: ['common', 'common', 'common', 'uncommon', 'uncommon', 'rare'],
  rare: ['uncommon', 'uncommon', 'rare', 'rare', 'epic'],
  epic: ['rare', 'rare', 'epic', 'epic', 'legendary'],
};

const pickOne = (packId, index) => {
  const weights = rarityWeights[packId] || rarityWeights.basic;
  const forced = packId === 'epic' && index === 0 ? 'rare' : weights[Math.floor(Math.random() * weights.length)];
  const pool = CARD_LIBRARY.filter((card) => card.rarity === forced);
  return pool[Math.floor(Math.random() * pool.length)] || CARD_LIBRARY[Math.floor(Math.random() * CARD_LIBRARY.length)];
};

export const PackOpener = () => {
  const navigate = useNavigate();
  const addCardToCollection = useStore((state) => state.addCardToCollection);
  const spendCoins = useStore((state) => state.spendCoins);
  const addToast = useStore((state) => state.addToast);
  const [packId, setPackId] = useState(null);
  const [alreadyPaid, setAlreadyPaid] = useState(false);
  const [step, setStep] = useState('intro');
  const [cards, setCards] = useState([]);
  const [results, setResults] = useState([]);
  const [revealed, setRevealed] = useState(0);
  const pack = useMemo(() => PACK_TYPES.find((item) => item.id === packId) || PACK_TYPES[0], [packId]);
  const isOpen = Boolean(packId);

  useEffect(() => {
    const handler = (event) => {
      setPackId(event.detail?.packId || 'basic');
      setAlreadyPaid(event.detail?.alreadyPaid ?? false);
      setStep('intro');
      setCards([]);
      setResults([]);
      setRevealed(0);
    };
    window.addEventListener('open-pack', handler);
    return () => window.removeEventListener('open-pack', handler);
  }, []);

  const close = () => {
    setPackId(null);
    setStep('intro');
  };

  const openPack = () => {
    if (!alreadyPaid && !spendCoins(pack.price_coins)) {
      addToast('Недостаточно монет для открытия пака.', 'error');
      return;
    }
    setAlreadyPaid(false);
    const opened = Array.from({ length: pack.cards }, (_, index) => pickOne(pack.id, index));
    const nextResults = opened.map((card) => ({ card, ...addCardToCollection(card.id) }));
    setCards(opened);
    setResults(nextResults);
    setStep('burst');
    fireConfetti();
    window.setTimeout(() => setStep('reveal'), 760);
  };

  useEffect(() => {
    if (step !== 'reveal' || !cards.length) return undefined;
    setRevealed(0);
    cards.forEach((card, index) => {
      window.setTimeout(() => {
        setRevealed(index + 1);
        if (card.rarity === 'rare') fireConfetti();
        if (card.rarity === 'epic' || card.rarity === 'legendary') fireConfetti();
        if (index === cards.length - 1) {
          window.setTimeout(() => {
            setStep('summary');
            addToast('Пак открыт! Коллекция пополнилась 🃏', 'reward');
          }, 650);
        }
      }, 480 + index * 520);
    });
    return undefined;
  }, [step, cards, addToast]);

  const newCount = results.filter((item) => item.isNew).length;

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={`pack-opener-mobile fixed inset-0 z-[9999] grid place-items-center overflow-hidden p-6 md:grid md:place-items-center md:p-6 ${
            results.some((item) => item.card.rarity === 'legendary') ? '' : ''
          }`}
          style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,124,0.15), var(--bg-app))',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 30 }, (_, index) => (
              <span
                key={index}
                className="absolute h-2 w-2 rounded-full"
                style={{
                  left: `${8 + Math.random() * 84}%`,
                  top: `${8 + Math.random() * 84}%`,
                  background: ['var(--sand)', 'var(--lavender)', 'var(--sage)', '#ec4899'][index % 4],
                  opacity: 0.4,
                }}
              />
            ))}
          </div>

          {step === 'intro' ? (
            <motion.div className="relative z-10 w-full max-w-[360px] text-center" initial={{ y: 20 }} animate={{ y: 0 }}>
              <div
                className="float-soft mx-auto mb-8 grid h-[180px] w-[140px] place-items-center rounded-[var(--r-lg)] border-2 border-[var(--sand-light)] text-6xl"
                style={{ background: `linear-gradient(145deg, ${pack.color}, var(--sand-light))` }}
              >
                {pack.emoji}
              </div>
              <div className="mb-1 text-xl font-semibold text-[var(--text-primary)]">Отличная работа!</div>
              <h2 className="font-['DM_Serif_Display'] mb-6 text-4xl text-[var(--sand)]">ПАКЕТ НАГРАД</h2>
              <button type="button" className="btn-primary mb-3 w-full" onClick={openPack}>
                Открыть пак
              </button>
              <button type="button" className="btn-secondary w-full" onClick={close}>
                Оставить на потом
              </button>
            </motion.div>
          ) : null}

          {step === 'burst' ? (
            <div className="relative z-10 grid place-items-center">
              <div
                className="grid h-[180px] w-[140px] place-items-center rounded-[var(--r-lg)] border-2 border-[var(--sand-light)] text-6xl"
                style={{ background: `linear-gradient(145deg, ${pack.color}, var(--sand-light))`, animation: 'packBurst 0.75s ease forwards' }}
              >
                {pack.emoji}
              </div>
              <div className="absolute top-16 h-48 w-48 rounded-full bg-[var(--sand-bg)]/40 blur-3xl" />
            </div>
          ) : null}

          {step === 'reveal' || step === 'summary' ? (
            <div className="relative z-10 w-full max-w-[760px] text-center">
              <div className="mb-8 flex flex-col md:flex-row md:flex-wrap justify-center gap-5">
                {cards.map((card, index) => (
                  <div
                    key={`${card.id}-${index}`}
                    className="pack-card-3d h-[168px] w-full md:w-[120px]"
                    style={{ transform: step === 'reveal' ? `rotate(${(index - (cards.length - 1) / 2) * 8}deg)` : 'none' }}
                  >
                    <div className={`pack-card-inner relative h-full w-full ${revealed > index || step === 'summary' ? 'is-flipped' : ''}`}>
                      <div className="pack-card-back absolute inset-0 grid place-items-center rounded-[var(--r-md)] border-2 border-[var(--sand-light)] bg-gradient-to-br from-[var(--lavender)] to-[var(--sand)] text-4xl">
                        ⚔️
                      </div>
                      <div className="pack-card-face absolute inset-0">
                        <CardView card={card} count={results[index]?.count} stars={0} isNew={results[index]?.isNew} size="md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {step === 'summary' ? (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="font-['DM_Serif_Display'] mb-2 text-3xl text-[var(--sand)]">Награды получены!</h2>
                  <p className="mb-5 text-lg font-medium text-[var(--text-secondary)]">
                    Новых карточек: {newCount}
                  </p>
                  <div className="mx-auto flex max-w-[420px] gap-3">
                    <button
                      type="button"
                      className="btn-primary flex-1"
                      onClick={() => {
                        close();
                        navigate('/collection');
                      }}
                    >
                      В коллекцию
                    </button>
                    <button type="button" className="btn-secondary flex-1" onClick={openPack}>
                      Открыть ещё
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-lg font-medium text-[var(--text-secondary)]">Карты пробуждаются...</div>
              )}
            </div>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
