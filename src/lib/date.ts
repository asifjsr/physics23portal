import { format, parse, addDays, startOfToday } from 'date-fns';

export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateStr: string) {
  if (!dateStr) return '';
  return format(new Date(dateStr), 'MMM dd, yyyy');
}

export function getWeekdayName(date: Date = new Date()) {
  return format(date, 'EEEE');
}

export function parseRelativeDate(input: string): Date | null {
  const lowInput = input.toLowerCase();
  const today = startOfToday();
  
  if (lowInput.includes('today') || lowInput.includes('ajke') || lowInput.includes('aj')) {
    return today;
  }
  if (lowInput.includes('tomorrow') || lowInput.includes('agamikal')) {
    return addDays(today, 1);
  }
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const banglaDays = ['rabibar', 'sombar', 'mongolbar', 'budhbar', 'brihaspobar', 'shukrobar', 'shonibar'];
  
  for (let i = 0; i < 7; i++) {
    if (lowInput.includes(days[i]) || lowInput.includes(banglaDays[i])) {
      let target = today;
      for (let j = 0; j < 7; j++) {
        if (target.getDay() === i) return target;
        target = addDays(target, 1);
      }
    }
  }

  return null;
}
