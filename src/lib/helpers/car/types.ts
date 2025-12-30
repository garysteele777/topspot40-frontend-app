// src/lib/helpers/car/types.ts
import type { LoadedTrack } from '$lib/utils/normalizeTrack';
import type { SelectionState } from '$lib/stores/selection';

// What phase the backend says we're in
export type PlaybackPhase =
	| 'idle'
	| 'bed'
	| 'intro'
	| 'detail'
	| 'artist'
	| 'track';


// How the user wants to walk the list
export type PlaybackOrder = 'up' | 'down' | 'shuffle';

// A track plus optional duration fields
export type DurationLike = LoadedTrack & {
  duration_ms?: number;
  // seconds version (fallback)
  duration?: number;
};

// Left here so other helpers can import SelectionState through this barrel if needed
export type { SelectionState };
