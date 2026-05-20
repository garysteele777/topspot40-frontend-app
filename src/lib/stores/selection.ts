import {writable} from 'svelte/store';

import {
    PROGRAM_TYPES,
    normalizeProgramType
} from '$lib/types/program';

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
    languages?: Language[];
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

    skipPlayed?: boolean;
}

/* -----------------------
 * Defaults
 * --------------------- */
const defaultSelection: SelectionState = {
    mode: 'decade_genre',
    programType: PROGRAM_TYPES.PROGRAM_DG,
    language: 'en',
    languages: ['en'],
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
                parsed.mode !== 'artist_spotlight'
            ) {
                parsed.mode = defaultSelection.mode;
            }

            parsed.programType =
                normalizeProgramType(parsed.programType) ??
                defaultSelection.programType;

            const merged: SelectionState = {
                ...defaultSelection,
                ...parsed
            };

            merged.languages =
                parsed.languages &&
                Array.isArray(parsed.languages) &&
                parsed.languages.length > 0
                    ? parsed.languages
                    : [merged.language ?? 'en'];

            return merged;
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