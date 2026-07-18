// src/lib/carmode/CarMode.poller.ts

import {browser} from '$app/environment';
import {get} from 'svelte/store';

import type {PlaybackPhase} from '$lib/helpers/car/types';
import {resetPlaybackProgress} from '$lib/utils/resetPlaybackState';
import {cleanupNarrationAudio} from '$lib/audio/narrationAudioCleanup';
import {
    fetchPlaybackStatus,
    signalNarrationFinishedApi,
    playSpotifyTrackApi,
    signalTrackFinishedApi,
    stopPlaybackApi,
    fetchSpotifyDevices,
    transferSpotifyPlayback
} from '$lib/api/playbackApi';


import {markCurrentTrackPlayed} from '$lib/carmode/programTracker';
import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
import {startBedUrl, stopBed, isBedPlaying, unlockBedAudio} from '$lib/audio/bedPlayer';
import {calculatePlaybackTiming} from '$lib/utils/calculatePlaybackTiming';
import {isWithinTrackSwitchProtectionWindow} from '$lib/utils/playbackSwitchTiming';
import {
    buildNarrationQueue,
    type NarrationQueueItem
} from '$lib/utils/buildNarrationQueue';

import {
    normalizePlaybackContext,
    playbackContextHasFreshText
} from '$lib/utils/normalizePlaybackContext';
import {
    buildFallbackPlaybackTrack,
    buildEnrichedPlaybackTrack
} from '$lib/utils/buildPlaybackTrack';
import {
    hasPlaybackStarted,
    isNarrationPhase,
    isPhasePlaying
} from '$lib/utils/playbackPhaseHelpers';

import {
    timingSource,
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress,
    currentRank,
    currentTrack,
    tracks,
    currentSelection
} from '$lib/carmode/CarMode.store';

const DEBUG =
    browser && localStorage.getItem('ts-debug') === '1';

const dlog = (...args: unknown[]) => {
    if (DEBUG) console.log(...args);
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

function sendClientDiagnostic(
    event: string,
    phase: PlaybackPhase | null | undefined,
    narrationAudioState?: NarrationAudioDiagnosticState
): void {
    void fetch(`${API_BASE}/playback/client-diagnostic`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            event,
            phase,
            mode: null,
            programType: null,
            hasCurrentTrack: Boolean(get(currentTrack)),
            trackRank: null,
            decade: null,
            genre: null,
            narrationAudioState
        })
    }).catch(() => {
        // Temporary diagnostic only; never affect playback.
    });
}

