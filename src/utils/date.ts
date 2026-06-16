import dayjs from 'dayjs';

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const formatTime = (date: string | Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const isExpired = (date: string | Date): boolean => {
  return dayjs(date).isBefore(dayjs());
};

export const getDaysDiff = (start: string | Date, end: string | Date): number => {
  return dayjs(end).diff(dayjs(start), 'day');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD');
};

export const getMonthRange = (year: number, month: number) => {
  const start = dayjs(`${year}-${month}-01`);
  const end = start.endOf('month');
  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
};

export const getToday = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const getNow = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};
