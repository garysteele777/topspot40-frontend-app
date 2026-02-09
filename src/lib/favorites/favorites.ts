export type ProgramType = 'DG' | 'COL';

type FavoritesStore = {
  DG: Record<string, number[]>;   // decade -> track_ranking.id[]
  COL: Record<string, number[]>;  // collectionGroupSlug -> collection_ranking.id[]
};

const STORAGE_KEY = 'ts-favorites-v1';

function safeParse(json: string): FavoritesStore | null {
  try {
    const data = JSON.parse(json) as FavoritesStore;
    if (!data || typeof data !== 'object') return null;
    if (!data.DG || !data.COL) return null;
    return data;
  } catch {
    return null;
  }
}

function load(): FavoritesStore {
  if (typeof localStorage === 'undefined') return { DG: {}, COL: {} };

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { DG: {}, COL: {} };

  return safeParse(raw) ?? { DG: {}, COL: {} };
}

function save(data: FavoritesStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function isFavorite(
  program: ProgramType,
  group: string,
  rankingId: number
): boolean {
  const data = load();
  const list = data[program][group] ?? [];
  return list.includes(rankingId);
}

export function toggleFavorite(
  program: ProgramType,
  group: string,
  rankingId: number
): { added: boolean; count: number } {
  const data = load();
  const list = data[program][group] ?? [];

  const exists = list.includes(rankingId);

  const next = exists
    ? list.filter((id) => id !== rankingId)
    : [...list, rankingId];

  data[program][group] = next;
  save(data);

  return { added: !exists, count: next.length };
}

export function countFavorites(
  program: ProgramType,
  group: string
): number {
  const data = load();
  return (data[program][group] ?? []).length;
}

export function clearFavorites(
  program: ProgramType,
  group: string
): void {
  const data = load();
  delete data[program][group];
  save(data);
}

export function getFavorites(
  program: ProgramType,
  group: string
): number[] {
  const data = load();
  return data[program][group] ?? [];
}