type NarrationAudioDiagnosticState = {
    muted?: boolean;
    paused?: boolean;
    volumeBucket?: string;
    currentTimeBucket?: string;
    durationBucket?: string;
    readyState?: number;
    networkState?: number;
    srcCategory?: string;
    errorCode?: number | null;
    playbackSessionIdPresent?: boolean;
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
            [0.1, '0-0.1'],
            [0.3, '0.1-0.3'],
            [0.6, '0.3-0.6'],
            [1, '0.6-1']
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

function narrationSrcCategory(src: string | undefined): string {
    if (!src) return 'empty';
    if (src.startsWith('data:')) return 'other';
    if (src.endsWith('.mp3') || src.includes('/audio-') || src.includes('/narration')) return 'narration-url';
    return 'other';
}

function narrationAudioState(
    audio: HTMLAudioElement | null,
    playbackSessionIdPresent: boolean
): NarrationAudioDiagnosticState {
    return {
        muted: audio?.muted,
        paused: audio?.paused,
        volumeBucket: volumeBucket(audio?.volume),
        currentTimeBucket: secondsBucket(audio?.currentTime),
        durationBucket: secondsBucket(audio?.duration),
        readyState: audio?.readyState,
        networkState: audio?.networkState,
        srcCategory: narrationSrcCategory(audio?.src),
        errorCode: audio?.error?.code ?? null,
        playbackSessionIdPresent
    };
}

const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

const SPOTIFY_START_RETRY_THROTTLE_MS = 3000;

const SILENT_AUDIO_DATA_URI =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=';

type QueuedNarrationItem = NarrationQueueItem & {
    key: string;
    playbackSessionId: string;
};

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;

let lastSpotifyId: string | null = null;
let spotifyStartLock = false;
let finishedTrackId: string | null = null;
let failedSpotifyStartTrackId: string | null = null;
let lastSpotifyStartRetryAt = 0;
let spotifyStartAttemptGeneration = 0;
let syncedUiSpotifyTrackId: string | null = null;

let narrationLock = false;

let narrationQueue: QueuedNarrationItem[] = [];

let lastNarrationPhase: PlaybackPhase | null = null;
let lastNarrationKey: string | null = null;
let lastNarrationIntakeKey: string | null = null;
let activeNarrationKey: string | null = null;
let queuedNarrationKeys = new Set<string>();
let completedNarrationKeys = new Set<string>();
let lastStartedBedUrl: string | null = null;
let trackFinalized = false;
let narrationSignaled = false;

let activeSpotifyTrackId: string | null = null;
let trackSwitchTime = 0;

let activeNarrationAudio: HTMLAudioElement | null = null;
let activeNarrationTimer: number | null = null;
let activeNarrationResolve: (() => void) | null = null;
let activeNarrationPlaybackSessionIdPresent = false;
let narrationInterrupting = false;

let narrationPausedAtBoundary = false;

export function stopCurrentNarrationPhase(
    options: { resolvePhase?: boolean; preserveResolve?: boolean; preserveAudioElement?: boolean } = {}
): void {
    if (options.preserveResolve) {
        narrationPausedAtBoundary = true;
    }

    const preservedResolve = options.preserveResolve
        ? activeNarrationResolve
        : null;

    if (activeNarrationAudio) {
        sendClientDiagnostic(
            'narration stop/cancel state',
            get(playbackPhase),
            narrationAudioState(activeNarrationAudio, activeNarrationPlaybackSessionIdPresent)
        );
        narrationInterrupting = true;
        activeNarrationAudio.pause();
        activeNarrationAudio.currentTime = 0;
        if (!options.preserveAudioElement) {
            activeNarrationAudio.src = '';
            activeNarrationAudio.load();
        }
    }
    cleanupNarrationAudio({
        timer: activeNarrationTimer,
        setTimer: value => {
            activeNarrationTimer = value;
        },
        setAudio: value => {
            activeNarrationAudio = value;
        },
        setResolve: value => {
            activeNarrationResolve = value;
        },
        preserveAudio: options.preserveAudioElement
    });

    if (options.preserveResolve) {
        activeNarrationResolve = preservedResolve;
        return;
    }

    if (options.resolvePhase !== false && activeNarrationResolve) {
        const resolve = activeNarrationResolve;
        activeNarrationResolve = null;
        resolve();
    } else {
        activeNarrationResolve = null;
    }

    if (options.resolvePhase === false && !options.preserveResolve) {
        narrationLock = false;
    }
}

function isSingleMode(): boolean {
    const sel = get(currentSelection);

    return (
        sel?.mode === 'decade_genre' &&
        sel?.categoryMode === 'single'
    );
}

function finalizeTrackUI(): void {
    isPlaying.set(false);

    const d = Number(get(duration) ?? 0);

    if (d > 0) {
        elapsed.set(d);
        progress.set(100);
    } else {
        progress.set(0);
    }
}

function playOneAudio(
    url: string,
    phase: 'set_intro' | 'collection_intro' | 'liner' | 'intro' | 'detail' | 'artist',
    playbackSessionIdPresent = false
): Promise<void> {
    if (!browser) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
        stopCurrentNarrationPhase({
            resolvePhase: false,
            preserveAudioElement: true
        });

        const reusedAudio = Boolean(activeNarrationAudio);
        const audio = activeNarrationAudio ?? new Audio();
        activeNarrationPlaybackSessionIdPresent = playbackSessionIdPresent;
        sendClientDiagnostic(
            reusedAudio ? 'narration audio reused' : 'narration audio created',
            phase,
            narrationAudioState(audio, playbackSessionIdPresent)
        );
        sendClientDiagnostic(
            'narration pre-src state',
            phase,
            narrationAudioState(audio, playbackSessionIdPresent)
        );
        audio.src = url;
        audio.volume = 0.60;
        audio.muted = false;
        audio.setAttribute('playsinline', '');
        sendClientDiagnostic(
            'narration pre-play state',
            phase,
            narrationAudioState(audio, playbackSessionIdPresent)
        );

        elapsed.set(0);
        duration.set(0);
        progress.set(0);

        activeNarrationAudio = audio;
        activeNarrationResolve = resolve;

        timingSource.set('narration');
        playbackPhase.set(phase);

        audio.onloadedmetadata = () => {
            sendClientDiagnostic(
                'narration loadedmetadata',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );

            duration.set(audio.duration);
            elapsed.set(0);
            progress.set(0);
        };

        audio.oncanplay = () => {
            sendClientDiagnostic(
                'narration canplay',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );
        };

        audio.onplaying = () => {
            sendClientDiagnostic(
                'narration playing',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );
        };

        let timeAdvancedSent = false;

        activeNarrationTimer = window.setInterval(() => {
            elapsed.set(audio.currentTime);

            if (!timeAdvancedSent && audio.currentTime > 0) {
                timeAdvancedSent = true;
                sendClientDiagnostic(
                    'narration time advanced',
                    phase,
                    narrationAudioState(audio, playbackSessionIdPresent)
                );
            }

            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                duration.set(audio.duration);
                progress.set((audio.currentTime / audio.duration) * 100);
            } else {
                progress.set(0);
            }
        }, 100);

        audio.onended = () => {
            narrationInterrupting = false;
            sendClientDiagnostic(
                'narration ended',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );

            cleanupNarrationAudio({
                timer: activeNarrationTimer,
                setTimer: value => {
                    activeNarrationTimer = value;
                },
                setAudio: value => {
                    activeNarrationAudio = value;
                },
                setResolve: value => {
                    activeNarrationResolve = value;
                },
                preserveAudio: true
            });
            resolve();
        };

        audio.onerror = () => {
            sendClientDiagnostic(
                'narration error',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );

            if (narrationInterrupting) {
                narrationInterrupting = false;
                return;
            }

            console.warn('🔇 Narration missing or failed, skipping:', url);

            cleanupNarrationAudio({
                timer: activeNarrationTimer,
                setTimer: value => {
                    activeNarrationTimer = value;
                },
                setAudio: value => {
                    activeNarrationAudio = value;
                },
                setResolve: value => {
                    activeNarrationResolve = value;
                },
                preserveAudio: true
            });
            resolve();
        };

        dlog(
            '🎤 START AUDIO',
            phase,
            url
        );

        const playPromise = audio.play();
        playPromise.then(() => {
            sendClientDiagnostic(
                'narration play succeeded state',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );
        }).catch((err: unknown) => {
            sendClientDiagnostic(
                'narration play failed',
                phase,
                narrationAudioState(audio, playbackSessionIdPresent)
            );
            console.warn('Narration audio.play() failed; not resolving narration phase as finished:', url, err);

            cleanupNarrationAudio({
                timer: activeNarrationTimer,
                setTimer: value => {
                    activeNarrationTimer = value;
                },
                setAudio: value => {
                    activeNarrationAudio = value;
                },
                setResolve: value => {
                    activeNarrationResolve = value;
                },
                preserveAudio: true
            });
            reject(err);
        });
    });
}

