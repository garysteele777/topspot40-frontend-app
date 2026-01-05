import {
	isPlaying,
	playbackPhase,
	elapsed,
	duration,
	progress
} from '$lib/carmode/CarMode.store';

let pollTimer: number | null = null;

// 🔒 Phase tracking + settle guard
let lastPhase: string | null = null;
let waitingForPhaseReset = false;

export function startPlaybackPolling() {
	if (pollTimer) return;

	pollTimer = window.setInterval(async () => {
		try {
			const res = await fetch('http://127.0.0.1:8000/playback/status');
			if (!res.ok) return;

			const data = await res.json();

			/*
				Backend contract (source of truth):
				- phase: 'idle' | 'loading' | 'intro' | 'detail' | 'artist' | 'track' | 'done'
				- elapsed_ms: number
				- duration_ms: number
			*/

			const phase = data.phase ?? 'idle';

			// 🔹 Playback active for any non-idle, non-done phase
			isPlaying.set(phase !== 'idle' && phase !== 'done');

			// 🔹 Phase label
			playbackPhase.set(phase);

			// 🧼 Detect phase change → reset UI and wait for backend to reset timing
			if (phase !== lastPhase) {
				lastPhase = phase;
				waitingForPhaseReset = true;

				elapsed.set(0);
				duration.set(0);
				progress.set(0);
				return;
			}

			// 🧼 Keep UI calm during loading
			if (phase === 'loading') {
				elapsed.set(0);
				duration.set(0);
				progress.set(0);
				return;
			}

			// 🔹 Time values (ms → seconds)
			const elapsedMs = Number(data.elapsed_ms ?? data.elapsedMs ?? 0);
			const durationMs = Number(data.duration_ms ?? data.durationMs ?? 0);

			// ⏳ Wait until backend timing has actually reset
			if (waitingForPhaseReset) {
				if (elapsedMs > 0) {
					waitingForPhaseReset = false;
				} else {
					elapsed.set(0);
					duration.set(0);
					progress.set(0);
					return;
				}
			}

			const elapsedSec = elapsedMs / 1000;
			const durationSec = durationMs > 0 ? durationMs / 1000 : 0;

			elapsed.set(elapsedSec);
			duration.set(durationSec);

			// 🔹 Progress computed locally (0 → 100)
			const pct =
				durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0;

			progress.set(Math.min(100, Math.max(0, pct)));

			// 🔹 Stop polling when backend declares stop
			if (data.stopped || phase === 'done') {
				stopPlaybackPolling();
			}

			// 🧪 Optional debug
			console.log(
				`POLL ${phase} ${elapsedSec.toFixed(1)}s / ${durationSec.toFixed(1)}s → ${Math.round(pct)}%`
			);

		} catch (err) {
			console.error('Playback polling failed:', err);
		}
	}, 500);
}

export function stopPlaybackPolling() {
	if (pollTimer) {
		clearInterval(pollTimer);
		pollTimer = null;
		lastPhase = null;
		waitingForPhaseReset = false;
	}
}
