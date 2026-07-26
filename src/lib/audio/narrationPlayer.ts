let narrationAudio: HTMLAudioElement | null = null;
let cancelPendingWait: (() => void) | null = null;

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

function playNarrationUrlOnceAndWait(url: string): Promise<'ended' | 'error' | 'cancelled'> {
	stopNarration();

	return new Promise((resolve) => {
		const audio = new Audio(url);
		narrationAudio = audio;
		audio.preload = 'auto';
		let settled = false;

		const finish = (result: 'ended' | 'error' | 'cancelled') => {
			if (settled) return;
			settled = true;
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

		audio.addEventListener('ended', () => finish('ended'), {once: true});
		audio.addEventListener('error', () => finish('error'), {once: true});

		void audio.play().catch(() => finish('error'));
	});
}

export async function playNarrationUrlAndWait(
	url: string,
	fallbackUrl?: string
): Promise<void> {
	const result = await playNarrationUrlOnceAndWait(url);
	if (result === 'error' && fallbackUrl) {
		await playNarrationUrlOnceAndWait(fallbackUrl);
	}
}
