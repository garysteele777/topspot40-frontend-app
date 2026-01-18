// src/lib/carmode/CarMode.player.ts
import {get} from 'svelte/store';
import {
    currentSelection,
    currentTrack,
    currentRank,
    status,
    playbackPhase,
    elapsed,
    duration,
    progress,
    isPlaying,
    tracks
} from '$lib/carmode/CarMode.store';

import type {DurationLike, PlaybackPhase as Phase} from '$lib/helpers/car/types';
import {getDurationSeconds} from '$lib/helpers/car/trackUtils';

const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

console.log('✅ CarMode.player.ts LOADED');


let playbackToken = 0;
let statusPoll: number | null = null;
let launchLock = false;
let nextLock = false;
let prevLock = false;
let continuousAdvancePending = false;
let suppressContinuousAdvance = false;

// ✅ shuffle memory (no-repeat)
const playedRandomRanks = new Set<number>();

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────
function resetProgress(): void {
    elapsed.set(0);
    duration.set(0);
    progress.set(0);
}

function stopStatusPolling(): void {
    if (statusPoll !== null) {
        clearInterval(statusPoll);
        statusPoll = null;
    }
}

// ❗ UI-only reset (NO backend calls)
function clearLocalPlaybackState(): void {
    stopStatusPolling();
    playbackPhase.set('idle');
    resetProgress();
}

// ─────────────────────────────────────────────
// Status polling (backend is authoritative)
// ─────────────────────────────────────────────
function startStatusPolling(): void {
    return;

    if (statusPoll !== null) return;

    statusPoll = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();

            const phase: Phase = (data.current_phase ?? data.context?.phase ?? 'idle') as Phase;

            if (phase === 'idle' || data.stopped) {
                const sel = get(currentSelection);

                stopStatusPolling();
                playbackPhase.set('idle');
                isPlaying.set(false);
                resetProgress();

                if (
                    data.sequence_done === true &&
                    sel?.pauseMode === 'continuous' &&
                    continuousAdvancePending &&
                    !suppressContinuousAdvance
                ) {

                    continuousAdvancePending = false; // 🔒 latch
                    setTimeout(() => nextTrack(), 150);
                }

                return;
            }

            playbackPhase.set(phase);
            isPlaying.set(Boolean(data.is_playing));

            // Sync rank → UI
            const backendRank = data.current_rank;
            const localRank = get(currentRank);

            if (backendRank && backendRank !== localRank) {
                const list = get(tracks);
                const next = list.find((t) => t.rank === backendRank);

                if (next) {
                    currentTrack.set(next);
                    currentRank.set(next.rank);
                    duration.set(next.durationSeconds ?? 1);
                    elapsed.set(0);
                    progress.set(0);
                }
            }

            const durationSec = data.duration_seconds ?? data.context?.durationSeconds ?? 1;

            duration.set(durationSec);

            const elapsedSec = data.elapsed_seconds ?? 0;
            elapsed.set(elapsedSec);

            const pct = (elapsedSec / durationSec) * 100;
            progress.set(Math.min(100, Math.max(0, pct)));
        } catch {
            stopStatusPolling();
        }
    }, 500);
}

// ─────────────────────────────────────────────
// Track update (optionally launches backend)
// ─────────────────────────────────────────────
export function updateTrack(track: DurationLike, opts: { launchBackend?: boolean } = {}): void {
    const token = ++playbackToken;

    clearLocalPlaybackState();

    currentTrack.set(track);
    currentRank.set(track.rank);
    status.set(`Rank ${track.rank}: ${track.trackName}`);

    playedRandomRanks.add(track.rank);

    // Auto-advance should only arm when we're intentionally launching playback
    if (opts.launchBackend) {
        continuousAdvancePending = true;
        suppressContinuousAdvance = false;
    }

    elapsed.set(0);
    progress.set(0);
    // ⛔ duration is owned by the poller


    if (opts.launchBackend) {
        requestAnimationFrame(() => {
            void triggerPlayback(track, token);
        });
    }
}

