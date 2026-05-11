export const STAR_LEVELS = {
  0: { label: '', multiplier: 1, borderWidth: 2, glowIntensity: 0.5 },
  1: { label: '★', multiplier: 1.1, borderWidth: 3, glowIntensity: 1 },
  2: { label: '★★', multiplier: 1.25, borderWidth: 4, glowIntensity: 1.5 },
  3: { label: '★★★', multiplier: 1.5, borderWidth: 5, glowIntensity: 2 },
};

export const UPGRADE_COSTS = {
  1: { required: 2, costCoins: 100 },
  2: { required: 4, costCoins: 300 },
  3: { required: 8, costCoins: 600 },
};

export const RARITIES = {
  common: { label: 'Обычная', color: '#9ca3af', bg: '#f3f4f6', glow: 'none' },
  uncommon: { label: 'Необычная', color: '#22c55e', bg: '#f0fdf4', glow: '0 0 12px rgba(34,197,94,0.3)' },
  rare: { label: 'Редкая', color: '#3b82f6', bg: '#eff6ff', glow: '0 0 16px rgba(59,130,246,0.4)' },
  epic: { label: 'Эпическая', color: '#a855f7', bg: 'linear-gradient(#faf5ff,#ede9fe)', glow: '0 0 20px rgba(168,85,247,0.5)' },
  legendary: { label: 'Легендарная', color: '#f59e0b', bg: 'linear-gradient(#fffbeb,#fef3c7)', glow: '0 0 24px rgba(245,158,11,0.7),0 0 48px rgba(245,158,11,0.3)' },
};

export const CARD_IMAGES = {
  c001: '/cards/EarlyRise.png',
  c002: '/cards/Sport.png',
  c003: '/cards/Reading.png',
  c004: '/cards/Concentration.png',
  c005: '/cards/Help.png',
  c006: '/cards/Cleanliness.png',
  c007: '/cards/Creativity.png',
  c008: '/cards/HealthyEating.png',
  c009: '/cards/Persistence.png',
  c010: '/cards/WarmBreakfast.png',
  c011: '/cards/QuickSteps.png',
  c012: '/cards/HomeKnight.png',
  c013: '/cards/MageNotes.png',
  c014: '/cards/HuggingShield.png',
  c015: '/cards/FamilyMarch.png',
  c016: '/cards/StarWater.png',
  c017: '/cards/MageNotes.png',
  c018: '/cards/CozyOrder.png',
  c019: '/cards/KindWord.png',
  c020: '/cards/MoonWorkout.png',
  c021: '/cards/FocusLamp.png',
  c022: '/cards/GoldenRag.png',
  c023: '/cards/GuildHeart.png',
  c024: '/cards/SleepContract.png',
  c025: '/cards/ScoutPicnic.png',
  c026: '/cards/TowerKnowledge.png',
  c027: '/cards/DinnerMaster.png',
  c028: '/cards/MessageGrandma.png',
  c029: '/cards/HabitShield.png',
  c030: '/cards/CometOrder.png',
};

export const STARTER_CARDS = [
  { id: 'c001', name: 'Ранний подъём', emoji: '⏰', category: 'health', rarity: 'common', attack: 10, defense: 0, ability: null, lore: 'Начинает день до того, как сон успел договориться.' },
  { id: 'c002', name: 'Спорт', emoji: '🏋️', category: 'activity', rarity: 'common', attack: 15, defense: 0, ability: null, lore: 'Сила маленьких повторений, собранная в один уверенный удар.' },
  { id: 'c003', name: 'Чтение', emoji: '📖', category: 'study', rarity: 'uncommon', attack: 20, defense: 5, ability: 'Задачи учёбы +10% XP', lore: 'Каждая страница открывает короткий путь через туман.' },
  { id: 'c004', name: 'Сосредоточенность', emoji: '🎯', category: 'study', rarity: 'uncommon', attack: 18, defense: 8, ability: null, lore: 'Когда шум отступает, даже сложная цель выглядит ближе.' },
  { id: 'c005', name: 'Помощь', emoji: '🤝', category: 'care', rarity: 'rare', attack: 25, defense: 15, ability: 'Командный урон +20%', lore: 'Карточка, которая напоминает: вместе урон всегда выше.' },
  { id: 'c006', name: 'Чистота', emoji: '🧹', category: 'home', rarity: 'common', attack: 12, defense: 0, ability: null, lore: 'Убирает хаос с поля и с письменного стола.' },
  { id: 'c007', name: 'Творчество', emoji: '🎨', category: 'special', rarity: 'epic', attack: 45, defense: 20, ability: 'Все карты этого хода x1.5', lore: 'Не спрашивает, можно ли. Просто рисует новую дверь.' },
  { id: 'c008', name: 'Здоровое питание', emoji: '🍎', category: 'health', rarity: 'rare', attack: 30, defense: 10, ability: 'Задачи здоровья +2x урон', lore: 'Сладкий критический удар по усталости.' },
  { id: 'c009', name: 'Настойчивость', emoji: '🏔️', category: 'special', rarity: 'legendary', attack: 85, defense: 30, ability: 'Игнорирует защиту босса', lore: 'Поднимается выше облаков, но не выше семейного расписания.' },
];