export function continueStoppedNarrationPhase(): void {

    narrationPausedAtBoundary = false;

    if (activeNarrationResolve) {
        const resolve = activeNarrationResolve;
        activeNarrationResolve = null;
        resolve();
    }
}

export async function signalNarrationFinished(
    playbackSessionId: string,
    phase: string
) {
    if (narrationSignaled) return;
    if (!playbackSessionId) return;

    narrationSignaled = true;

    dlog('📡 narration-finished');

    await signalNarrationFinishedApi(playbackSessionId, phase);
}

async function playNarrationQueue() {
    if (narrationLock) return;

    narrationLock = true;

    try {
        while (narrationQueue.length > 0) {
            const narrationKey = narrationQueue[0].key;
            const playbackSessionId = narrationQueue[0].playbackSessionId;
            const completedPhase = narrationQueue[0].phase;
            activeNarrationKey = narrationKey;
            queuedNarrationKeys.delete(narrationKey);
            narrationSignaled = false;

            while (narrationQueue.length > 0 && narrationQueue[0].key === narrationKey) {
                const item = narrationQueue.shift()!;
                dlog('🎤 Playing:', item.phase);
                await playOneAudio(item.url, item.phase, Boolean(item.playbackSessionId));
            }

            dlog('🔔 Narration finished');


            dlog(
                '🔔 SIGNAL NARRATION FINISHED',
                get(currentTrack)?.trackName
            );

            console.log('🔔 SIGNAL FINISHED', get(currentTrack)?.trackName, get(playbackPhase));

            await signalNarrationFinished(playbackSessionId, completedPhase);
            completedNarrationKeys.add(narrationKey);

            if (activeNarrationKey === narrationKey) {
                activeNarrationKey = null;
            }
        }
    } catch (err) {
        activeNarrationKey = null;
        queuedNarrationKeys.clear();
        completedNarrationKeys.clear();
        narrationQueue = [];
        console.error('❌ Narration playback failed:', err);
    } finally {
        narrationLock = false;

        if (narrationQueue.length > 0) {
            void Promise.resolve().then(playNarrationQueue);
        }
    }
}

