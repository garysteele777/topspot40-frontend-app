import {writable} from 'svelte/store';
import type {PlaybackProgramType} from '$lib/types/program';
import type {ModeType} from '$lib/types/playback';

/* -----------------------
 * Domain Types
 * --------------------- */
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
    mode: ModeType;
    programType: PlaybackProgramType;
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

    // ✅ NEW
    skipPlayed?: boolean;
}

/* -----------------------
 * Defaults
 * --------------------- */
const defaultSelection: SelectionState = {
    mode: 'decade_genre',
    programType: 'DG',
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
    categoryMode: 'single',

    skipPlayed: false
};

/* -----------------------
 * Persistence
 * --------------------- */
function loadInitial(): SelectionState {
    try {
        const raw = localStorage.getItem('ts_selection');
        if (raw) {
            const parsed = JSON.parse(raw);

            if (
                parsed.mode !== 'decade_genre' &&
                parsed.mode !== 'collection' &&
                parsed.mode !== 'favorites'
            ) {
                parsed.mode = defaultSelection.mode;
            }

            if (
                parsed.programType !== 'DG' &&
                parsed.programType !== 'COL' &&
                parsed.programType !== 'FAV_DG' &&
                parsed.programType !== 'FAV_COL'
            ) {
                parsed.programType = defaultSelection.programType;
            }

            return {...defaultSelection, ...parsed};
        }
    } catch {
        // ignore
    }
    return {...defaultSelection};
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
    selection.set({...defaultSelection});
    localStorage.removeItem('ts_selection');
}
