// src/lib/carmode/CarMode.poller.ts

import {browser} from '$app/environment';
import {get} from 'svelte/store';

import type {PlaybackPhase} from '$lib/helpers/car/types';
import {resetPlaybackProgress} from '$lib/utils/resetPlaybackState';

import {markCurrentTrackPlayed} from '$lib/carmode/programTracker';
import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
import {startBedUrl, stopBed, isBedPlaying} from '$lib/audio/bedPlayer';
import {calculatePlaybackTiming} from '$lib/utils/calculatePlaybackTiming';
import {isWithinTrackSwitchProtectionWindow} from '$lib/utils/playbackSwitchTiming';
import {
    buildNarrationQueue,
    type NarrationQueueItem
} from '$lib/utils/buildNarrationQueue';

import {normalizePlaybackContext} from '$lib/utils/normalizePlaybackContext';
import {
    buildFallbackPlaybackTrack,
    buildEnrichedPlaybackTrack
} from '$lib/utils/buildPlaybackTrack';
import {
    hasPlaybackStarted,
    isNarrationPhase
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

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

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

    if (activeNarrationTimer !== null) {
        clearInterval(activeNarrationTimer);
        activeNarrationTimer = null;
    }

    if (activeNarrationAudio) {
        narrationInterrupting = true;
        activeNarrationAudio.pause();
        activeNarrationAudio.currentTime = 0;
        activeNarrationAudio.src = '';
        activeNarrationAudio = null;
    }

    resetPlaybackProgress();
    timingSource.set('spotify');

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
            resetPlaybackProgress();
        };

        activeNarrationTimer = window.setInterval(() => {
            elapsed.set(audio.currentTime);

            if (audio.duration > 0) {
                progress.set((audio.currentTime / audio.duration) * 100);
            } else {
                progress.set(0);
            }
        }, 100);

        audio.onended = () => {
            narrationInterrupting = false;

            if (activeNarrationTimer !== null) {
                clearInterval(activeNarrationTimer);
                activeNarrationTimer = null;
            }

            activeNarrationAudio = null;
            activeNarrationResolve = null;

            resetPlaybackProgress();

            timingSource.set('spotify');
            resolve();
        };

        audio.onerror = () => {
            if (narrationInterrupting) {
                narrationInterrupting = false;
                return;
            }

            console.warn('🔇 Narration missing or failed, skipping:', url);

            if (activeNarrationTimer !== null) {
                clearInterval(activeNarrationTimer);
                activeNarrationTimer = null;
            }

            activeNarrationAudio = null;
            activeNarrationResolve = null;

            resetPlaybackProgress();

            timingSource.set('spotify');
            resolve();
        };

        audio.play().catch((err: unknown) => {
            console.warn('🔇 Narration could not play, skipping:', url, err);

            if (activeNarrationTimer !== null) {
                clearInterval(activeNarrationTimer);
                activeNarrationTimer = null;
            }

            activeNarrationAudio = null;
            activeNarrationResolve = null;

            resetPlaybackProgress();

            timingSource.set('spotify');
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

    await fetch(`${API_BASE}/playback/narration-finished`, {
        method: 'POST'
    }).catch(() => {
        // ignore signal failure
    });
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

function ctxHasFreshText(ctx: unknown): boolean {
    if (!ctx || typeof ctx !== 'object') return false;

    const c = ctx as {
        intro?: unknown;
        detail?: unknown;
        artistText?: unknown;
        artist_text?: unknown;
    };

    return Boolean(c.intro || c.detail || c.artistText || c.artist_text);
}

export function startPlaybackPolling() {
    if (!browser) return;
    if (pollTimer) return;

    dlog('▶️ Playback polling started');

    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
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

            if (
                playbackStarted &&
                spotifyId &&
                !data.isPaused &&
                (
                    spotifyId !== activeSpotifyTrackId ||
                    ctxHasFreshText(data.context)
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

                resetPlaybackProgress();

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
                    : phase === 'intro' ||
                    phase === 'detail' ||
                    phase === 'artist' ||
                    phase === 'track';

            isPlaying.set(playing);

            const narrationPhase = isNarrationPhase(phase);

            if (get(timingSource) === 'narration' && narrationPhase) {
                lastPhase = phase;
            }

            if (phase !== prevPhase) {
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

                    narrationQueue.push(...narrationItems);

                    void playNarrationQueue();
                }
            } else if (!narrationPhase) {
                lastNarrationPhase = null;
            }

            if (phase === 'track' && data.context?.spotify_track_id) {
                const spotifyTrackId = data.context.spotify_track_id as string;

                stopBed();

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
                        await fetch(`${API_BASE}/playback/play-spotify`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                                spotify_track_id: spotifyTrackId
                            })
                        });
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

            if (get(timingSource) === 'spotify' && !justSwitched) {
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
                elapsedSec >= durationSec &&
                elapsedSec > 2 &&
                !justSwitched
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
                        await fetch(`${API_BASE}/playback/track-finished`, {
                            method: 'POST'
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

export async function skipToNextTrack(): Promise<void> {
    await fetch(`${API_BASE}/playback/stop`, {
        method: 'POST'
    }).catch(() => {
        // ignore stop failure
    });

    const AUDIO_PIPELINE_CLEAR_DELAY_MS = 1200;
    await new Promise(resolve => setTimeout(resolve, AUDIO_PIPELINE_CLEAR_DELAY_MS));

    markCurrentTrackPlayed();

    stopCurrentNarrationPhase();
    stopBed();

    narrationQueue = [];
    narrationLock = false;

    finalizeTrackUI();

    if (!isSingleMode()) {
        await fetch(`${API_BASE}/playback/track-finished`, {
            method: 'POST'
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
}

export function markUserStartedPlayback() {
    // compatibility export
}