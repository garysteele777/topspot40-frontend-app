import type { LoadedTrack } from '$lib/utils/normalizeTrack';
import type { SelectionState } from '$lib/stores/selection';

/**
 * 🎵 Audio playback phases
 * These are the ONLY phases that drive timing & progress.
 */
export type PlaybackPhase =
	| 'bed'
	| 'intro'
	| 'detail'
	| 'artist'
	| 'track';

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

// Re-export for convenience
export type { SelectionState };
