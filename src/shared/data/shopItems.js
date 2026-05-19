export const PACK_TYPES = [
  { id: 'basic', name: 'Обычный', emoji: '🟢', cards: 3, price_coins: 100, guarantee: 'common/uncommon', color: '#16a34a' },
  { id: 'rare', name: 'Редкий', emoji: '🔵', cards: 5, price_coins: 200, guarantee: 'uncommon + шанс rare', color: '#2563eb' },
  { id: 'epic', name: 'Эпический', emoji: '🟣', cards: 3, price_coins: 350, guarantee: 'rare guaranteed', color: '#7c3aed' },
];

export const EFFECT_TYPES = [
  { id: 'effect_golden_stars', name: 'Золотые звёзды', emoji: '✨', icon: '/shop/effects/golden_stars.png', price: 200, type: 'effect', description: 'Золотые звёзды с вспышкой', color: '#f59e0b' },
  { id: 'effect_rainbow_fireworks', name: 'Радужный фейерверк', emoji: '🎆', icon: '/shop/effects/rainbow_fireworks.png', price: 300, type: 'effect', description: 'Разноцветный фейерверк', color: '#ec4899' },
  { id: 'effect_magic_sparkles', name: 'Магические искры', emoji: '🔮', icon: '/shop/effects/magical_sparkles.png', price: 250, type: 'effect', description: 'Фиолетовые магические искры', color: '#a855f7' },
  { id: 'effect_confetti_rain', name: 'Дождь из конфетти', emoji: '🎊', icon: '/shop/effects/confetti_rain.png', price: 150, type: 'effect', description: 'Классический дождь из конфетти', color: '#22c55e' },
  { id: 'effect_hero_burst', name: 'Геройский взрыв', emoji: '💥', icon: '/shop/effects/heroic.png', price: 400, type: 'effect', description: 'Мощный взрыв с огненными частицами', color: '#ef4444' },
];

export const BACKGROUND_TYPES = [
  { id: 'bg_cosmos', name: 'Космос', image: '/shop/backgrounds/cosmos.png', imageMini: '/shop/backgrounds/cosmos_mini.png', price: 200 },
  { id: 'bg_fish', name: 'Рыбки', image: '/shop/backgrounds/fish.png', imageMini: '/shop/backgrounds/fish_mini.png', price: 300 },
  { id: 'bg_night', name: 'Ночь', image: '/shop/backgrounds/night.png', imageMini: '/shop/backgrounds/night_mini.png', price: 500 },
  { id: 'bg_sunset', name: 'Закат', image: '/shop/backgrounds/sunset.png', imageMini: '/shop/backgrounds/sunset_mini.png', price: 700 },
  { id: 'bg_woods', name: 'Лес', image: '/shop/backgrounds/woods.png', imageMini: '/shop/backgrounds/woods_mini.png', price: 1000 },
];

export const BOOST_TYPES = [
  { id: 'boost_xp', name: 'Двойной XP', icon: '/shop/boosts/xp.png', price: 100, type: 'boost', duration: '24h', multiplier: 2 },
  { id: 'boost_money', name: 'Двойные монеты', icon: '/shop/boosts/money.png', price: 100, type: 'boost', duration: '24h', multiplier: 2 },
  { id: 'boost_damage', name: 'Удвоенный урон', icon: '/shop/boosts/damage.png', price: 100, type: 'boost', duration: '24h', multiplier: 2 },
];

export const SHOP_ITEMS = [
  { id: 'frame_1', name: 'Новая рамка', emoji: '🖼️', price: 150, type: 'frame' },
  { id: 'bg_1', name: 'Фон профиля', emoji: '🏔️', price: 100, type: 'background' },
];
