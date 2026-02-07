import type { Language } from '$lib/types/playback';

export function normalizeLanguage(v: string | null | undefined): Language {
  if (v === 'es' || v === 'ptbr') return v;
  return 'en';
}
