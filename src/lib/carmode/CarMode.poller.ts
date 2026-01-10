// src/lib/carmode/CarMode.poller.ts

import {
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress
} from '$lib/carmode/CarMode.store';

import type { PlaybackPhase } from '$lib/helpers/car/types';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;

const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

export function startPlaybackPolling() {
    if (pollTimer) return;

    console.log('▶️ Playback polling started');

    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();

            console.log('⏱ Poll data:', data);

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
}
