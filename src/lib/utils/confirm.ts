import {browser} from '$app/environment';

const CONFIRM_ENABLED =
  (import.meta.env.VITE_CONFIRM_CLEAR ?? '0') === '1';

export function confirmClear(message: string): boolean {
  if (!browser) return false;
  if (!CONFIRM_ENABLED) return true; // ✅ no prompt during debug
  return window.confirm(message);
}
