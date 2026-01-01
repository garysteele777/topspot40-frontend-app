import { isPlaying, playbackPhase, elapsed, duration, progress } from '$lib/carmode/CarMode.store';

let pollTimer: number | null = null;

export function startPlaybackPolling() {
	if (pollTimer) return;

	pollTimer = window.setInterval(async () => {
		try {
			const res = await fetch('http://127.0.0.1:8000/playback/status');
			if (!res.ok) return;

			const data = await res.json();

			/*
				Backend contract (source of truth):
				- current_phase: 'idle' | 'intro' | 'detail' | 'artist' | 'track' | 'done'
				- elapsed_seconds: number
				- duration_seconds: number
				- percent_complete: 0.0 → 1.0
			*/

			// 🔹 Playback is active for ANY non-idle, non-done phase
			isPlaying.set(data.phase !== 'idle' && data.phase !== 'track_finished');

			// 🔹 Current phase label
			playbackPhase.set(data.phase ?? 'idle');

			// 🔹 Time values (milliseconds → seconds)
			elapsed.set(Math.floor((data.elapsedMs ?? 0) / 1000));
			duration.set(Math.floor((data.durationMs ?? 0) / 1000));

			// 🔹 Progress stays normalized (0.0 → 1.0)
			progress.set(data.percentComplete ?? 0);

			// 🔹 Stop polling when backend declares stop
			if (data.stopped) {
				stopPlaybackPolling();
			}

			// 🧪 Optional debug (safe to remove later)
			console.log(
				'POLL',
				data.phase,
				data.elapsedMs,
				'/',
				data.durationMs,
				'→',
				Math.round((data.percentComplete ?? 0) * 100) + '%'
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
	}
}
