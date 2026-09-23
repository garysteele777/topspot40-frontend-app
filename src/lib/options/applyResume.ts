import type {ResumeState} from '$lib/utils/smartResume';
import type {SelectionState} from '$lib/stores/selection';
import {PROGRAM_TYPES} from '$lib/types/program';
import {
    narrationFlagsFromVoices,
    normalizeSelectedVoices
} from '$lib/playbackPreferences';

export function buildSelectionFromResume(
    resumed: ResumeState | null
): SelectionState | null {
    if (!resumed) return null;

    const voices = normalizeSelectedVoices(resumed.voices);
    const narrationFlags = narrationFlagsFromVoices(voices);

    return {
        programType:
            resumed.mode === 'collection'
                ? PROGRAM_TYPES.PROGRAM_COL
                : PROGRAM_TYPES.PROGRAM_DG,

        mode: resumed.mode,
        context: resumed.context ?? null,

        ...narrationFlags,

        textIntro: narrationFlags.playIntro,
        textDetail: narrationFlags.playDetail,
        textArtistDescription: narrationFlags.playArtistDescription,

        voices,
        language: resumed.language,
        languages: resumed.languages ?? [resumed.language],
        // Preserve malformed-present snapshot values for compatibility.
        // Input hardening at this persistence boundary is intentionally deferred.
        playbackOrder: resumed.playbackOrder,

        startRank: resumed.startRank,
        endRank: resumed.endRank,
        currentRank: resumed.currentRank ?? resumed.startRank,

        pauseMode: resumed.pauseMode ?? 'pause',

        voicePlayMode: 'before',
        categoryMode: 'single',
        skipPlayed: resumed.skipPlayed ?? false
    };
}
