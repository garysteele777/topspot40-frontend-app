import type {ResumeState} from '$lib/utils/smartResume';
import type {SelectionState} from '$lib/stores/selection';

export function buildSelectionFromResume(
    resumed: ResumeState | null
): SelectionState | null {
    if (!resumed) return null;

    const {voices} = resumed;

    return {
        mode: resumed.mode,
        context: resumed.context ?? null,

        playIntro: voices.includes('intro'),
        playDetail: voices.includes('detail'),
        playArtistDescription: voices.includes('artist'),

        textIntro: voices.includes('intro'),
        textDetail: voices.includes('detail'),
        textArtistDescription: voices.includes('artist'),

        voices,
        language: resumed.language,
        playbackOrder: resumed.playbackOrder,

        startRank: resumed.startRank,
        endRank: resumed.endRank,
        currentRank: resumed.currentRank ?? resumed.startRank,

        pauseMode: resumed.pauseMode ?? 'pause',

        voicePlayMode: 'before',
        categoryMode: 'single'
    };
}
