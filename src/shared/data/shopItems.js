export const PACK_TYPES = [
  { id: 'basic', name: 'Обычный', emoji: '🟢', cards: 3, price_coins: 100, guarantee: 'common/uncommon', color: '#16a34a' },
  { id: 'rare', name: 'Редкий', emoji: '🔵', cards: 5, price_coins: 200, guarantee: 'uncommon + шанс rare', color: '#2563eb' },
  { id: 'epic', name: 'Эпический', emoji: '🟣', cards: 3, price_coins: 350, guarantee: 'rare guaranteed', color: '#7c3aed' },
];

export const SHOP_ITEMS = [
  { id: 'frame_1', name: 'Новая рамка', emoji: '🖼️', price: 150, type: 'frame' },
  { id: 'bg_1', name: 'Фон профиля', emoji: '🏔️', price: 100, type: 'background' },
  { id: 'effect_1', name: 'Эффект', emoji: '✨', price: 200, type: 'effect' },
  { id: 'boost_2x_coins', name: 'Двойные монеты', emoji: '💰', price: 80, type: 'boost', duration: '24h' },
  { id: 'boost_2x_xp', name: 'Двойной XP', emoji: '⚡', price: 80, type: 'boost', duration: '24h' },
];
