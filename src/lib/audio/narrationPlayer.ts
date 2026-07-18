let narrationAudio: HTMLAudioElement | null = null;

export function stopNarration(): void {
	if (narrationAudio) {
		narrationAudio.pause();
		narrationAudio.currentTime = 0;
		narrationAudio.src = '';
		narrationAudio = null;
	}
}

export async function playNarrationUrl(url: string): Promise<void> {
	stopNarration();
	narrationAudio = new Audio(url);
	narrationAudio.preload = 'auto';

	await narrationAudio.play();
}

export function playNarrationUrlAndWait(url: string): Promise<void> {
	stopNarration();

	return new Promise((resolve) => {
		const audio = new Audio(url);
		narrationAudio = audio;
		audio.preload = 'auto';

		const finish = () => {
			if (narrationAudio === audio) {
				narrationAudio = null;
			}
			resolve();
		};

		audio.addEventListener('ended', finish, {once: true});
		audio.addEventListener('error', finish, {once: true});

		void audio.play().catch(finish);
	});
}