export function startPlaybackPolling() {
    if (!browser) return;
    if (pollTimer) return;

    dlog('▶️ Playback polling started');

    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetchPlaybackStatus();
            if (!res.ok) return;

            const data = await res.json();

            if (narrationPausedAtBoundary) {
                isPlaying.set(false);
                playbackPhase.set('paused');
                return;
            }

            const spotifyId = data.context?.spotify_track_id ?? null;
            const phase = data.phase as PlaybackPhase;
            const playbackStarted = hasPlaybackStarted(phase);

            const narrationPhase = isNarrationPhase(phase);

            if (narrationPhase) {
                const audioQueue = data.context?.audio_queue;
                const firstQueueItem =
                    Array.isArray(audioQueue) && audioQueue.length > 0
                        ? audioQueue[0]
                        : null;
                const firstQueueItemKeys =
                    firstQueueItem && typeof firstQueueItem === 'object'
                        ? Object.keys(firstQueueItem as Record<string, unknown>)
                        : [];
                const narrationIntakeKey =
                    `${phase}:${data.context?.audio_url ?? JSON.stringify(audioQueue ?? '')}`;

                if (narrationIntakeKey !== lastNarrationIntakeKey) {
                    lastNarrationIntakeKey = narrationIntakeKey;
                    sendClientDiagnostic('narration phase received', phase);
                    console.info('[car-page] narration intake', {
                        phase,
                        hasAudioUrl: typeof data.context?.audio_url === 'string',
                        audioQueueIsArray: Array.isArray(audioQueue),
                        audioQueueLength: Array.isArray(audioQueue) ? audioQueue.length : 0,
                        firstQueueItemKeys,
                        hasBedAudioUrl: typeof data.context?.bed_audio_url === 'string',
                        hasCurrentTrack: Boolean(get(currentTrack))
                    });
                }
            }

            if (
                playbackStarted &&
                spotifyId &&
                !data.isPaused &&
                (
                    spotifyId !== syncedUiSpotifyTrackId ||
                    playbackContextHasFreshText(
                        data.context as Record<string, unknown> | null | undefined
                    )
                )
            ) {
                syncedUiSpotifyTrackId = spotifyId;
                finishedTrackId = null;

                const list = get(tracks);
                const next = list.find(t => t.spotifyTrackId === spotifyId);

                const ctx = data.context ?? {};
                const normalizedCtx = normalizePlaybackContext(
                    ctx as Record<string, unknown>
                );

                if (next) {
                    const enriched = buildEnrichedPlaybackTrack({
                        baseTrack: next,
                        normalizedCtx
                    });

                    currentTrack.set(
                        enriched as unknown as Parameters<typeof currentTrack.set>[0]
                    );

                    currentRank.set(enriched.rank);
                } else {
                    const fallbackTrack = buildFallbackPlaybackTrack({
                        spotifyId,
                        currentRank: data.current_rank ?? 0,
                        trackName: data.track_name ?? '',
                        artistName: data.artist_name ?? '',
                        normalizedCtx
                    });

                    currentTrack.set(
                        fallbackTrack as Parameters<typeof currentTrack.set>[0]
                    );

                    currentRank.set(fallbackTrack.rank);

                    dlog('📻 Radio fallback track created:', fallbackTrack.trackName);
                }

                if (!narrationPhase) {
                    resetPlaybackProgress();
                }

                dlog('🎯 UI track switch:', next?.trackName ?? data.track_name);
            }

            // dlog('⏱ Poll data:', data);

            const rankingId =
                data.context?.ranking_id != null
                    ? Number(data.context.ranking_id)
                    : data.context?.track_ranking_id != null
                        ? Number(data.context.track_ranking_id)
                        : data.context?.collection_ranking_id != null
                            ? Number(data.context.collection_ranking_id)
                            : null;


            playbackPhase.set(phase);

            const prevPhase = lastPhase;

            const playing =
                typeof data.isPlaying === 'boolean'
                    ? data.isPlaying
                    : isPhasePlaying(phase);

            isPlaying.set(playing);


            const frontendNarrationOwnsClock =
                get(timingSource) === 'narration' && narrationPhase;

            if (frontendNarrationOwnsClock) {
                lastPhase = phase;
            }

            if (
                phase !== prevPhase &&
                !narrationPhase
            ) {
                dlog(`🔁 Phase transition: ${prevPhase} → ${phase}`);

                resetPlaybackProgress();
            }

            if (
                narrationPhase &&
                (data.context?.audio_url || data.context?.audio_queue)
            ) {
                const bedAudioUrl =
                    typeof data.context?.bed_audio_url === 'string'
                        ? data.context.bed_audio_url
                        : null;

                if (
                    bedAudioUrl &&
                    (bedAudioUrl !== lastStartedBedUrl || !isBedPlaying())
                ) {
                    dlog('ðŸŽ§ BED start:', bedAudioUrl);
                    lastStartedBedUrl = bedAudioUrl;
                    startBedUrl(bedAudioUrl).catch((err: unknown) => {
                        console.warn('Bed audio.play() failed:', bedAudioUrl, err);
                    });
                }

                const playbackSessionId =
                    typeof data.playbackSessionId === 'string' && data.playbackSessionId.length > 0
                        ? data.playbackSessionId
                        : `legacy:${phase}:${
                            data.context?.audio_url ??
                            JSON.stringify(data.context?.audio_queue ?? '')
                        }`;
                const narrationKey =
                    `${playbackSessionId ?? 'missing-session'}:${phase}:${data.context?.audio_url ?? JSON.stringify(data.context?.audio_queue ?? '')}`;

                if (
                    playbackSessionId &&
                    activeNarrationKey !== narrationKey &&
                    !queuedNarrationKeys.has(narrationKey) &&
                    !completedNarrationKeys.has(narrationKey)
                ) {
                    dlog(`🎤 Narration phase: ${phase}`);

                    activeNarrationKey = narrationKey;
                    queuedNarrationKeys.add(narrationKey);
                    lastNarrationPhase = phase;
                    lastNarrationKey = narrationKey;

                    if (phase === 'intro') {
                        lastSpotifyId = null;
                    }

                    dlog(
                        '🎤 NARRATION FRAME',
                        phase,
                        data.context?.spotify_track_id,
                        data.track_name
                    );

                    const narrationItems = buildNarrationQueue(
                        phase,
                        data.context
                    );

                    dlog(
                        '🎤 Queue:',
                        narrationItems.map(item => item.url)
                    );

                    if (narrationItems.length === 0) {
                        if (activeNarrationKey === narrationKey) {
                            activeNarrationKey = null;
                        }
                        queuedNarrationKeys.delete(narrationKey);
                        sendClientDiagnostic('narration queue empty', phase);
                        console.warn('[car-page] narration queue empty; not signaling narration-finished', {
                            phase
                        });
                    } else {
                        narrationQueue.push(
                            ...narrationItems.map(item => ({
                                ...item,
                                key: narrationKey,
                                playbackSessionId
                            }))
                        );

                        void playNarrationQueue();
                    }
                }
            } else if (!narrationPhase) {
                lastNarrationPhase = null;
            }

            /* ─────────────────────────────
               🎵 Track handling (Spotify)
               ───────────────────────────── */
            if (
                phase === 'track' &&
                data.context?.spotify_track_id
            ) {
                const spotifyTrackId = data.context.spotify_track_id as string;
                const now = Date.now();

                if (failedSpotifyStartTrackId !== spotifyTrackId) {
                    failedSpotifyStartTrackId = null;
                    lastSpotifyStartRetryAt = 0;
                }

                const retryThrottled =
                    failedSpotifyStartTrackId === spotifyTrackId &&
                    now - lastSpotifyStartRetryAt < SPOTIFY_START_RETRY_THROTTLE_MS;

                if (
                    lastSpotifyId !== spotifyTrackId &&
                    !spotifyStartLock &&
                    !data.isPaused &&
                    !retryThrottled
                ) {
                    spotifyStartLock = true;
                    const spotifyStartAttempt = ++spotifyStartAttemptGeneration;

                    dlog('🎵 TRACK start:', spotifyTrackId);

                    try {
                        const sel = get(currentSelection);

                        if (sel?.mode === 'artist_spotlight') {
                            dlog('🎵 Artist Spotlight: backend controls Spotify start');

                            if (isBedPlaying()) {
                                dlog('🎧 BED stop: artist spotlight track start');
                                stopBed();
                            }

                            lastSpotifyId = spotifyTrackId;
                            activeSpotifyTrackId = spotifyTrackId;
                            trackSwitchTime = Date.now();
                            trackFinalized = false;
                            failedSpotifyStartTrackId = null;
                            lastSpotifyStartRetryAt = 0;
                            return;
                        }
                        if (isBedPlaying()) {
                            dlog('ðŸŽ§ BED stop: track phase reached');
                            stopBed();
                        }

                        const devices = await fetchSpotifyDevices();
                        const device = devices.find(d => d.is_active) ?? devices[0];

                        if (spotifyStartAttempt !== spotifyStartAttemptGeneration) {
                            return;
                        }

                        if (!device) {
                            console.warn('No Spotify devices found. Open Spotify on a device to continue.');
                            if (spotifyStartAttempt === spotifyStartAttemptGeneration) {
                                failedSpotifyStartTrackId = spotifyTrackId;
                                lastSpotifyStartRetryAt = Date.now();
                            }
                            return;
                        }

                        await transferSpotifyPlayback(device.id);
                        await playSpotifyTrackApi(spotifyTrackId, device.id);

                        if (spotifyStartAttempt !== spotifyStartAttemptGeneration) {
                            return;
                        }

                        lastSpotifyId = spotifyTrackId;
                        activeSpotifyTrackId = spotifyTrackId;
                        trackSwitchTime = Date.now();
                        trackFinalized = false;
                        failedSpotifyStartTrackId = null;
                        lastSpotifyStartRetryAt = 0;

                        stopBed();
                    } catch (err) {
                        if (spotifyStartAttempt === spotifyStartAttemptGeneration) {
                            failedSpotifyStartTrackId = spotifyTrackId;
                            lastSpotifyStartRetryAt = Date.now();
                        }
                        console.error('❌ Spotify start failed', err);
                    } finally {
                        spotifyStartLock = false;
                    }
                }
            }

            const {
                elapsedSec,
                durationSec,
                progressPercent
            } = calculatePlaybackTiming(data);

            const justSwitched = isWithinTrackSwitchProtectionWindow(trackSwitchTime);

            const spotifyOwnsClock =
                get(timingSource) === 'spotify' &&
                phase === 'track';

            if (spotifyOwnsClock) {
                elapsed.set(elapsedSec);
                duration.set(durationSec);
                progress.set(progressPercent);
            }

            if (
                phase === 'track' &&
                spotifyId &&
                finishedTrackId !== spotifyId &&
                !trackFinalized &&
                !justSwitched &&
                durationSec > 1 &&
                elapsedSec >= durationSec - 1 &&
                elapsedSec > 2
            ) {
                finishedTrackId = spotifyId;
                trackFinalized = true;

                finalizeTrackUI();
                markCurrentTrackPlayed();

                const settings = get(playbackSettingsStore);
                const isContinuous = settings.pauseMode === 'continuous';

                if (isContinuous) {
                    finishedTrackId = spotifyId;
                    trackFinalized = true;

                    window.dispatchEvent(new CustomEvent('ts-next-track'));

                    try {
                        await signalTrackFinishedApi({
                            rankingId,
                            spotifyTrackId: spotifyId
                        });
                    } catch (err) {
                        console.error('❌ Failed to signal track-finished', err);
                    }
                }
            }

            if (false && lastPhase === 'track' && phase !== 'track') {
                trackFinalized = true;

                finalizeTrackUI();
                markCurrentTrackPlayed();

                if (!isSingleMode()) {
                    // fallback track-finished intentionally disabled
                } else {
                    // single mode → do not auto-advance
                }
            }

            lastPhase = phase;
        } catch (err) {
            console.warn('⚠️ Playback poll error', err);
        }
    }, POLL_INTERVAL_MS);
}

