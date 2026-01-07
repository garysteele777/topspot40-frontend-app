import {get} from 'svelte/store';
import {
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress
} from '$lib/carmode/CarMode.store';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

let pollTimer: number | null = null;

// 🔒 Phase tracking + settle guard
let lastPhase: string | null = null;
let waitingForPhaseReset = false;

const POLL_INTERVAL_MS = Number(import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500);


export function startPlaybackPolling() {
    if (pollTimer) return;

    pollTimer = window.setInterval(async () => {
        try {

            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();

            const phase = data.phase ?? 'idle';

            // 🔹 Stop early if idle
            if (phase === 'idle') {
                stopPlaybackPolling();
                return;
            }

            isPlaying.set(phase !== 'idle' && phase !== 'done');
            playbackPhase.set(phase);

            // 🔄 Phase transition handling
            if (phase !== lastPhase) {
                lastPhase = phase;
                waitingForPhaseReset = true;

                elapsed.set(0);
                duration.set(0);
                progress.set(0);

                // 🔍 Log transitions only
                console.debug(`▶ Phase → ${phase}`);
                return;
            }

            if (phase === 'loading') return;

            const elapsedMs = Number(data.elapsedMs ?? 0);
            const durationMs = Number(data.durationMs ?? 0);


            if (waitingForPhaseReset) {
                if (elapsedMs > 0) {
                    waitingForPhaseReset = false;
                } else {
                    return;
                }
            }

            const elapsedSec = elapsedMs / 1000;
            const durationSec = durationMs / 1000;

            elapsed.set(elapsedSec);
            duration.set(durationSec);

            const pct =
                durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0;

            progress.set(Math.min(100, Math.max(0, pct)));

            if (data.stopped || phase === 'done') {
                console.debug('⏹ Playback complete');
                stopPlaybackPolling();
            }
        } catch {
            // Silent by design
        }
    }, POLL_INTERVAL_MS);
}

export function stopPlaybackPolling() {
    if (!pollTimer) return;

    clearInterval(pollTimer);
    pollTimer = null;

    lastPhase = null;
    waitingForPhaseReset = false;
}
