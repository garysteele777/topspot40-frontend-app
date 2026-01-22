// src/lib/carmode/CarMode.poller.ts

import {
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress
} from '$lib/carmode/CarMode.store';

import type {PlaybackPhase} from '$lib/helpers/car/types';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;

// Prevent replaying same narration or track
let lastNarrationUrl: string | null = null;
let lastSpotifyId: string | null = null;

// Narration queue + lock
let narrationLock = false;
let narrationQueue: string[] = [];

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
    await fetch(`${API_BASE}/playback/narration-finished`, {
        method: 'POST'
    }).catch(() => {
    });
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

            const phase = data.phase as PlaybackPhase;
            playbackPhase.set(phase);

// ─────────────────────────────
// Phase transition reset (must happen BEFORE narration logic)
// ─────────────────────────────
            if (phase !== lastPhase) {
                lastPhase = phase;

                // allow narration to run once for new phase
                lastNarrationUrl = null;

                // (optional but helpful) clear any stale queued items
                narrationQueue = [];
                narrationLock = false;

                elapsed.set(0);
                duration.set(0);
                progress.set(0);
                // ✅ DO NOT return — we still want to process narration/track for the new phase immediately
            }

            const playing =
                typeof data.isPlaying === 'boolean'
                    ? data.isPlaying
                    : phase === 'intro' ||
                    phase === 'detail' ||
                    phase === 'artist' ||
                    phase === 'track';

            isPlaying.set(playing);

            /* ─────────────────────────────
               🎤 Narration handling
               ───────────────────────────── */
            if (
                (phase === 'intro' || phase === 'detail' || phase === 'artist') &&
                data.context?.audio_url
            ) {
                const url = data.context.audio_url as string;
                const mode = data.context.voice_style ?? 'before';

                // Only queue when URL changes
                if (url !== lastNarrationUrl) {
                    console.log(`🎤 Queueing narration (${mode} mode):`, url);
                    lastNarrationUrl = url;
                    narrationQueue.push(url);
                    playNarrationQueue();
                }
            }

            /* ─────────────────────────────
               🎵 Track handling (Spotify)
               ───────────────────────────── */
            if (phase === 'track' && data.context?.spotify_track_id) {
                const spotifyId = data.context.spotify_track_id as string;

                if (spotifyId !== lastSpotifyId) {
                    console.log(
                        '🎵 TRACK phase detected. Starting Spotify track:',
                        spotifyId
                    );
                    lastSpotifyId = spotifyId;

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
               Timing + progress
               Backend returns ms
               ───────────────────────────── */
            const elapsedSec = (data.elapsedMs ?? 0) / 1000;
            const durationSec = (data.durationMs ?? 0) / 1000;

            elapsed.set(elapsedSec);
            duration.set(durationSec);

            const pct =
                durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0;

            progress.set(Math.min(100, Math.max(0, pct)));

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
    lastNarrationUrl = null;
    lastSpotifyId = null;

    narrationQueue = [];
    narrationLock = false;
}

// Compatibility export – older code still imports this
export function markUserStartedPlayback() {
    console.log("▶️ markUserStartedPlayback called (noop)");
}