export function resetSpotifyStartState(): void {
    spotifyStartAttemptGeneration += 1;
    lastSpotifyId = null;
    activeSpotifyTrackId = null;
    syncedUiSpotifyTrackId = null;
    failedSpotifyStartTrackId = null;
    lastSpotifyStartRetryAt = 0;
}

export function resetNarrationPhaseState(): void {
    narrationQueue = [];
    narrationLock = false;
    lastNarrationPhase = null;
    lastNarrationKey = null;
    lastNarrationIntakeKey = null;
    activeNarrationKey = null;
    queuedNarrationKeys.clear();
    completedNarrationKeys.clear();
    lastStartedBedUrl = null;
    resetSpotifyStartState();
    finishedTrackId = null;
    narrationSignaled = false;
    narrationPausedAtBoundary = false;
}

export async function skipToNextTrack(): Promise<void> {
    resetSpotifyStartState();
    await stopPlaybackApi();

    const AUDIO_PIPELINE_CLEAR_DELAY_MS = 1200;
    await new Promise(resolve => setTimeout(resolve, AUDIO_PIPELINE_CLEAR_DELAY_MS));

    markCurrentTrackPlayed();

    stopCurrentNarrationPhase();
    stopBed();

    narrationQueue = [];
    narrationLock = false;
    activeNarrationKey = null;
    queuedNarrationKeys.clear();
    completedNarrationKeys.clear();
    lastStartedBedUrl = null;

    finalizeTrackUI();

    if (!isSingleMode()) {
        await signalTrackFinishedApi({
            rankingId: null,
            spotifyTrackId: null
        }).catch(() => {
            // ignore signal failure
        });
    }
}

export function stopPlaybackPolling() {
    if (!pollTimer) return;

    clearInterval(pollTimer);
    pollTimer = null;

    lastPhase = null;
    trackFinalized = false;

    narrationQueue = [];
    narrationLock = false;
    lastNarrationPhase = null;
    lastNarrationKey = null;
    lastNarrationIntakeKey = null;
    activeNarrationKey = null;
    queuedNarrationKeys.clear();
    completedNarrationKeys.clear();
    lastStartedBedUrl = null;
    resetSpotifyStartState();
    finishedTrackId = null;
}

export function markUserStartedPlayback() {
    if (!browser) return;

    if (!activeNarrationAudio) {
        activeNarrationAudio = new Audio();
    }

    activeNarrationAudio.muted = true;
    activeNarrationAudio.setAttribute('playsinline', '');
    activeNarrationAudio.src = SILENT_AUDIO_DATA_URI;

    activeNarrationAudio.play()
        .then(() => {
            activeNarrationAudio?.pause();
            if (activeNarrationAudio) {
                activeNarrationAudio.currentTime = 0;
                activeNarrationAudio.muted = false;
            }
        })
        .catch((err: unknown) => {
            console.warn('Narration audio unlock failed:', err);
        });

    void unlockBedAudio();
}
