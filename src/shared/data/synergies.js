export const SYNERGIES = [
  {
    id: 'morning_hero',
    name: 'Утренний герой',
    description: 'Задачи до 9:00 дают ×2 XP',
    requiredCategories: ['health'],
    minCards: 2,
    bonusType: 'xp',
    bonusValue: 2,
  },
  {
    id: 'active_family',
    name: 'Активная семья',
    description: 'Активность даёт +50% урона',
    requiredCategories: ['activity'],
    minCards: 3,
    bonusType: 'damage',
    bonusValue: 1.5,
  },
  {
    id: 'study_master',
    name: 'Мастер учёбы',
    description: 'Учёба даёт ×1.5 к урону и защите',
    requiredCategories: ['study'],
    minCards: 2,
    bonusType: 'all',
    bonusValue: 1.5,
  },
  {
    id: 'home_guardian',
    name: 'Хранитель дома',
    description: 'Домашние задачи +30% к урону',
    requiredCategories: ['home'],
    minCards: 2,
    bonusType: 'damage',
    bonusValue: 1.3,
  },
  {
    id: 'care_circle',
    name: 'Круг заботы',
    description: 'Забота даёт +40% к защите всей семьи',
    requiredCategories: ['care'],
    minCards: 2,
    bonusType: 'defense',
    bonusValue: 1.4,
  },
  {
    id: 'balance_champion',
    name: 'Чемпион баланса',
    description: 'Все категории дают +25% к урону',
    requiredCategories: ['health', 'activity', 'study', 'home', 'care'],
    minCards: 5,
    bonusType: 'damage',
    bonusValue: 1.25,
  },
];

export const getActiveSynergies = (deckCards) => {
  if (!deckCards || deckCards.length === 0) return [];

  return SYNERGIES.filter((syn) => {
    const deckCategories = deckCards.map((c) => c.category);
    const matchedCategories = syn.requiredCategories.filter((cat) => deckCategories.includes(cat));
    return matchedCategories.length >= syn.minCards;
  });
};

export const getNearSynergyHint = (deckCards) => {
  if (!deckCards || deckCards.length === 0) return null;

  for (const syn of SYNERGIES) {
    const deckCategories = deckCards.map((c) => c.category);
    const matched = syn.requiredCategories.filter((cat) => deckCategories.includes(cat));
    const remaining = syn.minCards - matched.length;
    if (remaining === 1 && deckCards.length < 4) {
      return { synergy: syn, missing: 1 };
    }
  }
  return null;
};
