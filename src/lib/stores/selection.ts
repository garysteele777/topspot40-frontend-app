import { writable } from 'svelte/store';

/* -----------------------
 * Domain Types
 * --------------------- */
export type Mode = 'decade_genre' | 'collection';
export type Language = 'en' | 'es' | 'ptbr';
export type VoicePart = 'intro' | 'detail' | 'artist';

export type PlaybackOrder = 'up' | 'down' | 'shuffle';
export type VoicePlayMode = 'before' | 'over';
export type PauseMode = 'pause' | 'continuous';
export type CategoryMode = 'single' | 'multiple';

/* -----------------------
 * Selection State
 * --------------------- */
export interface SelectionState {
  mode: Mode;
  language: Language;
  context: Record<string, string> | null;

  startRank: number;
  endRank: number;
  currentRank: number;

  playIntro: boolean;
  playDetail: boolean;
  playArtistDescription: boolean;

  textIntro: boolean;
  textDetail: boolean;
  textArtistDescription: boolean;

  voices: VoicePart[];
  playbackOrder: PlaybackOrder;
  voicePlayMode: VoicePlayMode;
  pauseMode: PauseMode;
  categoryMode: CategoryMode;
}

/* -----------------------
 * Defaults
 * --------------------- */
const defaultSelection: SelectionState = {
  mode: 'decade_genre',
  language: 'en',
  context: null,

  startRank: 1,
  endRank: 40,
  currentRank: 1,

  playIntro: true,
  playDetail: false,
  playArtistDescription: false,

  textIntro: true,
  textDetail: false,
  textArtistDescription: false,

  voices: ['intro'],
  playbackOrder: 'up',
  voicePlayMode: 'before',
  pauseMode: 'pause',
  categoryMode: 'single'
};

/* -----------------------
 * Persistence
 * --------------------- */
function loadInitial(): SelectionState {
  try {
    const raw = localStorage.getItem('ts_selection');
    if (raw) {
      const parsed = JSON.parse(raw);

      // Merge but never allow invalid mode
      if (parsed.mode !== 'decade_genre' && parsed.mode !== 'collection') {
        parsed.mode = defaultSelection.mode;
      }

      return { ...defaultSelection, ...parsed };
    }
  } catch {
    // ignore
  }
  return { ...defaultSelection };
}

export const selection = writable<SelectionState>(loadInitial());

selection.subscribe((v) => {
  try {
    localStorage.setItem('ts_selection', JSON.stringify(v));
  } catch {
    // ignore
  }
});

export function resetSelection() {
  selection.set({ ...defaultSelection });
  localStorage.removeItem('ts_selection');
}
