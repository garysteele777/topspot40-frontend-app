import type { ProgramKey } from '$lib/carmode/programHistory';

export function buildProgramKey(
  activeGroup: 'decade_genre' | 'collection',
  decades: string[],
  genres: string[],
  collections: string[]
): ProgramKey {
  if (activeGroup === 'decade_genre') {
    return `DG|${decades[0] ?? ''}|${genres[0] ?? ''}` as ProgramKey;
  }
  return `COL|${collections[0] ?? ''}` as ProgramKey;
}

export function buildProgramLabel(
  activeGroup: 'decade_genre' | 'collection',
  decades: string[],
  genres: string[],
  collections: string[]
) {
  if (activeGroup === 'decade_genre') {
    return `${decades[0] ?? '—'} • ${genres[0] ?? '—'}`;
  }
  return `${collections[0] ?? '—'}`;
}

export function getTotalTracks(startRank: number, endRank: number) {
  return Math.max(0, endRank - startRank + 1);
}
