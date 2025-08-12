// web/src/app/core/utils/date.ts

import { format, parseISO, isBefore, isAfter, differenceInDays } from 'date-fns';

/**
 * Formats a Date or ISO string to a readable format.
 * @param date - Date object or ISO string
 * @param dateFormat - Optional format string (default: 'yyyy-MM-dd HH:mm')
 */
export function formatDate(date: Date | string, dateFormat = 'yyyy-MM-dd HH:mm'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, dateFormat);
  } catch (error) {
    console.error('Failed to format date:', error);
    return '';
  }
}

/**
 * Checks if a given date is in the past.
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date());
}

/**
 * Checks if a given date is in the future.
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(d, new Date());
}

/**
 * Calculates the difference in days between two dates.
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return differenceInDays(d1, d2);
}
