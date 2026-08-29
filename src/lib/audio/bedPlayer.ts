import {BED_VOLUME} from '$lib/audio/audioLevels';

let bedAudio: HTMLAudioElement | null = null;
let currentBedUrl: string | null = null;
let bedStartInFlight = false;
let bedFadeTargetReached = false;
let bedAudioContext: AudioContext | null = null;
let bedGainNode: GainNode | null = null;
let bedMediaSource: MediaElementAudioSourceNode | null = null;
let bedMediaSourceAudio: HTMLAudioElement | null = null;
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const BED_PLAY_TIMEOUT_MS = 3000;
const BED_PLAY_TIMEOUT_MESSAGE = 'bed audio play() timeout';
const SILENT_AUDIO_DATA_URI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

type BedDiagnosticState = {
    muted?: boolean;
    paused?: boolean;
    volumeBucket?: string;
    currentTimeBucket?: string;
    durationBucket?: string;
    readyState?: number;
    networkState?: number;
    srcCategory?: string;
    targetVolumeReached?: boolean;
};

function bucketNumber(value: number | undefined, buckets: Array<[number, string]>, fallback: string): string {
    if (value == null || Number.isNaN(value)) return fallback;
    if (!Number.isFinite(value)) return 'infinite';

    for (const [limit, label] of buckets) {
        if (value <= limit) return label;
    }

    return 'large';
}

function volumeBucket(value: number | undefined): string {
    return bucketNumber(
        value,
        [
            [0, '0'],
            [0.02, '0-0.02'],
            [0.08, '0.02-0.08'],
            [0.18, '0.08-0.18']
        ],
        'unknown'
    );
}

function secondsBucket(value: number | undefined): string {
    return bucketNumber(
        value,
        [
            [0, '0'],
            [1, '0-1s'],
            [5, '1-5s'],
            [15, '5-15s'],
            [60, '15-60s']
        ],
        'unknown'
    );
}

function srcCategory(src: string | undefined): string {
    if (!src) return 'empty';
    if (src === SILENT_AUDIO_DATA_URI || src.startsWith('data:audio/')) return 'silent-data-uri';
    if (src.includes('/bed-tracks/')) return 'bed-url';
    return 'other';
}

function audioState(audio: HTMLAudioElement | null): BedDiagnosticState {
    return {
        muted: audio?.muted,
        paused: audio?.paused,
        volumeBucket: volumeBucket(audio?.volume),
        currentTimeBucket: secondsBucket(audio?.currentTime),
        durationBucket: secondsBucket(audio?.duration),
        readyState: audio?.readyState,
        networkState: audio?.networkState,
        srcCategory: srcCategory(audio?.src),
        targetVolumeReached: bedFadeTargetReached
    };
}

function sendBedDiagnostic(event: string, state?: BedDiagnosticState): void {
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
            genre: null,
            bedAudioState: state
        })
    }).catch(() => {
        // Temporary diagnostic only; never affect playback.
    });
}

/**
 * The iOS media element ignores volume for some remote audio streams. Keep the
 * element at full volume when it is routed through Web Audio and control its
 * level exclusively with this gain node instead.
 */
function usesWebAudioGain(audio: HTMLAudioElement): boolean {
    return bedGainNode !== null && bedMediaSourceAudio === audio;
}

function setBedLevel(audio: HTMLAudioElement, level: number): void {
    if (usesWebAudioGain(audio)) {
        audio.volume = 1;
        bedGainNode!.gain.value = level;
        return;
    }

    audio.volume = level;
}

function bedLevel(audio: HTMLAudioElement): number {
    return usesWebAudioGain(audio) ? bedGainNode!.gain.value : audio.volume;
}

function disconnectBedAudioSource(audio: HTMLAudioElement): void {
    if (bedMediaSourceAudio !== audio) return;

    bedMediaSource?.disconnect();
    bedMediaSource = null;
    bedMediaSourceAudio = null;
}

function connectBedAudioSource(audio: HTMLAudioElement): void {
    if (!bedAudioContext || !bedGainNode || bedMediaSourceAudio === audio) return;

    // One MediaElementSourceNode may be created for an element. Replacement
    // elements get their own node, while the prior node is detached first.
    if (bedMediaSourceAudio) {
        disconnectBedAudioSource(bedMediaSourceAudio);
    }

    try {
        bedMediaSource = bedAudioContext.createMediaElementSource(audio);
        bedMediaSource.connect(bedGainNode);
        bedMediaSourceAudio = audio;
        audio.volume = 1;
    } catch (err) {
        // Safari/Web Audio is optional: retain HTMLMediaElement.volume as the
        // working fallback if a graph cannot be created for this element.
        console.warn('Bed Web Audio connection failed; using element volume:', err);
        bedMediaSource = null;
        bedMediaSourceAudio = null;
    }
}

export function isBedPlaying(): boolean {
    return currentBedUrl !== null && bedAudio !== null && !bedAudio.paused;
}

async function playWithTimeout(audio: HTMLAudioElement): Promise<void> {
    const playPromise = audio.play();
    void playPromise.catch(() => {
        // The awaited race handles the failure path; prevent a late rejection from surfacing separately.
    });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
        await Promise.race([
            playPromise,
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error(BED_PLAY_TIMEOUT_MESSAGE)),
                    BED_PLAY_TIMEOUT_MS
                );
            })
        ]);
    } finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
    }
}

