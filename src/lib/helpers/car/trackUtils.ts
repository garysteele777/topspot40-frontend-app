// src/lib/helpers/car/trackUtils.ts
import type { DurationLike, PlaybackOrder, SelectionState } from './types';
import type { LoadedTrack } from '$lib/utils/normalizeTrack';

// Convert whatever we have into seconds, with a safe default
export function getDurationSeconds(track: DurationLike): number {
  const ms =
    track.durationMs ??
    track.duration_ms ??
    (track.duration !== undefined ? track.duration * 1000 : 30000);

  return ms / 1000;
}

// Apply playback order to a list of tracks
export function applyPlaybackOrder(
  list: LoadedTrack[],
  order: PlaybackOrder
): LoadedTrack[] {
  if (order === 'down') return [...list].sort((a, b) => b.rank - a.rank);
  if (order === 'shuffle') return [...list].sort(() => Math.random() - 0.5);
  return [...list].sort((a, b) => a.rank - b.rank);
}

// Pick the initial track based on order + range
export function pickInitialTrack(
  list: LoadedTrack[],
  order: PlaybackOrder,
  startRank: number,
  endRank: number
): LoadedTrack | null {
  if (!list.length) return null;

  if (order === 'shuffle') {
    return list[Math.floor(Math.random() * list.length)];
  }

  if (order === 'down') {
    return list.find((t) => t.rank === endRank) ?? list[0];
  }

  // default: up
  return list.find((t) => t.rank === startRank) ?? list[0];
}

// Build a stable cache key for the current selection
export function cacheKey(sel: SelectionState): string {
  if (sel.mode === 'collection') {
    return `c:${sel.context?.collection_slug}:${sel.language}:${sel.startRank}:${sel.endRank}`;
  }

  return `dg:${sel.context?.decade}:${sel.context?.genre}:${sel.language}:${sel.startRank}:${sel.endRank}`;
}
