
import { format, addDays } from 'date-fns';

export function getAssistantContext() {
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Custom Banglish translation mapping for Gemini to understand better
  const banglishTerms = {
    today: format(now, 'yyyy-MM-dd'),
    ajke: format(now, 'yyyy-MM-dd'),
    tomorrow: format(addDays(now, 1), 'yyyy-MM-dd'),
    kal: format(addDays(now, 1), 'yyyy-MM-dd'),
    porshu: format(addDays(now, 2), 'yyyy-MM-dd'),
  };
  
  return {
    currentDate: format(now, 'yyyy-MM-dd'),
    currentTime: format(now, 'HH:mm:ss'),
    currentDay: days[now.getDay()],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    locale: navigator.language,
    banglishTerms,
    fullContextString: `Today is ${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}. The current time is ${format(now, 'hh:mm a')}.`
  };
}
