let bedAudio: HTMLAudioElement | null = null;
let currentBedUrl: string | null = null;
const SILENT_AUDIO_DATA_URI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

export function isBedPlaying(): boolean {
    return bedAudio !== null && !bedAudio.paused;
}

export async function unlockBedAudio(): Promise<void> {
    if (!bedAudio) {
        bedAudio = new Audio();
    }

    try {
        bedAudio.muted = true;
        bedAudio.setAttribute('playsinline', '');
        bedAudio.src = SILENT_AUDIO_DATA_URI;
        await bedAudio.play();
        bedAudio.pause();
        bedAudio.currentTime = 0;
        bedAudio.muted = false;
        currentBedUrl = null;
    } catch (err) {
        console.warn('Bed audio unlock failed:', err);
    }
}

export async function startBedUrl(url: string): Promise<void> {
    if (bedAudio && currentBedUrl === url && !bedAudio.paused) {
        return;
    }

    if (bedAudio && currentBedUrl && currentBedUrl !== url) {
        stopBed(); // fade out old one
        bedAudio = null;
    }

    currentBedUrl = url;
    bedAudio = bedAudio ?? new Audio();
    bedAudio.src = url;
    bedAudio.loop = true;
    bedAudio.volume = 0;           // start silent
    bedAudio.preload = 'auto';
    bedAudio.setAttribute('playsinline', '');

    await bedAudio.play();

    // 🎧 Fade in
    const targetVolume = 0.065;
    const step = 0.02;

    const fadeIn = setInterval(() => {
        if (!bedAudio) return clearInterval(fadeIn);

        if (bedAudio.volume < targetVolume) {
            bedAudio.volume = Math.min(targetVolume, bedAudio.volume + step);


        } else {
            clearInterval(fadeIn);
        }
    }, 100);
}

export function stopBed(): void {
    if (!bedAudio) return;

    const audioRef = bedAudio; // capture reference
    const step = 0.02;

    const fadeOut = setInterval(() => {
        if (!audioRef) return clearInterval(fadeOut);

        if (audioRef.volume > 0.02) {
            audioRef.volume = Math.max(0, audioRef.volume - step);
        } else {
            clearInterval(fadeOut);

            audioRef.pause();
            audioRef.currentTime = 0;
            audioRef.src = '';

            if (bedAudio === audioRef) {
                bedAudio = null;
                currentBedUrl = null;
            }
        }
    }, 100);
}
