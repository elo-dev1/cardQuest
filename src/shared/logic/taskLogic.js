import { v4 as uuidv4 } from 'uuid';

export const normalizeTask = (task, index = 0) => ({
  ...task,
  id: task.id ?? uuidv4(),
  category: task.category ?? 'home',
  difficulty: task.difficulty ?? 'easy',
  assigned_to: task.assigned_to ?? 'all',
  repeat_type: task.repeat_type ?? 'daily',
  is_active: task.is_active ?? true,
  sort_order: task.sort_order ?? index,
});
