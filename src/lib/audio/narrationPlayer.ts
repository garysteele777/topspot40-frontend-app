import {NARRATION_VOLUME} from '$lib/audio/audioLevels';
import {
    instrumentAudioElement,
    logAudioPlayCall
} from '$lib/audio/audioDebug';

let narrationAudio: HTMLAudioElement | null = null;
let cancelPendingWait: (() => void) | null = null;

export type NarrationTiming = {
	elapsed: number;
	duration: number;
	progress: number;
};

type NarrationTimingListener = (timing: NarrationTiming) => void;
type NarrationPlaybackStartedListener = () => void;

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
		instrumentAudioElement(audio, 'narration', 'created');
        audio.volume = NARRATION_VOLUME;
		audio.preload = 'auto';

		audio.addEventListener('error', () => {
			if (narrationAudio !== audio) return;
			narrationAudio = null;
			if (alternateUrl) void play(alternateUrl).catch(() => undefined);
		}, {once: true});

		try {
			logAudioPlayCall(audio, 'narration', 'called');
			const playPromise = audio.play();
			let pendingTimer: number | null = window.setTimeout(() => {
				pendingTimer = null;
				logAudioPlayCall(audio, 'narration', 'pending');
			}, 1000);
			void playPromise.then(
				() => {
					if (pendingTimer !== null) window.clearTimeout(pendingTimer);
					logAudioPlayCall(audio, 'narration', 'resolved');
				},
				error => {
					if (pendingTimer !== null) window.clearTimeout(pendingTimer);
					logAudioPlayCall(audio, 'narration', 'rejected', error);
				}
			);
			await playPromise;
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
	onPlaybackStarted?: NarrationPlaybackStartedListener
): Promise<'ended' | 'error' | 'cancelled'> {
	stopNarration();

	return new Promise((resolve) => {
		const audio = new Audio(url);
		narrationAudio = audio;
		instrumentAudioElement(audio, 'narration', 'created');
        audio.volume = NARRATION_VOLUME;
		audio.preload = 'auto';
		let settled = false;
		let timingTimer: number | null = null;

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

		const finish = (result: 'ended' | 'error' | 'cancelled') => {
			if (settled) return;
			settled = true;
			if (timingTimer !== null) {
				window.clearInterval(timingTimer);
				timingTimer = null;
			}
			if (result === 'ended') {
				publishTiming(true);
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

		logAudioPlayCall(audio, 'narration', 'called');
		const playPromise = audio.play();
		let pendingTimer: number | null = window.setTimeout(() => {
			pendingTimer = null;
			logAudioPlayCall(audio, 'narration', 'pending');
		}, 1000);

		void playPromise
			.then(() => {
				if (pendingTimer !== null) window.clearTimeout(pendingTimer);
				logAudioPlayCall(audio, 'narration', 'resolved');
				onPlaybackStarted?.();
				publishTiming();
				timingTimer = window.setInterval(publishTiming, 100);
			})
			.catch(error => {
				if (pendingTimer !== null) window.clearTimeout(pendingTimer);
				logAudioPlayCall(audio, 'narration', 'rejected', error);
				finish('error');
			});
	});
}

export async function playNarrationUrlAndWait(
	url: string,
	fallbackUrl?: string,
	onTiming?: NarrationTimingListener,
	onPlaybackStarted?: NarrationPlaybackStartedListener
): Promise<void> {
	const result = await playNarrationUrlOnceAndWait(url, onTiming, onPlaybackStarted);
	if (result === 'error' && fallbackUrl) {
		await playNarrationUrlOnceAndWait(fallbackUrl, onTiming, onPlaybackStarted);
	}
}
