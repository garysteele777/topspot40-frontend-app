// src/lib/carmode/CarMode.loader.ts
import {tracks, currentTrack, status} from '$lib/carmode/CarMode.store';
import {cacheKey, applyPlaybackOrder, pickInitialTrack} from '$lib/helpers/car/trackUtils';
import type {SelectionState} from '$lib/stores/selection';
import type {LoadedTrack} from '$lib/utils/normalizeTrack';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';

import {loadTrackSequence} from '$lib/helpers/trackSequenceLoader';
import {getFavorites} from '$lib/favorites/favorites';

import {upsertProgram, type ProgramKey} from '$lib/carmode/programHistory';
import {get} from 'svelte/store';
import {programHistoryStore} from '$lib/carmode/programHistory';

const sequenceCache = new Map<string, LoadedTrack[]>();


export async function loadForSelection(
    sel: SelectionState,
    initialRank?: number | null
): Promise<void> {

    try {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/playback/reset`, {
            method: 'POST'
        });
    } catch (err) {
        console.warn('Playback reset failed', err);
    }

    status.set('Loading tracks…');
    console.log('🚀 LOADER selection.programType =', sel.programType);

    // 🎧 RADIO MODE DETECTION (ALL / ALL)
    const decade =
        sel.context?.decade ??
        sel.context?.decade_slug ??
        sel.context?.decadeName ??
        sel.context?.decadeSlug;

    const genre =
        sel.context?.genre ??
        sel.context?.genre_slug ??
        sel.context?.genreName ??
        sel.context?.genreSlug;

    console.log("🧪 RADIO CHECK:", {
        decade,
        genre,
        raw: sel.context
    });

    if (
        sel.mode === 'decade_genre' &&
        decade === 'ALL'
    ) {
        console.log('📻 RADIO MODE detected (ALL / ANY)');

        // 🔥 THIS IS THE FIX
        sel.programType = 'RADIO_DG';

        const placeholder: CarModeTrack = {
            id: null,
            rankingId: null,
            rank: 0,
            trackName: 'TopSpot Radio',
            artistName: 'Press Play to Start',
            spotifyTrackId: '',
            albumArtwork: null,
            durationSeconds: 0
        };

        tracks.set([placeholder]);
        currentTrack.set(placeholder);

        status.set('Radio ready. Press Play.');

        console.log('📻 Radio mode loader finished — waiting for Play.');
        return;
    }

    tracks.set([]);
    currentTrack.set(null);

    // ─────────────────────────────────────────────
    // FAVORITES: DECADE (programType = FAV_DG)
    // ─────────────────────────────────────────────
    if (sel.programType === 'FAV_DG') {
        const group = sel.context?.favoritesGroup;

        if (!group) {
            status.set('Missing favorites group.');
            return;
        }

        let favoriteIds: number[] = [];

        const raw = localStorage.getItem('ts-favorites-v1');

        if (raw) {
            const parsed = JSON.parse(raw) as { DG?: Record<string, number[]> };
            const dg = parsed?.DG ?? {};

            const decade =
                sel.context?.decade ??
                sel.context?.decade_slug ??
                sel.context?.decadeName ??
                sel.context?.decadeSlug;

            const genre =
                sel.context?.genre ??
                sel.context?.genre_slug ??
                sel.context?.genreName ??
                sel.context?.genreSlug;

            if (genre === 'ALL' && decade) {
                // ⭐ combine all genres for the decade
                favoriteIds = Object.entries(dg)
                    .filter(([key]) => key.startsWith(`${decade}|`))
                    .flatMap(([, ids]) => ids);
            } else {
                // ⭐ normal single-genre favorites
                favoriteIds = dg[group] ?? [];
            }
        }

// remove duplicates
        favoriteIds = [...new Set(favoriteIds)];

        console.log("⭐ FAVORITES loaded:", favoriteIds);

        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/supabase/decade-genre/get-favorites`,
            {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ranking_ids: favoriteIds})
            }
        );

        if (!response.ok) {
            status.set('Failed to load favorites.');
            return;
        }

        console.log("⭐ FAVORITES loaded:", favoriteIds);

        const data: unknown = await response.json();

        // Keep typing strict without using `any`
        const tracksArr =
            typeof data === 'object' && data !== null && 'tracks' in data && Array.isArray((data as {
                tracks: unknown
            }).tracks)
                ? ((data as { tracks: unknown[] }).tracks as unknown[])
                : [];

        if (!tracksArr.length) {
            status.set('No favorite tracks found.');
            return;
        }

        const normalized: LoadedTrack[] = tracksArr
            .map((t) => {
                if (typeof t !== 'object' || t === null) return null;

                const o = t as Record<string, unknown>;

                // Minimal fields we rely on; we pass through the rest
                const trackId = o.trackId;
                const spotifyTrackId = o.spotifyTrackId;
                const rankingId = o.rankingId;

                return {
                    ...(o as unknown as LoadedTrack),
                    id: typeof trackId === 'number' ? trackId : (o.id as LoadedTrack['id']),
                    spotifyTrackId: typeof spotifyTrackId === 'string' ? spotifyTrackId : (o.spotifyTrackId as string),
                    rankingId: typeof rankingId === 'number' ? rankingId : (o.rankingId as number)
                } as LoadedTrack;
            })
            .filter((x): x is LoadedTrack => x !== null);

        const ordered = applyPlaybackOrder(normalized, 'shuffle');

        tracks.set(ordered.map(toCarModeTrack));

        // Initialize program history entry
        if (sel.mode === 'decade_genre') {
            const decade =
                sel.context?.decade ??
                sel.context?.decade_slug ??
                sel.context?.decadeName ??
                sel.context?.decadeSlug;

            const genre =
                sel.context?.genre ??
                sel.context?.genre_slug ??
                sel.context?.genreName ??
                sel.context?.genreSlug;

            if (decade && genre) {
                const key = `DG|${decade}|${genre}` as ProgramKey;

                upsertProgram(
                    key,
                    `${decade} • ${genre}`,
                    ordered.length
                );
            }
        }

        if (sel.mode === 'collection') {
            const slug = sel.context?.collection_slug;
            const group = sel.context?.collection_group_slug;

            if (slug && group) {
                const key = `COL|${slug}|${group}` as ProgramKey;

                upsertProgram(
                    key,
                    slug,
                    ordered.length
                );
            }
        }

        const first = ordered[0] ?? null;
        currentTrack.set(first ? toCarModeTrack(first) : null);

        status.set(`Loaded ${ordered.length} favorite tracks.`);
        return;
    }

    // ─────────────────────────────────────────────
    // DECADE / COLLECTION / NORMAL PROGRAMS
    // ─────────────────────────────────────────────
    try {
        const key = cacheKey(sel);
        const cached = sequenceCache.get(key);

        // 1) Load full sequence (no background load; no race)
        let sequence: LoadedTrack[] = cached ?? [];

        if (!sequence.length) {
            sequence = await loadTrackSequence(sel);
            sequenceCache.set(key, sequence);
        }

        if (!sequence.length) {
            status.set('No tracks found.');
            return;
        }

        // 2) Optional: "favorites" genre within decade_genre mode (not FAV_DG program)
        let filtered: LoadedTrack[] = sequence;

        const genre =
            sel.context?.genre ??
            sel.context?.genre_slug ??
            sel.context?.genreName ??
            sel.context?.genreSlug;

        const isInlineFavorites =
            sel.mode === 'decade_genre' && genre === 'favorites';

        if (isInlineFavorites) {
            const decade = sel.context?.decade;

            if (decade) {
                const favoriteIds = getFavorites('DG', decade);

                if (favoriteIds.length === 0) {
                    status.set(`⭐ No favorites yet for ${decade}.`);
                    tracks.set([]);
                    currentTrack.set(null);
                    return;
                }

                filtered = sequence.filter(
                    (t): t is LoadedTrack & { rankingId: number } =>
                        typeof (t as { rankingId?: unknown }).rankingId === 'number' &&
                        favoriteIds.includes((t as { rankingId: number }).rankingId)
                );
            }
        }

        const order = isInlineFavorites ? 'shuffle' : sel.playbackOrder;

        const ordered = applyPlaybackOrder(filtered, order);

        // 3) Set tracks FIRST (so UI shows Rank X of N correctly)
        tracks.set(ordered.map(toCarModeTrack));

        // Initialize program history entry
        if (sel.mode === 'decade_genre') {
            const decade =
                sel.context?.decade ??
                sel.context?.decade_slug ??
                sel.context?.decadeName ??
                sel.context?.decadeSlug;

            const genre =
                sel.context?.genre ??
                sel.context?.genre_slug ??
                sel.context?.genreName ??
                sel.context?.genreSlug;

            if (decade && genre) {
                const programKey = `DG|${decade}|${genre}` as ProgramKey;

                console.log('🧠 Creating program history:', programKey);

                upsertProgram(
                    programKey,
                    `${decade} • ${genre}`,
                    ordered.length
                );
            }
        }

        if (sel.mode === 'collection') {
            const slug = sel.context?.collection_slug;
            const group = sel.context?.collection_group_slug;

            if (slug && group) {
                const programKey = `COL|${slug}|${group}` as ProgramKey;

                console.log('🧠 Creating collection history:', programKey);

                upsertProgram(
                    programKey,
                    slug,
                    ordered.length
                );
            }
        }

        // 4) Pick the initial track.
        // Use initialRank if provided; else default to 1.
        let candidateTracks = ordered;

        let playedRanks = new Set<number>();


        const history = get(programHistoryStore);

        let programKey: ProgramKey | null = null;

        if (sel.mode === 'decade_genre') {
            const d =
                sel.context?.decade ??
                sel.context?.decade_slug ??
                sel.context?.decadeName ??
                sel.context?.decadeSlug;

            const g =
                sel.context?.genre ??
                sel.context?.genre_slug ??
                sel.context?.genreName ??
                sel.context?.genreSlug;

            if (d && g) programKey = `DG|${d}|${g}` as ProgramKey;
        }

        if (sel.mode === 'collection') {
            const slug = sel.context?.collection_slug;
            const group = sel.context?.collection_group_slug;

            if (slug && group) {
                programKey = `COL|${slug}|${group}` as ProgramKey;
            }
        }

        if (programKey) {
            const program = history.find(p => p.key === programKey);
            playedRanks = new Set(program?.playedRanks ?? []);

            console.log('🧠 PROGRAM KEY:', programKey);
            console.log('🧠 HISTORY ENTRY:', program);
            console.log('🧠 PLAYED RANKS:', Array.from(playedRanks));
        }

// 🚫 Resume removed — always start fresh
        let startRank = 1;

// Only resume IF explicitly intended (future feature)
        const isResume = false;

        if (isResume && typeof initialRank === 'number') {
            startRank = initialRank;
        }

        console.log('🧪 END RANK CHECK', {
            selEndRank: sel.endRank,
            orderedLength: ordered.length,
            playbackOrder: sel.playbackOrder,
            playedRanks: Array.from(playedRanks)
        });

        let first: LoadedTrack | null;

        if (isInlineFavorites) {
            first = candidateTracks[0] ?? null;

        } else if (sel.playbackOrder === 'shuffle') {
            first = candidateTracks[0] ?? null;

        } else {
            console.log('🚨 FINAL skipPlayed USED:', sel.skipPlayed);
            first = pickInitialTrack(
                ordered,
                sel.playbackOrder,
                startRank,
                ordered.length,
                sel.skipPlayed ? playedRanks : new Set()
            );
        }

        if (first) {
            currentTrack.set(toCarModeTrack(first));
        }

        status.set(`Loaded ${ordered.length} tracks.`);
    } catch (err) {
        console.error('Failed to load tracks', err);
        status.set('Failed to load tracks.');
        return;
    }

    console.log('🧊 Loader finished. No playback started. Waiting for Play button.');
}

function toCarModeTrack(t: LoadedTrack): CarModeTrack {

    const x = t as LoadedTrack & {
        sourceRank?: number
        genreSlug?: string
        genreName?: string
        decadeSlug?: string
        decadeName?: string
    };

    return {
        ...t,
        rankingId: t.rankingId ?? null,

        // 🔥 ADD THESE
        intro: (t as any).intro ?? null,
        detail: (t as any).detail ?? null,
        artistText: (t as any).artistText ?? null,

        sourceRank: x.sourceRank,
        genreSlug: x.genreSlug,
        genreName: x.genreName,
        decadeSlug: x.decadeSlug,
        decadeName: x.decadeName
    };
}