export const EXTRA_CARDS = [
  { id: 'c010', name: 'Тёплый завтрак', emoji: '🥣', category: 'health', rarity: 'common', attack: 11, defense: 3, ability: null, lore: 'Мягкий старт для большого дня.' },
  { id: 'c011', name: 'Быстрые шаги', emoji: '👟', category: 'activity', rarity: 'common', attack: 14, defense: 2, ability: null, lore: 'Дистанция складывается из шагов.' },
  { id: 'c012', name: 'Домашний рыцарь', emoji: '🧽', category: 'home', rarity: 'uncommon', attack: 18, defense: 10, ability: 'Домашние задачи +5 защиты', lore: 'Щит из губки и ведра.' },
  { id: 'c013', name: 'Заметки мага', emoji: '📝', category: 'study', rarity: 'common', attack: 12, defense: 4, ability: null, lore: 'Короткая запись сильнее длинного забывания.' },
  { id: 'c014', name: 'Обнимательный щит', emoji: '🫶', category: 'care', rarity: 'rare', attack: 20, defense: 22, ability: 'Снижает урон босса', lore: 'Иногда защита выглядит очень просто.' },
  { id: 'c015', name: 'Семейный марш', emoji: '🥁', category: 'activity', rarity: 'uncommon', attack: 22, defense: 6, ability: 'Активность +10% урон', lore: 'Ритм, под который легче выйти на улицу.' },
  { id: 'c016', name: 'Звёздная вода', emoji: '💦', category: 'health', rarity: 'rare', attack: 28, defense: 12, ability: 'Восстанавливает 10 энергии', lore: 'Восемь стаканов, один блеск.' },
  { id: 'c017', name: 'Секретный конспект', emoji: '📚', category: 'study', rarity: 'epic', attack: 42, defense: 18, ability: 'Следующая учебная задача x2 XP', lore: 'Пахнет карандашом и победой.' },
  { id: 'c018', name: 'Уютный порядок', emoji: '🛋️', category: 'home', rarity: 'common', attack: 13, defense: 5, ability: null, lore: 'Место, где наконец видно пол.' },
  { id: 'c019', name: 'Доброе слово', emoji: '💬', category: 'care', rarity: 'common', attack: 9, defense: 9, ability: null, lore: 'Маленькая фраза с большим радиусом.' },
  { id: 'c020', name: 'Лунная зарядка', emoji: '🌙', category: 'activity', rarity: 'rare', attack: 31, defense: 7, ability: 'Вечерние задачи +15% XP', lore: 'Даже поздно можно сделать чуть-чуть.' },
  { id: 'c021', name: 'Фокус-лампа', emoji: '💡', category: 'study', rarity: 'uncommon', attack: 19, defense: 11, ability: null, lore: 'Светит прямо на сложный абзац.' },
  { id: 'c022', name: 'Золотая тряпка', emoji: '✨', category: 'home', rarity: 'epic', attack: 39, defense: 26, ability: 'Уборка даёт +20 монет', lore: 'Редкий артефакт внезапной мотивации.' },
  { id: 'c023', name: 'Сердце гильдии', emoji: '💖', category: 'care', rarity: 'legendary', attack: 75, defense: 45, ability: 'Вся семья получает +25 XP', lore: 'Не бьёт первой, но побеждает последней.' },
  { id: 'c024', name: 'Сонный договор', emoji: '🛌', category: 'health', rarity: 'uncommon', attack: 16, defense: 18, ability: 'Защита от усталости', lore: 'Подписывается до 23:00.' },
  { id: 'c025', name: 'Пикник следопыта', emoji: '🧺', category: 'activity', rarity: 'common', attack: 15, defense: 4, ability: null, lore: 'Полчаса прогулки превращает карту в праздник.' },
  { id: 'c026', name: 'Башня знаний', emoji: '🏛️', category: 'study', rarity: 'rare', attack: 34, defense: 16, ability: 'Крит по учебным боссам', lore: 'Строится по кирпичику.' },
  { id: 'c027', name: 'Мастер ужина', emoji: '🍳', category: 'home', rarity: 'uncommon', attack: 21, defense: 8, ability: 'Помощь с ужином +10 монет', lore: 'Вкусная карта поддержки.' },
  { id: 'c028', name: 'Весточка бабушке', emoji: '☎️', category: 'care', rarity: 'rare', attack: 26, defense: 19, ability: 'Недельный квест +15%', lore: 'Звонок, который делает день теплее.' },
  { id: 'c029', name: 'Щит привычки', emoji: '🛡️', category: 'special', rarity: 'epic', attack: 35, defense: 35, ability: 'Стрик защищён один день', lore: 'Для дней, когда жизнь немного шумит.' },
  { id: 'c030', name: 'Комета порядка', emoji: '☄️', category: 'special', rarity: 'legendary', attack: 90, defense: 25, ability: 'Три случайные задачи дают x2 награду', lore: 'Появляется редко, зато наводит порядок быстро.' },
];

export const CARD_LIBRARY = [...STARTER_CARDS, ...EXTRA_CARDS].map((card) => ({
  ...card,
  image: CARD_IMAGES[card.id] ?? null,
}));
