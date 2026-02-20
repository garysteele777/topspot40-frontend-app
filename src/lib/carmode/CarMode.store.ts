import {writable, get} from 'svelte/store';
import type {SelectionState} from '$lib/stores/selection';
import type {LoadedTrack} from '$lib/utils/normalizeTrack';
import type {PlaybackPhase} from '$lib/helpers/car/types';
import {browser} from '$app/environment';
import {selection as baseSelection} from '$lib/stores/selection';

/* ─────────────────────────────────────────────
   Selection persistence
───────────────────────────────────────────── */

export type CarModeTrack = LoadedTrack & {
    rankingId: number | null;

    // ⭐ Favorites metadata
    sourceRank?: number | null;

    genreSlug?: string | null;
    genreName?: string | null;

    decadeSlug?: string | null;
    decadeName?: string | null;
};


const SELECTION_KEY = 'ts_last_selection';

function loadSelection(): SelectionState {
    if (!browser) {
        return get(baseSelection);
    }

    try {
        const raw = localStorage.getItem(SELECTION_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch {
        // ignore parse errors
    }

    // fallback to canonical default selection
    return get(baseSelection);
}

export const currentSelection =
    writable<SelectionState>(loadSelection());

if (browser) {
    currentSelection.subscribe((v) => {
        try {
            localStorage.setItem(SELECTION_KEY, JSON.stringify(v));
        } catch {
            // ignore
        }
    });
}

/* ─────────────────────────────────────────────
   Playback stores
───────────────────────────────────────────── */

export const tracks = writable<CarModeTrack[]>([]);
export const currentTrack = writable<CarModeTrack | null>(null);
export const currentRank = writable<number>(1);

export const status = writable<string>('Loading…');

export const playbackPhase = writable<PlaybackPhase>('idle');
export const elapsed = writable<number>(0);
export const duration = writable<number>(0);
export const progress = writable<number>(0);
export const isPlaying = writable<boolean>(false);

export const showNarrationModal = writable<boolean>(false);
export const timingSource = writable<'spotify' | 'narration'>('spotify');
