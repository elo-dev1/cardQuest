import { format, subDays } from 'date-fns';

export const todayKey = (date = new Date()) => format(date, 'yyyy-MM-dd');

export const lastDays = (count) =>
  Array.from({ length: count }, (_, index) => {
    const date = subDays(new Date(), count - index - 1);
    return todayKey(date);
  });
