let bedAudio: HTMLAudioElement | null = null;
let currentBedUrl: string | null = null;
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const SILENT_AUDIO_DATA_URI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

function sendBedDiagnostic(event: string): void {
    void fetch(`${API_BASE}/playback/client-diagnostic`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            event,
            phase: null,
            mode: null,
            programType: null,
            hasCurrentTrack: false,
            trackRank: null,
            decade: null,
            genre: null
        })
    }).catch(() => {
        // Temporary diagnostic only; never affect playback.
    });
}

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
    sendBedDiagnostic('bed start called');
    console.info('[bedPlayer] startBedUrl called', {
        url,
        currentBedUrl,
        hasBedAudio: Boolean(bedAudio),
        isPaused: bedAudio?.paused
    });

    if (bedAudio && currentBedUrl === url && !bedAudio.paused) {
        return;
    }

    if (bedAudio && currentBedUrl && currentBedUrl !== url) {
        console.info('[bedPlayer] currentBedUrl changing', {
            from: currentBedUrl,
            to: url
        });
        bedAudio.pause();
        bedAudio.currentTime = 0;
        bedAudio.src = '';
        bedAudio = null;
        currentBedUrl = null;
    }

    console.info('[bedPlayer] currentBedUrl set', {
        from: currentBedUrl,
        to: url
    });
    currentBedUrl = url;
    bedAudio = bedAudio ?? new Audio();
    bedAudio.src = url;
    bedAudio.loop = true;
    bedAudio.volume = 0;           // start silent
    bedAudio.preload = 'auto';
    bedAudio.setAttribute('playsinline', '');

    try {
        await bedAudio.play();
        sendBedDiagnostic('bed play succeeded');
        console.info('[bedPlayer] bed audio play() succeeded', {
            url,
            volume: bedAudio.volume
        });
    } catch (err) {
        sendBedDiagnostic('bed play failed');
        console.warn('[bedPlayer] bed audio play() failed', {
            url,
            err
        });
        throw err;
    }

    // 🎧 Fade in
    const targetVolume = 0.18;
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
    sendBedDiagnostic('bed stop called');
    console.info('[bedPlayer] stopBed called', {
        currentBedUrl,
        hasBedAudio: Boolean(bedAudio),
        isPaused: bedAudio?.paused,
        volume: bedAudio?.volume
    });

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
                console.info('[bedPlayer] currentBedUrl cleared', {
                    from: currentBedUrl
                });
                currentBedUrl = null;
            }
        }
    }, 100);
}
