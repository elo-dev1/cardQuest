export const normalizeExchange = (exchange) => ({
  ...exchange,
  initiatorId: exchange.initiator_id ?? exchange.initiatorId,
  initiator_id: exchange.initiator_id ?? exchange.initiatorId,
  recipientId: exchange.recipient_id ?? exchange.recipientId,
  recipient_id: exchange.recipient_id ?? exchange.recipientId,
  offeredCardId: exchange.offered_card_id ?? exchange.offeredCardId,
  offered_card_id: exchange.offered_card_id ?? exchange.offeredCardId,
  requestedCardId: exchange.requested_card_id ?? exchange.requestedCardId,
  requested_card_id: exchange.requested_card_id ?? exchange.requestedCardId,
});
