export const CATEGORIES = {
  health: { icon: '💧', label: 'Здоровье', iconSrc: '/categories/healthy.png', color: 'bg-blue-100 text-blue-700', gradient: '#06b6d4,#0891b2' },
  activity: { icon: '🏃', label: 'Активность', iconSrc: '/categories/activity.png', color: 'bg-orange-100 text-orange-700', gradient: '#f97316,#ea580c' },
  study: { icon: '📚', label: 'Учёба', iconSrc: '/categories/study.png', color: 'bg-blue-100 text-blue-700', gradient: '#3b82f6,#2563eb' },
  home: { icon: '🏠', label: 'По дому', iconSrc: '/categories/home.png', color: 'bg-green-100 text-green-700', gradient: '#10b981,#059669' },
  care: { icon: '❤️', label: 'Забота', iconSrc: '/categories/care.png', color: 'bg-pink-100 text-pink-700', gradient: '#ec4899,#db2777' },
  special: { icon: '✨', label: 'Особая', iconSrc: '/categories/healthy.png', color: 'bg-purple-100 text-purple-700', gradient: '#8b5cf6,#7c3aed' },
};

export const DIFFICULTY = {
  easy: { label: 'Простая', xp: 10, coins: 5 },
  medium: { label: 'Средняя', xp: 20, coins: 10 },
  hard: { label: 'Сложная', xp: 40, coins: 20 },
};

export const TASK_TEMPLATES = [
  { title: 'Почистить зубы', category: 'health', difficulty: 'easy', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Выпить 8 стаканов воды', category: 'health', difficulty: 'easy', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Сделать зарядку', category: 'activity', difficulty: 'medium', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Прибраться в комнате', category: 'home', difficulty: 'medium', assigned_to: 'children', repeat_type: 'daily' },
  { title: 'Прочитать 20 минут', category: 'study', difficulty: 'easy', assigned_to: 'children', repeat_type: 'daily' },
  { title: 'Погулять 30 минут', category: 'activity', difficulty: 'medium', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Помочь с ужином', category: 'home', difficulty: 'easy', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Лечь спать до 23:00', category: 'health', difficulty: 'easy', assigned_to: 'children', repeat_type: 'daily' },
  { title: 'Сказать спасибо', category: 'care', difficulty: 'easy', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Позвонить бабушке', category: 'care', difficulty: 'medium', assigned_to: 'all', repeat_type: 'weekly' },
  { title: 'Помыть посуду', category: 'home', difficulty: 'easy', assigned_to: 'all', repeat_type: 'daily' },
  { title: 'Выучить 5 новых слов', category: 'study', difficulty: 'medium', assigned_to: 'children', repeat_type: 'daily' },
  { title: 'План семейного вечера', category: 'care', difficulty: 'hard', assigned_to: 'parents', repeat_type: 'weekly' },
];
