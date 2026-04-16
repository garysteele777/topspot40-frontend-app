import type { LoadedTrack } from '$lib/utils/normalizeTrack';
import type { SelectionState } from '$lib/stores/selection';

/**
 * 🎵 Audio playback phases
 * These are the ONLY phases that drive timing & progress.
 */
export type PlaybackPhase =
    | 'idle'
    | 'loading'
    | 'prelude'
    | 'set_intro'
    | 'liner'
    | 'intro'
    | 'detail'
    | 'artist'
    | 'track'
    | 'paused'
    | 'stopped'
    | 'ended'
    | 'music';


/**
 * 🚦 Backend / transport states
 * Used for control flow only (polling start/stop).
 */
export type TransportPhase =
	| 'idle'
	| 'loading'
	| 'done'
	| PlaybackPhase;

/**
 * How the user wants to walk the list
 */
export type PlaybackOrder = 'up' | 'down' | 'shuffle';

/**
 * A track plus optional duration fields
 */
export type DurationLike = LoadedTrack & {
	duration_ms?: number;
	// seconds version (fallback)
	duration?: number;
};

/**
 * 🚗 Track shape used inside Car Mode
 * Extends normalized track with DG/Favorites metadata
 */
export type CarModeTrack = DurationLike & {
    rankingId?: number;
    sourceRank?: number;

    decade?: string;
    genre?: string;

    // 🎧 ALL-RADIO metadata
    setNumber?: number;
    blockPosition?: number;
    blockSize?: number;
};


// Re-export for convenience
export type { SelectionState };
