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

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;
let userStartedPlayback = false;

let narrationAudio: HTMLAudioElement | null = null;
let lastNarrationUrl: string | null = null;
let lastSpotifyId: string | null = null;   // ✅ add this


const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

export function markUserStartedPlayback() {
    userStartedPlayback = true;
}


export function startPlaybackPolling() {
    if (pollTimer) return;

    console.log('▶️ Playback polling started');

    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();

            console.log('⏱ Poll data full:', JSON.stringify(data, null, 2));


// 🎤 Handle remote narration playback (intro / detail / artist)
            if (
                (data.phase === 'intro' || data.phase === 'detail' || data.phase === 'artist') &&
                data.context?.audio_url
            ) {
                const url = data.context.audio_url as string;
                const mode = data.context.voice_style ?? 'before';   // 🔑

                // Prevent restarting the same narration every poll
                if (url !== lastNarrationUrl) {
                    console.log(`🎤 Playing narration (${mode} mode):`, url);
                    lastNarrationUrl = url;

                    if (!narrationAudio) {
                        narrationAudio = new Audio();
                    }

                    narrationAudio.pause();
                    narrationAudio.currentTime = 0;
                    narrationAudio.src = url;

                    if (mode === 'before') {
                        // ✅ Backend-owned playback: do NOT stop/cancel anything from the frontend.
                        console.log('🎧 BEFORE mode: backend owns Spotify sequencing (no /playback/stop)');
                    } else {
                        console.log('🎧 OVER mode: narration will play over the track');
                    }


                    narrationAudio.onended = async () => {
                        console.log('🎤 Narration finished');

                        if (mode === 'before') {
                            console.log('▶️ Signaling backend narration finished');
                            await fetch(`${API_BASE}/playback/narration-finished`, {method: 'POST'}).catch(() => {
                            });
                        }
                    };


                    narrationAudio.onerror = (e) => {
                        console.error('❌ Narration audio error', e);
                    };

                    narrationAudio.play().catch(err =>
                        console.error('❌ Audio play failed:', err)
                    );
                }
            }


            // 🎵 Handle TRACK phase (Spotify playback) — same pattern as narration
            if (
                data.phase === 'track' &&
                data.context?.spotify_track_id
            ) {
                const spotifyId = data.context.spotify_track_id as string;

                // Prevent retriggering every poll
                if (spotifyId !== lastSpotifyId) {
                    console.log('🎵 TRACK phase detected. Starting Spotify track:', spotifyId);

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


            const phase = data.phase as PlaybackPhase;
            playbackPhase.set(phase);

            const playing =
                typeof data.isPlaying === 'boolean'
                    ? data.isPlaying
                    : phase === 'intro' ||
                    phase === 'detail' ||
                    phase === 'artist' ||
                    phase === 'track';

            isPlaying.set(playing);

            // 🔄 Phase transition reset
            if (phase !== lastPhase) {
                lastPhase = phase;
                elapsed.set(0);
                duration.set(0);
                progress.set(0);
                return;
            }

            // ⏱ Timing
            // Backend ALWAYS returns milliseconds: elapsedMs / durationMs
            const elapsedSec = (data.elapsedMs ?? 0) / 1000;
            const durationSec = (data.durationMs ?? 0) / 1000;

            elapsed.set(elapsedSec);
            duration.set(durationSec);

            // 📊 Progress MUST be 0–100 for UI
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

    userStartedPlayback = false;   // 🔁 reset latch

    lastNarrationUrl = null;
    if (narrationAudio) {
        narrationAudio.pause();
        narrationAudio = null;
    }
}

