import {NARRATION_VOLUME} from '$lib/audio/audioLevels';

let narrationAudio: HTMLAudioElement | null = null;
let cancelPendingWait: (() => void) | null = null;

export type NarrationTiming = {
	elapsed: number;
	duration: number;
	progress: number;
};

type NarrationTimingListener = (timing: NarrationTiming) => void;
export type NarrationPlaybackResult = 'ended' | 'error' | 'cancelled';
export type NarrationStartedListener = () => void;

// iOS can leave a media play promise pending after returning from another app.
// A pending promise must not leave Guided Playback showing a false "Pause" state.
export const NARRATION_PLAY_TIMEOUT_MS = 3000;

export function stopNarration(): void {
	const audio = narrationAudio;

	cancelPendingWait?.();
	cancelPendingWait = null;

	if (audio) {
		narrationAudio = null;
		audio.pause();
		audio.currentTime = 0;
		audio.src = '';
	}
}

export async function playNarrationUrl(url: string, fallbackUrl?: string): Promise<void> {
	stopNarration();

	const play = async (audioUrl: string, alternateUrl?: string): Promise<void> => {
		const audio = new Audio(audioUrl);
		narrationAudio = audio;
        audio.volume = NARRATION_VOLUME;
		audio.preload = 'auto';

		audio.addEventListener('error', () => {
			if (narrationAudio !== audio) return;
			narrationAudio = null;
			if (alternateUrl) void play(alternateUrl).catch(() => undefined);
		}, {once: true});

		try {
			await audio.play();
		} catch (error) {
			if (narrationAudio !== audio) return;
			narrationAudio = null;
			if (alternateUrl) {
				await play(alternateUrl);
				return;
			}
			throw error;
		}
	};

	await play(url, fallbackUrl);
}

function playNarrationUrlOnceAndWait(
	url: string,
	onTiming?: NarrationTimingListener,
	onStarted?: NarrationStartedListener,
	playTimeoutMs = NARRATION_PLAY_TIMEOUT_MS
): Promise<NarrationPlaybackResult> {
	stopNarration();

	return new Promise((resolve) => {
		const audio = new Audio(url);
		narrationAudio = audio;
        audio.volume = NARRATION_VOLUME;
		audio.preload = 'auto';
		let settled = false;
		let timingTimer: number | null = null;
		let playTimeout: number | null = null;

		const publishTiming = (complete = false) => {
			const audioDuration =
				Number.isFinite(audio.duration) && audio.duration > 0
					? audio.duration
					: 0;
			const audioElapsed =
				complete && audioDuration > 0
					? audioDuration
					: Math.max(0, audio.currentTime || 0);

			onTiming?.({
				elapsed: audioElapsed,
				duration: audioDuration,
				progress:
					audioDuration > 0
						? Math.min(100, (audioElapsed / audioDuration) * 100)
						: 0
			});
		};

		onTiming?.({elapsed: 0, duration: 0, progress: 0});

		const finish = (result: NarrationPlaybackResult) => {
			if (settled) return;
			settled = true;
			if (playTimeout !== null) {
				window.clearTimeout(playTimeout);
				playTimeout = null;
			}
			if (timingTimer !== null) {
				window.clearInterval(timingTimer);
				timingTimer = null;
			}
			if (result === 'ended') {
				publishTiming(true);
			} else {
				// Prevent a late iOS play resolution from starting audio after the
				// coordinator has already rolled the UI back to Guided.
				audio.pause();
				audio.currentTime = 0;
			}
			if (narrationAudio === audio) {
				narrationAudio = null;
			}
			if (cancelPendingWait === cancel) {
				cancelPendingWait = null;
			}
			resolve(result);
		};

		const cancel = () => finish('cancelled');
		cancelPendingWait = cancel;

		audio.addEventListener('loadedmetadata', () => publishTiming(), {once: true});
		audio.addEventListener('durationchange', () => publishTiming());
		audio.addEventListener('timeupdate', () => publishTiming());
		audio.addEventListener('ended', () => finish('ended'), {once: true});
		audio.addEventListener('error', () => finish('error'), {once: true});

		void audio.play()
			.then(() => {
				if (settled) {
					audio.pause();
					return;
				}
				if (playTimeout !== null) {
					window.clearTimeout(playTimeout);
					playTimeout = null;
				}
				onStarted?.();
				publishTiming();
				timingTimer = window.setInterval(publishTiming, 100);
			})
			.catch(() => finish('error'));

		playTimeout = window.setTimeout(() => finish('error'), playTimeoutMs);
	});
}

export async function playNarrationUrlAndWait(
	url: string,
	fallbackUrl?: string,
	onTiming?: NarrationTimingListener,
	onStarted?: NarrationStartedListener,
	playTimeoutMs = NARRATION_PLAY_TIMEOUT_MS
): Promise<NarrationPlaybackResult> {
	const result = await playNarrationUrlOnceAndWait(
		url,
		onTiming,
		onStarted,
		playTimeoutMs
	);
	if (result === 'error' && fallbackUrl) {
		return playNarrationUrlOnceAndWait(
			fallbackUrl,
			onTiming,
			onStarted,
			playTimeoutMs
		);
	}
	return result;
}
