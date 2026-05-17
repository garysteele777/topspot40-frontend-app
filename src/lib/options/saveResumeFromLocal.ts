// src/lib/options/saveResumeFromLocal.ts

import { saveResumeState, type ResumeState } from '$lib/utils/smartResume';

import type {
    Language,
    ModeType,
    PauseMode,
    PlaybackOrder,
    VoicePart
} from '$lib/types/playback';

// ─────────────────────────────────────────────
// Save current playback selection for resume
// ─────────────────────────────────────────────
//
// This helper converts the current frontend selection state
// into a normalized ResumeState object that can be restored
// later by the smart resume system.
//
// NOTE:
// - mode identifies the low-level playback engine
//   ('decade_genre', 'collection', 'artist_spotlight')
// - Radio vs Program behavior is determined elsewhere
//   through programType and runtime launch context.

export function saveResumeFromLocal(params: {
    activeGroup: ModeType;
    context: Record<string, string>;
    language: Language;
    languages?: Language[];
    startRank: number;
    endRank: number;
    playbackOrder: PlaybackOrder;
    pauseMode: PauseMode;
    voices: VoicePart[];
    skipPlayed: boolean;
}): void {

    const state: ResumeState = {
        mode: params.activeGroup,
        context: params.context,

        language: params.language,
        languages: params.languages ?? [params.language],

        startRank: params.startRank,
        endRank: params.endRank,
        currentRank: params.startRank,

        playbackOrder: params.playbackOrder,
        pauseMode: params.pauseMode,

        voices: params.voices,
        skipPlayed: params.skipPlayed
    };

    saveResumeState(state);
}