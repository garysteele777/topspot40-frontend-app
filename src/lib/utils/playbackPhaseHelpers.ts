// src/lib/utils/playbackPhaseHelpers.ts

import type {PlaybackPhase} from '$lib/helpers/car/types';

export type NarrationPhase =
    | 'set_intro'
    | 'collection_intro'
    | 'liner'
    | 'intro'
    | 'detail'
    | 'artist';

export function isNarrationPhase(
    phase: PlaybackPhase | null | undefined
): phase is NarrationPhase {
    return (
        phase === 'set_intro' ||
        phase === 'collection_intro' ||
        phase === 'liner' ||
        phase === 'intro' ||
        phase === 'detail' ||
        phase === 'artist'
    );
}

export function hasPlaybackStarted(
    phase: PlaybackPhase | null | undefined
): boolean {
    return isNarrationPhase(phase) || phase === 'track';
}