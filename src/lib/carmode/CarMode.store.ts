// src/lib/carmode/CarMode.store.ts
import { writable} from 'svelte/store';
import type { SelectionState } from '$lib/stores/selection';
import type { LoadedTrack } from '$lib/utils/normalizeTrack';
import type { PlaybackPhase } from '$lib/helpers/car/types';


/* ─────────────────────────────────────────────
   Played tracks (session only)
   ───────────────────────────────────────────── */

export const currentSelection = writable<SelectionState | null>(null);
export const tracks = writable<LoadedTrack[]>([]);
export const currentTrack = writable<LoadedTrack | null>(null);
export const currentRank = writable<number>(1);

export const status = writable<string>('Loading…');

export const playbackPhase = writable<PlaybackPhase>('idle');
export const elapsed = writable<number>(0);
export const duration = writable<number>(0);
export const progress = writable<number>(0);
export const isPlaying = writable<boolean>(false);

export const showNarrationModal = writable<boolean>(false);
export const timingSource = writable<'spotify' | 'narration'>('spotify');

/* ─────────────────────────────────────────────
   Program history (per show progress)
   Key format:
     DG|1960s|Rock
     COL|Stage_and_Screen|Disney
───────────────────────────────────────────── */
