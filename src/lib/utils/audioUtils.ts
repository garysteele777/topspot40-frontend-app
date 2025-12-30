// Simple singleton to track/stop all <audio> elements we create.

const activeAudios: HTMLAudioElement[] = [];

/** Play a URL and make sure nothing else is playing. */
export function playAudio(url: string): HTMLAudioElement {
  stopAllAudio();

  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.crossOrigin = 'anonymous';

  // Start and track it
  audio.play().catch((err) => console.error('Audio play failed:', err));
  activeAudios.push(audio);
  return audio;
}

/** Register an externally created <audio> so it’s cleaned up too. */
export function registerAudio(el: HTMLAudioElement): void {
  if (!activeAudios.includes(el)) activeAudios.push(el);
}

/** Pause + rewind everything and clear the registry. */
export function stopAllAudio(): void {
  for (const a of activeAudios) {
    try {
      a.pause();
      a.currentTime = 0;
      // detach sources to encourage GC
      a.src = '';
      a.load?.();
    } catch (err) {
      console.warn('Audio cleanup issue:', err);
    }
  }
  activeAudios.length = 0;
}

/** Optional: soft stop */
export async function fadeOutAllAudio(ms: number = 300): Promise<void> {
  const step = 50;
  const steps = Math.max(1, Math.floor(ms / step));
  for (let i = 0; i < steps; i++) {
    for (const a of activeAudios) {
      a.volume = Math.max(0, a.volume - 1 / steps);
    }
    await new Promise((r) => setTimeout(r, step));
  }
  stopAllAudio();
}
