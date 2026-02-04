import { writable } from 'svelte/store';
import type { SelectionState } from '$lib/stores/selection';
import type { LoadedTrack } from '$lib/utils/normalizeTrack';
import type { PlaybackPhase } from '$lib/helpers/car/types';
import { browser } from '$app/environment';

/* ─────────────────────────────────────────────
   Selection persistence
───────────────────────────────────────────── */

const SELECTION_KEY = 'ts_last_selection';

function loadSelection(): SelectionState | null {
    if (!browser) return null;

    try {
        const raw = localStorage.getItem(SELECTION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const currentSelection =
    writable<SelectionState | null>(loadSelection());

if (browser) {
    currentSelection.subscribe((v) => {
        if (v) localStorage.setItem(SELECTION_KEY, JSON.stringify(v));
        else localStorage.removeItem(SELECTION_KEY);
    });
}

/* ─────────────────────────────────────────────
   Playback stores
───────────────────────────────────────────── */

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
