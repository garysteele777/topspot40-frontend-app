import { applyDefaultSelection } from '$lib/utils/selectionDefaults';

const LAST_RESET_KEY = 'ts_last_reset';

export function todayKey(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')?.value ?? '0000';
  const m = parts.find(p => p.type === 'month')?.value ?? '01';
  const d = parts.find(p => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function performDailyReset(ttsLanguage: string = 'en'): boolean {
  try {
    const today = todayKey();
    const last = localStorage.getItem(LAST_RESET_KEY);

    if (last !== today) {
      console.log('🌅 Performing daily reset');
      try { sessionStorage.removeItem('ts_selection'); } catch {}

      // ⬇️ One line: use the same defaults everywhere
      applyDefaultSelection(ttsLanguage);

      localStorage.setItem(LAST_RESET_KEY, today);
      return true;
    }
  } catch (e) {
    console.warn('⚠️ Daily reset skipped:', e);
  }
  return false;
}
