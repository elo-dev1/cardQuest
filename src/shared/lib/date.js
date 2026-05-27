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

export function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getWeekEnd() {
  const monday = getWeekStart();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
}

export function getWeekStartKey() {
  return todayKey(getWeekStart());
}

export function getWeekEndKey() {
  return todayKey(getWeekEnd());
}
