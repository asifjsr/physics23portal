import { parse, differenceInDays, differenceInHours, differenceInMinutes, isAfter } from 'date-fns';

export function parseLocalDateTime(date: string, time?: string): Date {
  const datePart = date; // Expecting YYYY-MM-DD
  const timePart = time || '00:00';
  
  // Try to parse YYYY-MM-DD HH:mm
  try {
    return parse(`${datePart} ${timePart}`, 'yyyy-MM-dd HH:mm', new Date());
  } catch (e) {
    return new Date(datePart);
  }
}

export function getCountdownText(targetDate: Date): string {
  const now = new Date();
  
  if (!isAfter(targetDate, now)) {
    return 'Ended';
  }

  const days = differenceInDays(targetDate, now);
  if (days >= 1) {
    const hours = differenceInHours(targetDate, now) % 24;
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''} left`;
  }

  const hours = differenceInHours(targetDate, now);
  if (hours >= 1) {
    const minutes = differenceInMinutes(targetDate, now) % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''} left`;
  }

  const minutes = differenceInMinutes(targetDate, now);
  if (minutes >= 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} left`;
  }

  return 'Ended';
}

export function isUpcomingDateTime(date: string, time?: string): boolean {
  const target = parseLocalDateTime(date, time);
  return isAfter(target, new Date());
}
