import { useEffect, useRef } from 'react';
import { useStore } from '@/shared/store/useStore';
import { CARD_LIBRARY } from '@/shared/data/cardData';

export const ExchangeNotifications = () => {
  const exchanges = useStore((state) => state.exchanges);
  const currentMemberId = useStore((state) => state.currentMemberId);
  const members = useStore((state) => state.members);
  const acceptExchange = useStore((state) => state.acceptExchange);
  const rejectExchange = useStore((state) => state.rejectExchange);
  const addToast = useStore((state) => state.addToast);

  const shownRef = useRef(new Set());

  useEffect(() => {
    const pendingExchanges = exchanges.filter(
      (e) => e.recipientId === currentMemberId && e.status === 'pending'
    );

    pendingExchanges.forEach((exchange) => {
      if (!shownRef.current.has(exchange.id)) {
        shownRef.current.add(exchange.id);

        const initiator = members.find((m) => m.id === exchange.initiatorId);
        const offeredCard = CARD_LIBRARY.find((c) => c.id === exchange.offeredCardId);
        const requestedCard = CARD_LIBRARY.find((c) => c.id === exchange.requestedCardId);

        const avatarDisplay = initiator?.avatar?.startsWith('data:') ? '👤' : (initiator?.avatar || '👤');
        const message = `${avatarDisplay} ${initiator?.name || 'Игрок'} предлагает обмен: ${
          offeredCard?.emoji || '🎴'
        } ${offeredCard?.name || 'карточка'} ↔ ${requestedCard?.emoji || '🎴'} ${requestedCard?.name || 'карточка'}`;

        addToast(message, 'exchange', {
          exchangeId: exchange.id,
          onAccept: () => acceptExchange(exchange.id),
          onReject: () => rejectExchange(exchange.id),
        });
      }
    });
  }, [exchanges, currentMemberId, members, acceptExchange, rejectExchange, addToast]);

  return null;
};