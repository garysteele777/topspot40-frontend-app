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
    stopPlaybackApi
} from '$lib/api/playbackApi';


import {markCurrentTrackPlayed} from '$lib/carmode/programTracker';
import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
import {startBedUrl, stopBed, isBedPlaying} from '$lib/audio/bedPlayer';
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

const POLL_INTERVAL_MS = Number(
    import.meta.env.VITE_PLAYBACK_POLL_MS ?? 500
);

let pollTimer: number | null = null;
let lastPhase: PlaybackPhase | null = null;

let lastSpotifyId: string | null = null;
let spotifyStartLock = false;
let finishedTrackId: string | null = null;

let narrationLock = false;

let narrationQueue: NarrationQueueItem[] = [];

let lastNarrationPhase: PlaybackPhase | null = null;
let trackFinalized = false;
let narrationSignaled = false;

let activeSpotifyTrackId: string | null = null;
let trackSwitchTime = 0;

let activeNarrationAudio: HTMLAudioElement | null = null;
let activeNarrationTimer: number | null = null;
let activeNarrationResolve: (() => void) | null = null;
let narrationInterrupting = false;

let narrationPausedAtBoundary = false;

export function stopCurrentNarrationPhase(
    options: { resolvePhase?: boolean; preserveResolve?: boolean } = {}
): void {
    if (options.preserveResolve) {
        narrationPausedAtBoundary = true;
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
        }
    });

    if (options.resolvePhase !== false && activeNarrationResolve) {
        const resolve = activeNarrationResolve;
        activeNarrationResolve = null;
        resolve();
    } else if (!options.preserveResolve) {
        activeNarrationResolve = null;
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
    phase: 'set_intro' | 'collection_intro' | 'liner' | 'intro' | 'detail' | 'artist'
): Promise<void> {
    if (!browser) return Promise.resolve();

    return new Promise<void>((resolve) => {
        stopCurrentNarrationPhase({resolvePhase: false});

        const audio = new Audio(url);
        audio.volume = 0.60;

        activeNarrationAudio = audio;
        activeNarrationResolve = resolve;

        timingSource.set('narration');
        playbackPhase.set(phase);

        audio.onloadedmetadata = () => {
            console.log('🎧 narration metadata', {
                duration: audio.duration,
                phase,
                url
            });

            duration.set(audio.duration);
            elapsed.set(0);
            progress.set(0);
        };

        activeNarrationTimer = window.setInterval(() => {
            elapsed.set(audio.currentTime);

            if (Number.isFinite(audio.duration) && audio.duration > 0) {
                duration.set(audio.duration);
                progress.set((audio.currentTime / audio.duration) * 100);
            } else {
                progress.set(0);
            }
        }, 100);

        audio.onended = () => {
            narrationInterrupting = false;

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
                }
            });
            resolve();
        };

        audio.onerror = () => {
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
                }
            });
            resolve();
        };

        audio.play().catch((err: unknown) => {
            console.warn('🔇 Narration could not play, skipping:', url, err);

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
                }
            });
            resolve();
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

export async function signalNarrationFinished() {
    if (narrationSignaled) return;

    narrationSignaled = true;

    dlog('📡 track-finished');

    await signalNarrationFinishedApi();
}

async function playNarrationQueue() {
    if (narrationLock) return;

    narrationLock = true;

    try {
        while (narrationQueue.length > 0) {
            const item = narrationQueue.shift()!;
            dlog('🎤 Playing:', item.phase);
            await playOneAudio(item.url, item.phase);
        }

        dlog('🔔 Narration finished');

        await signalNarrationFinished();
    } catch (err) {
        console.error('❌ Narration playback failed:', err);
    } finally {
        narrationLock = false;
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

            if (
                playbackStarted &&
                spotifyId &&
                !data.isPaused &&
                (
                    spotifyId !== activeSpotifyTrackId ||
                    playbackContextHasFreshText(
                        data.context as Record<string, unknown> | null | undefined
                    )
                )
            ) {
                activeSpotifyTrackId = spotifyId;
                trackSwitchTime = Date.now();
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

                trackFinalized = false;

                dlog('🎯 UI track switch:', next?.trackName ?? data.track_name);
            }

            dlog('⏱ Poll data:', data);

            const rankingId =
                data.context?.ranking_id != null
                    ? Number(data.context.ranking_id)
                    : data.context?.track_ranking_id != null
                        ? Number(data.context.track_ranking_id)
                        : data.context?.collection_ranking_id != null
                            ? Number(data.context.collection_ranking_id)
                            : null;

            dlog('🎯 rankingId:', rankingId);

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

                if (phase !== lastNarrationPhase) {
                    dlog(`🎤 Narration phase: ${phase}`);

                    narrationSignaled = false;
                    lastNarrationPhase = phase;

                    const narrationItems = buildNarrationQueue(
                        phase,
                        data.context
                    );

                    dlog(
                        '🎤 Queue:',
                        narrationItems.map(item => item.url)
                    );

                    const bedAudioUrl =
                        typeof data.context?.bed_audio_url === 'string'
                            ? data.context.bed_audio_url
                            : null;

                    console.log(
                        '🎧 BED DEBUG',
                        phase,
                        data.context?.bed_audio_url
                    );

                    if (bedAudioUrl && !isBedPlaying()) {
                        dlog('🎧 BED start:', bedAudioUrl);
                        startBedUrl(bedAudioUrl);
                    }

                    narrationQueue.push(...narrationItems);

                    void playNarrationQueue();
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

                if (
                    lastSpotifyId !== spotifyTrackId &&
                    !spotifyStartLock &&
                    !data.isPaused
                ) {
                    spotifyStartLock = true;

                    dlog('🎵 TRACK start:', spotifyTrackId);

                    lastSpotifyId = spotifyTrackId;
                    activeSpotifyTrackId = spotifyTrackId;
                    trackSwitchTime = Date.now();
                    trackFinalized = false;

                    try {
                        const sel = get(currentSelection);

                        if (sel?.mode === 'artist_spotlight') {
                            dlog('🎵 Artist Spotlight: backend controls Spotify start');

                            if (isBedPlaying()) {
                                dlog('🎧 BED stop: artist spotlight track start');
                                stopBed();
                            }

                            return;
                        }
                        await playSpotifyTrackApi(spotifyTrackId);
                        stopBed();
                    } catch (err) {
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
                    window.dispatchEvent(new CustomEvent('ts-next-track'));

                    try {
                        await signalTrackFinishedApi();
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

export async function skipToNextTrack(): Promise<void> {
    await stopPlaybackApi();

    const AUDIO_PIPELINE_CLEAR_DELAY_MS = 1200;
    await new Promise(resolve => setTimeout(resolve, AUDIO_PIPELINE_CLEAR_DELAY_MS));

    markCurrentTrackPlayed();

    stopCurrentNarrationPhase();
    stopBed();

    narrationQueue = [];
    narrationLock = false;

    finalizeTrackUI();

    if (!isSingleMode()) {
        await signalTrackFinishedApi().catch(() => {
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
}

export function markUserStartedPlayback() {
    // compatibility export
}