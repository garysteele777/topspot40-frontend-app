// Reusable, ESLint-safe defaults for Options page + selection store.
import { selection, type Mode, type SelectionState } from '$lib/stores/selection';

/** Canonical rank bounds */
export const DEFAULT_START_RANK = 1;
export const DEFAULT_END_RANK = 10;

/** Canonical toggles */
export const DEFAULT_TOGGLES = {
  playIntro: true,
  playDetail: true,
  playArtistDescription: true,
  textIntro: true,
  textDetail: true,
  textArtistDescription: true
} as const;

export type ToggleKeys = keyof typeof DEFAULT_TOGGLES;

/** Build a default SelectionState (store) object */
export function buildDefaultSelection(language: string = 'en'): SelectionState {
  return {
    mode: 'decade_genre' as Mode,
    language,
    context: null,
    startRank: DEFAULT_START_RANK,
    endRank: DEFAULT_END_RANK,
    tracks: [],
    ...DEFAULT_TOGGLES
  };
}

/** Apply defaults to the store and return the object that was set */
export function applyDefaultSelection(language: string = 'en'): SelectionState {
  const next = buildDefaultSelection(language);
  selection.set(next);
  return next;
}

/**
 * Compute default UI values for the Options page based on the current lists.
 * Keeps your UI reset consistent with store defaults without hard-coding "All".
 */
export function buildDefaultUI(params: {
  decades: string[];
  genres: string[];
  collections: string[];
}) {
  const { decades, genres, collections } = params;

  return {
    modeType: 'decade_genre' as Mode,
    selectedDecade: decades[0] ?? 'All',
    selectedGenre: genres[0] ?? 'All',
    selectedCollection: collections[0] ?? 'All',
    startRank: DEFAULT_START_RANK,
    endRank: DEFAULT_END_RANK,
    ...DEFAULT_TOGGLES
  };
}

/**
 * Full reset for the Options page:
 * - resets the store to defaults (applyDefaultSelection)
 * - returns the UI defaults for you to assign to local variables
 */
export function resetToDefaultsUI(params: {
  decades: string[];
  genres: string[];
  collections: string[];
  language?: string;
}) {
  const { decades, genres, collections, language = 'en' } = params;
  applyDefaultSelection(language);
  return buildDefaultUI({ decades, genres, collections });
}
