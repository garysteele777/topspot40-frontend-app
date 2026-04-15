// src/lib/carmode/CarMode.poller.ts

import {get} from 'svelte/store';
import type {PlaybackPhase} from '$lib/helpers/car/types';
import {browser} from '$app/environment';
import {markCurrentTrackPlayed} from '$lib/carmode/programTracker';
import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

import {
    timingSource,
    isPlaying,
    playbackPhase,
    elapsed,
    duration,
    progress,
    currentRank,
    currentTrack,
    tracks
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

// Narration queue + lock
let narrationLock = false;
type NarrationItem = {
    url: string;
    phase: 'intro' | 'detail' | 'artist';
};

let narrationQueue: NarrationItem[] = [];


let lastNarrationPhase: PlaybackPhase | null = null;
let trackFinalized = false;
let narrationSignaled = false;

let activeSpotifyTrackId: string | null = null;
let trackSwitchTime = 0;


import {currentSelection} from '$lib/carmode/CarMode.store';
import {markRankPlayed} from '$lib/carmode/programHistory';

function isSingleMode(): boolean {
    const sel = get(currentSelection);

    return (
        sel?.mode === 'decade_genre' &&
        sel?.categoryMode === 'single'
    );
}

/* ─────────────────────────────────────────────
   Finalize UI when a track ends
   ───────────────────────────────────────────── */

function finalizeTrackUI(): void {
    console.log('🏁 Track finished → finalizing UI');

    isPlaying.set(false);

    const d = Number(get(duration) ?? 0);
    if (d > 0) {
        elapsed.set(d);
        progress.set(100);
    } else {
        progress.set(0);
    }
}

/* ─────────────────────────────────────────────
   Low-level narration player
   ───────────────────────────────────────────── */


function playOneAudio(
    url: string,
    phase: 'intro' | 'detail' | 'artist'
): Promise<void> {
    // ✅ SSR safety: Audio + window don't exist on the server
    if (!browser) return Promise.resolve();


    return new Promise<void>((resolve) => {

        const audio = new Audio(url);

        // 🧠 narration owns the clock
        timingSource.set('narration');
        playbackPhase.set(phase);

        audio.onloadedmetadata = () => {
            duration.set(audio.duration);
            elapsed.set(0);
            progress.set(0);
        };

        const timer = window.setInterval(() => {
            elapsed.set(audio.currentTime);

            if (audio.duration > 0) {
                progress.set((audio.currentTime / audio.duration) * 100);

            } else {
                progress.set(0);
            }
        }, 100);

        audio.onended = () => {
            clearInterval(timer);

            elapsed.set(0);
            duration.set(0);
            progress.set(0);

            timingSource.set('spotify');
            resolve();
        };

        audio.onerror = () => {
            console.warn('🔇 Narration missing or failed, skipping:', url);

            clearInterval(timer);

            elapsed.set(0);
            duration.set(0);
            progress.set(0);

            timingSource.set('spotify');
            resolve(); // ✅ skip narration, continue sequence
        };

        audio.play().catch(() => {
            console.warn('🔇 Narration could not play, skipping:', url);

            clearInterval(timer);

            elapsed.set(0);
            duration.set(0);
            progress.set(0);

            timingSource.set('spotify');
            resolve(); // ✅ skip narration, continue sequence
        });

    });
}

async function signalNarrationFinished() {
    if (narrationSignaled) return;
    narrationSignaled = true;

    dlog('📡 track-finished');

    await fetch(`${API_BASE}/playback/narration-finished`, {
        method: 'POST'
    }).catch(() => {
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

/* ─────────────────────────────────────────────
   Poller
   ───────────────────────────────────────────── */

export function startPlaybackPolling() {
    if (!browser) return;   // 👈 ADD THIS GUARD
    if (pollTimer) return;


    dlog('▶️ Playback polling started');


    pollTimer = window.setInterval(async () => {
        try {
            const res = await fetch(`${API_BASE}/playback/status`);
            if (!res.ok) return;

            const data = await res.json();
            // console.log("STATUS SNAPSHOT", data); // temporary

            const spotifyId = data.context?.spotify_track_id ?? null;
            const phase = data.phase as PlaybackPhase;


            const hasPlaybackStarted =
                phase === 'intro' ||
                phase === 'detail' ||
                phase === 'artist' ||
                phase === 'track';

            const justSwitchedRecently = Date.now() - trackSwitchTime < 1500;

            if (
                hasPlaybackStarted &&
                spotifyId &&
                !justSwitchedRecently &&
                !data.isPaused &&   // 🧠 ADD THIS
                (spotifyId !== activeSpotifyTrackId)
            ) {
                activeSpotifyTrackId = spotifyId;
                trackSwitchTime = Date.now();   // 🔥 ADD THIS
                finishedTrackId = null;

                const list = get(tracks);
                const next = list.find(t => t.spotifyTrackId === spotifyId);

                if (next) {
                    const ctx = data.context ?? {};

                    const enriched = {
                        ...next,

                        // 🔥 ADD THESE
                        intro: data.intro ?? next.intro,
                        detail: data.detail ?? next.detail,
                        artistText: data.artist_text ?? next.artistText,
                        artistArtwork: ctx?.artist_artwork ?? next.artistArtwork,

                        decadeSlug: ctx?.decade_slug ?? next.decadeSlug,
                        decadeName: ctx?.decade_name ?? next.decadeName,
                        genreSlug: ctx?.genre_slug ?? next.genreSlug,
                        genreName: ctx?.genre_name ?? next.genreName,

                        setNumber: ctx?.set_number ?? next.setNumber,
                        blockPosition: ctx?.block_position ?? next.blockPosition,
                        blockSize: ctx?.block_size ?? next.blockSize,
                    };

                    currentTrack.set(enriched);
                    currentRank.set(enriched.rank);
                } else {
                    // radio fallback
                    const ctx = data.context ?? {};

                    const fallbackTrack = {
                        id: null,
                        rankingId: ctx?.ranking_id ?? null,
                        rank: data.current_rank ?? 0,
                        trackName: data.track_name ?? '',
                        artistName: data.artist_name ?? '',
                        spotifyTrackId: spotifyId,

                        // 🔥 ADD THESE
                        intro: data.intro ?? null,
                        detail: data.detail ?? null,
                        artistText: data.artist_text ?? null,
                        artistArtwork: ctx?.artist_artwork ?? null,

                        decadeSlug: ctx?.decade_slug ?? null,
                        decadeName: ctx?.decade_name ?? null,
                        genreSlug: ctx?.genre_slug ?? null,
                        genreName: ctx?.genre_name ?? null,

                        yearReleased: null,
                        albumArtwork: ctx?.album_artwork ?? null,

                        setNumber: ctx.set_number,
                        blockPosition: ctx.block_position,
                        blockSize: ctx.block_size,
                    };
                    currentTrack.set(fallbackTrack);
                    currentRank.set(fallbackTrack.rank);

                    dlog('📻 Radio fallback track created:', fallbackTrack.trackName);
                }

                elapsed.set(0);
                duration.set(0);
                progress.set(0);

                trackFinalized = false;

                dlog('🎯 UI track switch:', next?.trackName ?? data.track_name);
            }


            dlog('⏱ Poll data:', data);

            // ─────────────────────────────
            // Extract rankingId every poll
            // ─────────────────────────────
            const rankingId =
                data.context?.ranking_id != null
                    ? Number(data.context.ranking_id)
                    : data.context?.track_ranking_id != null
                        ? Number(data.context.track_ranking_id)
                        : data.context?.collection_ranking_id != null
                            ? Number(data.context.collection_ranking_id)
                            : null;

            dlog('🎯 rankingId:', rankingId);

            // ─────────────────────────────
// Rank change → update UI track card (radio-safe)
// ─────────────────────────────
            /*
            if (
                rankingId != null &&
                rankingId !== get(currentTrack)?.rankingId &&
                !spotifyId &&
                !hasPlaybackStarted   // 🔥 ADD THIS LINE
            ) {
                const list = get(tracks);
                const next = list.find(t => t.rankingId === rankingId);

                dlog('🎯 Rank-based UI update', {
                    rankingId,
                    previous: get(currentTrack)?.trackName,
                    next: next?.trackName
                });

                if (next) {
                    currentTrack.set(next);
                    currentRank.set(next.rank);

                    // reset UI timing
                    elapsed.set(0);
                    duration.set(0);
                    progress.set(0);

                    trackFinalized = false;
                }
            }
            */


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

            // 🛑 FRONTEND owns timing during narration — do NOT overwrite UI clock
            const isNarrationPhase =
                phase === 'intro' || phase === 'detail' || phase === 'artist';

            if (get(timingSource) === 'narration' && isNarrationPhase) {
                lastPhase = phase;
                // 🔥 DO NOT return — just skip clock updates
            }


            // ─────────────────────────────
            // Phase transition reset
            // ─────────────────────────────
            if (phase !== prevPhase) {
                dlog(`🔁 Phase transition: ${prevPhase} → ${phase}`);

                elapsed.set(0);
                duration.set(0);
                progress.set(0);
            }

            /* ─────────────────────────────
               🎤 Narration handling
               ───────────────────────────── */
            if (
                (phase === 'intro' || phase === 'detail' || phase === 'artist') &&
                data.context?.audio_url
            ) {
                if (phase !== lastNarrationPhase) {
                    dlog(`🎤 Narration phase: ${phase}`);
                    narrationSignaled = false;   // ✅ reset per phase
                    lastNarrationPhase = phase;


                    const url = data.context.audio_url as string;

                    dlog('🎤 Queue:', url);

                    narrationQueue.push({url, phase});
                    void playNarrationQueue();

                }
            } else if (
                phase !== 'intro' &&
                phase !== 'detail' &&
                phase !== 'artist'
            ) {
                lastNarrationPhase = null;
            }

            /* ─────────────────────────────
               🎵 Track handling (Spotify)
               ───────────────────────────── */
            if (phase === 'track' && data.context?.spotify_track_id) {
                const spotifyId = data.context.spotify_track_id as string;

                if (
                    lastSpotifyId !== spotifyId &&
                    !spotifyStartLock &&
                    !data.isPaused   // 🧠 THIS IS THE KEY
                ) {

                    spotifyStartLock = true;

                    dlog('🎵 TRACK start:', spotifyId);

                    lastSpotifyId = spotifyId;
                    activeSpotifyTrackId = spotifyId;
                    trackSwitchTime = Date.now();
                    trackFinalized = false;

                    try {
                        await fetch(`${API_BASE}/playback/play-spotify`, {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({spotify_track_id: spotifyId})
                        });
                    } catch (err) {
                        console.error('❌ Spotify start failed', err);
                    } finally {
                        spotifyStartLock = false;
                    }
                }
            }


            /* ─────────────────────────────
               Timing + progress (clamped + finalize)
               ───────────────────────────── */

            const elapsedMs =
                typeof data.elapsedMs === 'number'
                    ? data.elapsedMs
                    : typeof data.context?.elapsed_seconds === 'number'
                        ? Math.round(data.context.elapsed_seconds * 1000)
                        : 0;

            const durationMs =
                typeof data.durationMs === 'number'
                    ? data.durationMs
                    : typeof data.context?.duration_seconds === 'number'
                        ? Math.round(data.context.duration_seconds * 1000)
                        : 0;

// Convert ms → seconds
            const elapsedSecRaw = elapsedMs / 1000;
            const durationSec = durationMs / 1000;

// Clamp elapsed so it never runs past duration
            const elapsedSec =
                durationSec > 0 ? Math.min(elapsedSecRaw, durationSec) : elapsedSecRaw;

// 🔥 ONLY update timing when Spotify owns the clock
            const justSwitched = Date.now() - trackSwitchTime < 1500;

            if (get(timingSource) === 'spotify' && !justSwitched) {
                elapsed.set(elapsedSec);
                duration.set(durationSec);

                const pct =
                    durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0;

                progress.set(Math.min(100, Math.max(0, pct)));
            }


            if (
                phase === 'track' &&
                spotifyId &&
                finishedTrackId !== spotifyId &&   // 🔥 FIRST LINE OF DEFENSE
                !trackFinalized &&
                durationSec > 1 &&
                elapsedSec >= durationSec &&
                elapsedSec > 2 &&
                !justSwitched
            ) {
                finishedTrackId = spotifyId;   // ⭐ important
                trackFinalized = true;

                console.log('🏁 Track reached end (single fire), finalizing UI', {
                    elapsedSec,
                    durationSec,
                    track: data.track_name
                });

                finalizeTrackUI();
                markCurrentTrackPlayed();

                const sel = get(currentSelection);
                const settings = get(playbackSettingsStore);

                const isContinuous = settings.pauseMode === 'continuous';

                console.log('🧪 MODE CHECK', {
                    isContinuous,
                    pauseMode: settings.pauseMode,
                    selection: sel
                });

                if (!isContinuous) {
                    console.log('🛑 Pause mode: not advancing after track end');
                } else {
                    console.log('▶️ Continuous mode → advancing to next track');

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
            // Fallback: detect leaving track phase
            if (false && lastPhase === 'track' && phase !== 'track') {
                trackFinalized = true;

                console.log('🏁 Track ended via phase transition', {
                    elapsedSec,
                    durationSec,
                    from: lastPhase,
                    to: phase,
                    track: data.track_name
                });

                finalizeTrackUI();
                markCurrentTrackPlayed();

                if (!isSingleMode()) {
                    try {
                        console.log('🚫 Fallback track-finished disabled');
                    } catch (err) {
                        console.error('❌ Failed to signal track-finished', err);
                    }
                } else {
                    console.log('🛑 Single mode: not advancing after phase transition');
                }
            }

            lastPhase = phase;

        } catch (err) {
            console.warn('⚠️ Playback poll error', err);
        }
    }, POLL_INTERVAL_MS);
}

/* ─────────────────────────────────────────────
   ⏭ Manual Skip → count as played + advance
   ───────────────────────────────────────────── */

export async function skipToNextTrack(): Promise<void> {
    console.log('⏭ Manual skip requested');

    // 1️⃣ Stop Spotify immediately
    await fetch(`${API_BASE}/playback/stop`, {
        method: 'POST'
    }).catch(() => {
    });

    // small buffer to clear audio pipeline
    const AUDIO_PIPELINE_CLEAR_DELAY_MS = 1200;
    await new Promise(resolve => setTimeout(resolve, AUDIO_PIPELINE_CLEAR_DELAY_MS));

    // 2️⃣ Count current track as played
    markCurrentTrackPlayed();

    // 3️⃣ Stop any narration immediately
    narrationQueue = [];
    narrationLock = false;

    // 4️⃣ Snap UI to finished
    finalizeTrackUI();

    // 5️⃣ Tell backend to advance only when not in Single mode
    if (!isSingleMode()) {
        await fetch(`${API_BASE}/playback/track-finished`, {
            method: 'POST'
        }).catch(() => {
        });
    } else {
        console.log('🛑 Single mode: skip finalized UI only, no advance');
    }
}


export function stopPlaybackPolling() {
    if (!pollTimer) return;

    console.log('⏹ Playback polling stopped');

    clearInterval(pollTimer);
    pollTimer = null;

    lastPhase = null;

    // 🚫 DO NOT reset lastSpotifyId
    // lastSpotifyId = null;

    trackFinalized = false;

    narrationQueue = [];
    narrationLock = false;
    lastNarrationPhase = null;
}


// Compatibility export
export function markUserStartedPlayback() {
    console.log('🧠 Manual playback started');
}