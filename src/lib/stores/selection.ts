import { writable } from 'svelte/store';

export type Mode = 'decade_genre' | 'collection' | null;

export type PlaybackOrder = 'up' | 'down' | 'shuffle';
export type VoicePlayMode = 'before' | 'over';
export type PauseMode = 'pause' | 'continuous';
export type CategoryMode = 'single' | 'multiple';

export interface SelectionState {
  mode: Mode;
  language: string;
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

  voices: string[];
  playbackOrder: PlaybackOrder;
  voicePlayMode: VoicePlayMode;
  pauseMode: PauseMode;
  categoryMode: CategoryMode;
}

const defaultSelection: SelectionState = {
  mode: null,
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

function loadInitial(): SelectionState {
  try {
    const raw = localStorage.getItem('ts_selection');
    if (raw) {
      return { ...defaultSelection, ...JSON.parse(raw) };
    }
  } catch {}
  return { ...defaultSelection };
}

export const selection = writable<SelectionState>(loadInitial());

selection.subscribe((v) => {
  try {
    localStorage.setItem('ts_selection', JSON.stringify(v));
  } catch {}
});

export function resetSelection() {
  selection.set({ ...defaultSelection });
  localStorage.removeItem('ts_selection');
}
