export const BOSS_TYPES = {
  dragon: {
    name: 'Дракон Лени',
    emoji: '🐲',
    subtitle: 'Повелитель прокрастинации',
    weakness: 'activity',
    hp: 1000,
    imageKey: 'dragon',
  },
  giantChaos: {
    name: 'Великан Хаоса',
    emoji: '👹',
    subtitle: 'Огромный, но очень неловкий',
    weakness: 'home',
    hp: 1200,
    imageKey: 'giantChaos',
  },
  witch: {
    name: 'Ведьма Забывчивости',
    emoji: '🧙‍♀️',
    subtitle: 'Самая рассеянная ведьма',
    weakness: 'study',
    hp: 1000,
    imageKey: 'witch',
  },
  spirit: {
    name: 'Призрак Одиночества',
    emoji: '👻',
    subtitle: 'Грустный и ищет друзей',
    weakness: 'care',
    hp: 1000,
    imageKey: 'spirit',
  },
  troll: {
    name: 'Тролль Нытья',
    emoji: '🧌',
    subtitle: 'Вечно всем недоволен',
    weakness: 'care',
    hp: 1000,
    imageKey: 'troll',
  },
};

const BOSS_KEYS = Object.keys(BOSS_TYPES);

export function getRandomBossConfig() {
  const key = BOSS_KEYS[Math.floor(Math.random() * BOSS_KEYS.length)];
  return BOSS_TYPES[key];
}

export function getBossConfigByImageKey(imageKey) {
  return BOSS_TYPES[imageKey] || BOSS_TYPES.dragon;
}

export function getBossConfigByName(name) {
  const found = Object.values(BOSS_TYPES).find((b) => b.name === name);
  return found || BOSS_TYPES.dragon;
}
