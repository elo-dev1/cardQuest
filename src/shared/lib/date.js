import { format, subDays, getDay, addDays } from 'date-fns';

export const todayKey = (date = new Date()) => format(date, 'yyyy-MM-dd');

export const lastDays = (count) => {
  const today = new Date();
  const dayOfWeek = getDay(today);
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const monday = subDays(today, daysSinceMonday);
  
  return Array.from({ length: count }, (_, index) => {
    const date = addDays(monday, index);
    return todayKey(date);
  });
};
