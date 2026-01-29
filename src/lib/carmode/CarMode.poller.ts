// src/lib/carmode/CarMode.poller.ts

import {
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress,
    currentRank,
    currentTrack,
    tracks
} from '$lib/carmode/CarMode.store';


import type {PlaybackPhase} from '$lib/helpers/car/types';
import {get} from 'svelte/store';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;

let lastSpotifyId: string | null = null;

// Narration queue + lock
let narrationLock = false;
let narrationQueue: string[] = [];

let lastNarrationPhase: PlaybackPhase | null = null;
let trackFinalized = false;
let lastRank: number | null = null;
let narrationSignaled = false;


/* ─────────────────────────────────────────────
   Finalize UI when a track ends
   ───────────────────────────────────────────── */

function finalizeTrackUI(): void {
    console.log('🏁 Track finished → finalizing UI');

    isPlaying.set(false);

    const d = Number(get(duration) ?? 0);
    if (d > 0) {
        elapsed.set(d);
        progress.set(100);
    } else {
        progress.set(0);
    }
}

/* ─────────────────────────────────────────────
   Low-level narration player
   ───────────────────────────────────────────── */

function playOneAudio(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.onended = () => resolve();
        audio.onerror = (e) => reject(e);
        audio.play().catch(reject);
    });
}

async function signalNarrationFinished() {
    if (narrationSignaled) return;
    narrationSignaled = true;

    console.log('📡 Signaling backend: /playback/narration-finished');

    await fetch(`${API_BASE}/playback/narration-finished`, {
        method: 'POST'
    }).catch(() => {});
}


async function playNarrationQueue() {
    if (narrationLock) return;
    narrationLock = true;

    try {
        while (narrationQueue.length > 0) {
            const url = narrationQueue.shift()!;
            console.log('🎤 Playing narration:', url);
            await playOneAudio(url);
        }

        console.log('🔔 Narration queue finished, signaling backend');
        await signalNarrationFinished();
    } catch (err) {
        console.error('❌ Narration playback failed:', err);
    } finally {
        narrationLock = false;
    }
}

/* ─────────────────────────────────────────────
   Poller
   ───────────────────────────────────────────── */

export function startPlaybackPolling() {
    if (pollTimer) return;

    console.log('▶️ Playback polling started');

    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();
            console.log('⏱ Poll data full:', JSON.stringify(data, null, 2));

// ─────────────────────────────
// Rank change → update UI track card
// ─────────────────────────────
            if (typeof data.currentRank === 'number' && data.currentRank !== lastRank) {
                const list = get(tracks);
                const next = list.find(t => t.rank === data.currentRank);

                console.log(`🎯 Rank changed: ${lastRank} → ${data.currentRank}`, next?.trackName);

                currentRank.set(data.currentRank);

                if (next) {
                    currentTrack.set(next);
                }

                // Reset progress/UI for new track
                elapsed.set(0);
                duration.set(0);
                progress.set(0);

                // Allow finalize to happen again for the new track
                trackFinalized = false;

                lastRank = data.currentRank;
            }


            const phase = data.phase as PlaybackPhase;
            playbackPhase.set(phase);

            const prevPhase = lastPhase;

            const playing =
                typeof data.isPlaying === 'boolean'
                    ? data.isPlaying
                    : phase === 'intro' ||
                    phase === 'detail' ||
                    phase === 'artist' ||
                    phase === 'track';

            isPlaying.set(playing);

            // ─────────────────────────────
            // Phase transition reset
            // ─────────────────────────────
            if (phase !== prevPhase) {
                console.log(`🔁 Phase transition: ${prevPhase} → ${phase}`);
                elapsed.set(0);
                duration.set(0);
                progress.set(0);
            }

            /* ─────────────────────────────
               🎤 Narration handling
               ───────────────────────────── */
            if (
                (phase === 'intro' || phase === 'detail' || phase === 'artist') &&
                data.context?.audio_url
            ) {
                if (phase !== lastNarrationPhase) {
                    console.log(`🎤 Narration phase entered: ${phase}`);
                    narrationSignaled = false;   // ✅ reset per phase
                    lastNarrationPhase = phase;


                    const url = data.context.audio_url as string;
                    const mode = data.context.voice_style ?? 'before';

                    console.log(`🎤 Queueing narration (${mode} mode):`, url);

                    narrationQueue.push(url);
                    playNarrationQueue();
                }
            } else if (
                phase !== 'intro' &&
                phase !== 'detail' &&
                phase !== 'artist'
            ) {
                lastNarrationPhase = null;
            }

            /* ─────────────────────────────
               🎵 Track handling (Spotify)
               ───────────────────────────── */
            if (phase === 'track' && data.context?.spotify_track_id) {
                const spotifyId = data.context.spotify_track_id as string;

                if (spotifyId !== lastSpotifyId) {
                    console.log('🎵 TRACK phase detected. Starting Spotify track:', spotifyId);

                    lastSpotifyId = spotifyId;
                    trackFinalized = false;   // 👈 reset for new track

                    await fetch(`${API_BASE}/playback/play-spotify`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({spotify_track_id: spotifyId})
                    }).catch(err => {
                        console.error('❌ Spotify start failed', err);
                    });
                }
            }


            /* ─────────────────────────────
               Timing + progress (clamped + finalize)
               ───────────────────────────── */

            const elapsedMs =
                typeof data.elapsedMs === 'number'
                    ? data.elapsedMs
                    : typeof data.context?.elapsed_seconds === 'number'
                        ? Math.round(data.context.elapsed_seconds * 1000)
                        : 0;

            const durationMs =
                typeof data.durationMs === 'number'
                    ? data.durationMs
                    : typeof data.context?.duration_seconds === 'number'
                        ? Math.round(data.context.duration_seconds * 1000)
                        : 0;

// Convert ms → seconds
            const elapsedSecRaw = elapsedMs / 1000;
            const durationSec = durationMs / 1000;

// Clamp elapsed so it never runs past duration
            const elapsedSec =
                durationSec > 0 ? Math.min(elapsedSecRaw, durationSec) : elapsedSecRaw;

// Update stores
            elapsed.set(elapsedSec);
            duration.set(durationSec);

// Progress 0–100%
            const pct =
                durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0;
            progress.set(Math.min(100, Math.max(0, pct)));

// 🏁 Detect natural track end and finalize UI
            if (
                phase === 'track' &&
                !trackFinalized &&
                durationSec > 0 &&
                elapsedSecRaw >= durationSec
            ) {
                trackFinalized = true;

                console.log('🏁 Track reached end (single fire), finalizing UI');
                finalizeTrackUI();

                // 🔥 Tell backend the track is finished (this advances radio mode)
                try {
                    console.log('📡 Signaling backend: /playback/track-finished');
                    await fetch(`${API_BASE}/playback/track-finished`, {
                        method: 'POST'
                    });
                } catch (err) {
                    console.error('❌ Failed to signal track-finished', err);
                }
            }


            lastPhase = phase;

        } catch (err) {
            console.warn('⚠️ Playback poll error', err);
        }
    }, POLL_INTERVAL_MS);
}

export function stopPlaybackPolling() {
    if (!pollTimer) return;

    console.log('⏹ Playback polling stopped');

    clearInterval(pollTimer);
    pollTimer = null;

    lastPhase = null;
    lastSpotifyId = null;
    trackFinalized = false;

    narrationQueue = [];
    narrationLock = false;
    lastNarrationPhase = null;
}


// Compatibility export
export function markUserStartedPlayback() {
    console.log('▶️ markUserStartedPlayback called (noop)');
}