export async function unlockBedAudio(): Promise<void> {
    if (!bedAudio) {
        bedAudio = new Audio();
    }

    try {
        if (!bedAudioContext) {
            const AudioContextConstructor = window.AudioContext;
            if (AudioContextConstructor) {
                bedAudioContext = new AudioContextConstructor();
                bedGainNode = bedAudioContext.createGain();
                bedGainNode.gain.value = 0;
                bedGainNode.connect(bedAudioContext.destination);
            }
        }

        if (bedAudioContext?.state !== 'running') {
            await bedAudioContext?.resume();
        }

        connectBedAudioSource(bedAudio);
        bedAudio.muted = true;
        bedAudio.setAttribute('playsinline', '');
        bedAudio.crossOrigin = 'anonymous';
        bedAudio.src = SILENT_AUDIO_DATA_URI;
        await bedAudio.play();
        bedAudio.pause();
        bedAudio.currentTime = 0;
        bedAudio.muted = false;
        currentBedUrl = null;
    } catch (err) {
        sendBedDiagnostic('bed unlock failed', audioState(bedAudio));
        console.warn('Bed audio unlock failed:', err);
    } finally {
        sendBedDiagnostic('bed unlock final state', audioState(bedAudio));
    }
}

export async function startBedUrl(url: string): Promise<void> {
    if (bedStartInFlight && currentBedUrl === url) {
        return;
    }

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
        disconnectBedAudioSource(bedAudio);
        bedAudio = null;
        currentBedUrl = null;
    }

    console.info('[bedPlayer] currentBedUrl set', {
        from: currentBedUrl,
        to: url
    });
    sendBedDiagnostic('bed start pre-src state', audioState(bedAudio));
    currentBedUrl = url;
    bedAudio = bedAudio ?? new Audio();
    bedAudio.muted = false;
    // Supabase bed URLs need CORS permission before src is set in order to be
    // usable by createMediaElementSource on iOS and other Web Audio browsers.
    bedAudio.crossOrigin = 'anonymous';
    bedAudio.src = url;
    bedAudio.loop = true;
    connectBedAudioSource(bedAudio);
    setBedLevel(bedAudio, 0);      // start silent
    bedAudio.preload = 'auto';
    bedAudio.setAttribute('playsinline', '');
    bedFadeTargetReached = false;

    bedAudio.onloadedmetadata = () => {
        sendBedDiagnostic('bed loadedmetadata', audioState(bedAudio));
    };

    bedAudio.oncanplay = () => {
        sendBedDiagnostic('bed canplay', audioState(bedAudio));
    };

    bedAudio.onplaying = () => {
        sendBedDiagnostic('bed playing', audioState(bedAudio));
    };

    sendBedDiagnostic('bed start pre-play state', audioState(bedAudio));

    try {
        bedStartInFlight = true;
        await playWithTimeout(bedAudio);
        sendBedDiagnostic('bed play succeeded');
        sendBedDiagnostic('bed play succeeded state', audioState(bedAudio));
        console.info('[bedPlayer] bed audio play() succeeded', {
            url,
            volume: bedAudio.volume
        });
    } catch (err) {
        const didTimeout =
            err instanceof Error &&
            err.message === BED_PLAY_TIMEOUT_MESSAGE;

        const wasAborted =
            err instanceof DOMException &&
            err.name === 'AbortError';

        sendBedDiagnostic(
            didTimeout
                ? 'bed play timeout'
                : wasAborted
                    ? 'bed play aborted'
                    : 'bed play failed'
        );

        console.warn(
            didTimeout
                ? '[bedPlayer] bed audio play() timed out'
                : wasAborted
                    ? '[bedPlayer] bed audio play() was interrupted'
                    : '[bedPlayer] bed audio play() failed',
            {
                url,
                err
            }
        );

        if (!didTimeout && !wasAborted) {
            throw err;
        }

        console.warn(
            '[bedPlayer] continuing without bed audio'
        );
    } finally {
        bedStartInFlight = false;
    }

    // 🎧 Fade in
    const targetVolume = BED_VOLUME;
    const step = 0.02;
    let fadeAudibleSent = false;

    const audioRef = bedAudio;
    const fadeIn = setInterval(() => {
        if (bedAudio !== audioRef) return clearInterval(fadeIn);

        if (bedLevel(audioRef) < targetVolume) {
            setBedLevel(audioRef, Math.min(targetVolume, bedLevel(audioRef) + step));

            if (!fadeAudibleSent && bedLevel(audioRef) > 0) {
                fadeAudibleSent = true;
                sendBedDiagnostic('bed fade audible', audioState(audioRef));
            }
        } else {
            if (!bedFadeTargetReached) {
                bedFadeTargetReached = true;
                sendBedDiagnostic('bed fade target reached', audioState(audioRef));
            }
            clearInterval(fadeIn);
        }
    }, 100);
}

export function stopBed(): void {
    sendBedDiagnostic('bed stop called');
    sendBedDiagnostic('bed stop state', audioState(bedAudio));
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

        if (bedLevel(audioRef) > 0.02) {
            setBedLevel(audioRef, Math.max(0, bedLevel(audioRef) - step));
        } else {
            clearInterval(fadeOut);

            audioRef.pause();
            audioRef.currentTime = 0;
            audioRef.src = '';
            disconnectBedAudioSource(audioRef);

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
