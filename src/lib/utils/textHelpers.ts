export function pickFirstNarrationLine(x: unknown): string | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const candidates = ['intro', 'detail', 'artistDescription', 'text', 'info'];
  for (const key of candidates) {
    const v = o[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

export function pickName(o: unknown, keys: string[]): string | undefined {
  if (!o || typeof o !== 'object') return undefined;
  const r = o as Record<string, unknown>;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return undefined;
}

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