async function triggerPlayback(track: DurationLike, token: number): Promise<void> {
    if (token !== playbackToken) return;
    if (launchLock) return;

    launchLock = true;

    try {
        const sel = get(currentSelection);
        if (!sel) return;

        const voices = sel.voices ?? [];

        const params = new URLSearchParams({
            start_rank: String(track.rank),
            end_rank: String(track.rank),
            play_intro: String(voices.includes('intro')),
            play_detail: String(voices.includes('detail')),
            play_artist_description: String(voices.includes('artist')),
            tts_language: sel.language,
            play_track: 'true',
            voice_style: sel.voicePlayMode
        });

        if (sel.mode === 'decade_genre') {
            params.set('decade', sel.context?.decade ?? '');
            params.set('genre', sel.context?.genre ?? '');

            await fetch(`${API_BASE}/supabase/decade-genre/play-sequence?${params.toString()}`);
        }

        if (sel.mode === 'collection') {
            params.set('slug', sel.context?.collection_slug ?? '');

            await fetch(`${API_BASE}/supabase/collections/play-collection-sequence?${params.toString()}`);
        }

        startStatusPolling();
    } finally {
        launchLock = false;
    }
}

// ─────────────────────────────────────────────
// No-repeat shuffle picker
// ─────────────────────────────────────────────
function pickRandomNoRepeat(list: DurationLike[], currentRank?: number): DurationLike | undefined {
    const available = list.filter((t) => t.rank !== currentRank && !playedRandomRanks.has(t.rank));

    const pool = available.length ? available : list.filter((t) => t.rank !== currentRank);

    if (!pool.length) return undefined;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return chosen;
}

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────
export async function nextTrack(): Promise<void> {
    if (nextLock) return;
    nextLock = true;

    try {
        const list = get(tracks);
        const sel = get(currentSelection);
        const current = get(currentTrack);
        if (!list.length || !current) return;

        // 🚫 manual navigation disables auto-advance
        suppressContinuousAdvance = true;
        continuousAdvancePending = false;

        if (sel?.playbackOrder === 'shuffle') {
            const pick = pickRandomNoRepeat(list, current.rank);
            if (pick) updateTrack(pick, {launchBackend: true});

            return;
        }

        const idx = list.findIndex((t) => t.rank === current.rank);
        if (idx >= 0 && list[idx + 1]) {
            updateTrack(list[idx + 1], {launchBackend: true});
        }
    } finally {
        nextLock = false;
    }
}

export async function prevTrack(): Promise<void> {
    if (prevLock) return;
    prevLock = true;

    try {
        const list = get(tracks);
        const sel = get(currentSelection);
        const current = get(currentTrack);
        if (!list.length || !current) return;

        // 🚫 manual navigation disables auto-advance
        suppressContinuousAdvance = true;
        continuousAdvancePending = false;

        if (sel?.playbackOrder === 'shuffle') {
            const pick = pickRandomNoRepeat(list, current.rank);
            if (pick) updateTrack(pick, {launchBackend: true});

            return;
        }

        const idx = list.findIndex((t) => t.rank === current.rank);
        if (idx > 0) {
            updateTrack(list[idx - 1], {launchBackend: true});
        }
    } finally {
        prevLock = false;
    }
}

// ─────────────────────────────────────────────
// UI + backend stop
// ─────────────────────────────────────────────
export async function clearAllPlayback(): Promise<void> {
    stopStatusPolling();
    playbackPhase.set('idle');
    isPlaying.set(false);
    resetProgress();

    playedRandomRanks.clear(); // ✅ reset shuffle memory

    if (typeof window !== 'undefined') {
        try {
            await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});
        } catch {
            // ignore
        }
    }
}

// ─────────────────────────────────────────────
// Explicit Play (used by Play button)
// ─────────────────────────────────────────────
export function playCurrentTrack(): void {
    const track = get(currentTrack);
    if (!track) return;

    updateTrack(track, {launchBackend: true});
}
