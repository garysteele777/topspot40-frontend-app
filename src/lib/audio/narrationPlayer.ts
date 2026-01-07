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
