// src/lib/carmode/CarMode.loader.ts
import {tracks, currentTrack, status} from '$lib/carmode/CarMode.store';
import {cacheKey, applyPlaybackOrder, pickInitialTrack} from '$lib/helpers/car/trackUtils';
import type {SelectionState} from '$lib/stores/selection';
import type {LoadedTrack} from '$lib/utils/normalizeTrack';
import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import {PROGRAM_TYPES, isFavoritesProgram} from '$lib/types/program';
import {loadFavoriteQueue} from '$lib/favorites/queue';

import {loadTrackSequence} from '$lib/helpers/trackSequenceLoader';
import {getFavorites, getFavoritePlaybackEntries} from '$lib/favorites/favorites';

import {upsertProgram, type ProgramKey} from '$lib/carmode/programHistory';
import {get} from 'svelte/store';
import {programHistoryStore} from '$lib/carmode/programHistory';
import {resetPlaybackApi} from '$lib/api/playbackApi';

const sequenceCache = new Map<string, LoadedTrack[]>();

type ArtistRadioApiTrack = {
    track_id: number;
    track_name: string;
    artist_name: string;
    artist_id?: number | null;
    spotify_track_id: string;
    spotify_artist_id?: string | null;
    album_artwork?: string | null;
    album_name?: string | null;
    year_released?: number | null;
    detail?: string | null;
    artist_description?: string | null;
    duration_ms?: number | null;
};

export async function loadForSelection(
    sel: SelectionState,
    initialRank?: number | null
): Promise<void> {

    try {
        await resetPlaybackApi();
    } catch (err) {
        console.warn('Playback reset failed', err);
    }

    status.set('Loading tracks…');


    // 🎧 RADIO MODE DETECTION (ALL / ALL)
    // Radio is backend-owned: /play-sequence chooses one decade/genre set at
    // a time and publishes each active track through playback status. Do not
    // flatten ALL/<genre> into a client-side sequence.
    const decade =
        sel.context?.decade ??
        sel.context?.decade_slug ??
        sel.context?.decadeName ??
        sel.context?.decadeSlug;

    if (!isFavoritesProgram(sel.programType) && sel.mode === 'decade_genre' && decade === 'ALL') {
        sel.programType = PROGRAM_TYPES.RADIO_DG;

        const genre = sel.context?.genre ?? 'ALL';
        const placeholder: CarModeTrack = {
            id: null,
            rankingId: null,
            rank: 0,
            trackName: 'TopSpot Radio',
            artistName: 'Load the first set to begin',
            spotifyTrackId: '',
            albumArtwork: null,
            durationSeconds: 0,
            genreSlug: genre,
            genreName: genre.replace(/(^|_)([a-z])/g, (_, prefix, letter) => `${prefix} ${letter.toUpperCase()}`).trim()
        };

        tracks.set([placeholder]);
        currentTrack.set(placeholder);
        status.set(`${placeholder.genreName} Radio ready. Load the first set.`);
        return;
    }

    const collectionGroup =
        sel.context?.collection_group_slug ??
        sel.context?.collectionGroupSlug ??
        sel.context?.collection_group;

    const collectionSlug =
        sel.context?.collection_slug ??
        sel.context?.collectionSlug;

    if (
        !isFavoritesProgram(sel.programType) &&
        sel.mode === 'collection' &&
        collectionGroup &&
        !collectionSlug
    ) {
        sel.programType = 'RADIO_COL';

        if (collectionGroup) {

            const placeholder: CarModeTrack = {
                id: null,
                rankingId: null,
                rank: 0,
                trackName: 'TopSpot Collections Radio',
                artistName: 'Press Play to Start',
                spotifyTrackId: '',
                albumArtwork: null,
                durationSeconds: 0
            };

            tracks.set([placeholder]);
            currentTrack.set(placeholder);

            status.set('Collections Radio ready. Press Play.');

            return;
        }

    }

    tracks.set([]);
    currentTrack.set(null);

    // ─────────────────────────────────────────────
// ARTIST SPOTLIGHT
// ─────────────────────────────────────────────
    if (sel.mode === 'artist_spotlight') {

        const artistId = sel.context?.artist_id;

        if (!artistId) {

            if (sel.programType === 'RADIO_ARTIST') {
                // The backend chooses the artist only after the initiating
                // Auto Play click. Do not preload the legacy radio-set API:
                // it bypasses the Artist Radio biography phase.
                const placeholder: CarModeTrack = {
                    id: null,
                    rankingId: null,
                    rank: 0,
                    trackName: 'Artist Radio',
                    artistName: 'Press Auto Play to Start',
                    spotifyTrackId: '',
                    albumArtwork: null,
                    durationSeconds: 0
                };
                tracks.set([placeholder]);
                currentTrack.set(placeholder);
                status.set('Artist Radio ready. Press Auto Play to Start.');
                return;

                const genre = sel.context?.genre ?? 'ALL';

                status.set('Loading Artist Spotlight Radio set…');

                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/artist-spotlight/radio-set?genre=${encodeURIComponent(genre)}`
                );

                if (!response.ok) {
                    status.set('Failed to load Artist Spotlight Radio set.');
                    return;
                }

                const data = await response.json();

                if (!data?.ok || !Array.isArray(data.tracks) || data.tracks.length === 0) {
                    status.set('No Artist Spotlight Radio tracks found.');
                    return;
                }

                const normalized: CarModeTrack[] = data.tracks.map((track: ArtistRadioApiTrack, index: number) => ({
                    id: track.track_id,
                    rankingId: null,
                    rank: index + 1,

                    trackName: track.track_name,
                    artistId: track.artist_id ?? null,

                    spotifyTrackId: track.spotify_track_id,
                    spotifyArtistId: track.spotify_artist_id ?? null,

                    albumArtwork: track.album_artwork ?? null,
                    albumName: track.album_name ?? null,

                    year: track.year_released ?? null,

                    detail: track.detail ?? null,

                    artistText: track.artist_description ?? null,

                    durationSeconds: Math.floor((track.duration_ms ?? 0) / 1000)
                }));

                tracks.set(normalized);
                currentTrack.set(normalized[0] ?? null);

                status.set(
                    `${data.artist_name ?? 'Artist'} Spotlight Radio set loaded.`
                );

                return;
            }

            status.set('Missing artist ID.');
            return;
        }

        const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/artist-spotlight/artist-tracks?artist_id=${artistId}`
        );

        if (!response.ok) {
            status.set('Failed to load artist tracks.');
            return;
        }

        const rawTracks = await response.json();

        if (!Array.isArray(rawTracks) || rawTracks.length === 0) {
            status.set('No tracks found.');
            return;
        }

        const normalized: CarModeTrack[] = rawTracks.map((track, index) => ({
            id: track.track_id,
            rankingId: null,
            rank: index + 1,

            trackName: track.track_name,
            artistName: track.artist_name,
            artistId: track.artist_id ?? null,

            spotifyTrackId: track.spotify_track_id,
            spotifyArtistId: track.spotify_artist_id ?? null,

            albumArtwork: track.album_artwork ?? null,
            albumName: track.album_name ?? null,

            year: track.year_released ?? null,

            detail: track.detail ?? null,

            artistText:
                track.artist_description ??
                null,

            textsByLanguage:
                track.texts_by_language ??
                track.textsByLanguage ??
                null,

            durationSeconds: Math.floor((track.duration_ms ?? 0) / 1000)
        }));

        let ordered: CarModeTrack[] = [...normalized];

        if (sel.playbackOrder === 'shuffle') {
            ordered = [...ordered].sort(() => Math.random() - 0.5);
        }

        if (sel.playbackOrder === 'down') {
            ordered = [...ordered].reverse();
        }

        tracks.set(ordered);

        const initial =
            typeof initialRank === 'number'
                ? ordered.find(track => track.rank === initialRank) ?? ordered[0]
                : ordered[0];

        currentTrack.set(initial ?? null);

        status.set(
            `${ordered.length} artist spotlight tracks loaded.`
        );

        return;
    }

// FAVORITES: retain each saved list's ranking and narration metadata.
    if (isFavoritesProgram(sel.programType)) {
        const specific = (value: string | undefined) => value && value !== 'ALL' ? value : undefined;
        const scope = sel.programType === PROGRAM_TYPES.FAVORITES_COL
            ? {program: 'COL' as const, collectionGroup: specific(collectionGroup), collectionSlug: specific(collectionSlug)}
            : {program: 'DG' as const, genre: specific(sel.context?.genre), decade: specific(decade)};
        const entries = getFavoritePlaybackEntries(scope);
        if (!entries.length) {
            status.set('No favorites saved for this selection yet.');
            return;
        }
        try {
            const loaded = await loadFavoriteQueue(entries, sel, async source => {
                const list = await loadTrackSequence(source);
                if (list.length && source.context) {
                    const key = source.mode === 'collection'
                        ? `COL|${source.context.collection_slug}|${source.context.collection_group_slug}`
                        : `DG|${source.context.decade}|${source.context.genre}`;
                    upsertProgram(key as ProgramKey, key.slice(key.indexOf('|') + 1).replaceAll('|', ' • '), list.length);
                }
                return list;
            });
            const ordered = applyPlaybackOrder(loaded, sel.playbackOrder).map(toCarModeTrack);
            tracks.set(ordered);
            currentTrack.set(ordered.find(track => track.rank === initialRank) ?? ordered[0] ?? null);
            const missing = entries.length - ordered.length;
            status.set(missing
                ? `Loaded ${ordered.length} of ${entries.length} favorites. ${missing} could not be loaded.`
                : `Loaded ${ordered.length} favorite tracks.`);
        } catch (error) {
            console.error('Failed to load favorites', error);
            status.set('Failed to load favorites. Please try again.');
        }
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

        }

// 🚫 Resume removed — always start fresh
        let startRank =
            sel.playbackOrder === 'down'
                ? ordered.length
                : 1;

// Only resume IF explicitly intended (future feature)
        const isResume = false;

        if (isResume && typeof initialRank === 'number') {
            startRank = initialRank;
        }

        let first: LoadedTrack | null;

        if (isInlineFavorites) {
            first = candidateTracks[0] ?? null;

        } else if (sel.playbackOrder === 'shuffle') {
            first = sel.skipPlayed
                ? candidateTracks.find(t => !playedRanks.has(t.rank)) ?? candidateTracks[0] ?? null
                : candidateTracks[0] ?? null;

        } else {
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

        artistId:
            (t as any).artistId ??
            (t as any).artist_id ??
            null,

        spotifyArtistId:
            (t as any).spotifyArtistId ??
            (t as any).spotify_artist_id ??
            null,

        intro: (t as any).intro ?? null,
        detail: (t as any).detail ?? null,

        artistText:
            (t as any).artistText ??
            (t as any).artistDescription ??
            (t as any).artist_description ??
            null,

        textsByLanguage:
            (t as any).textsByLanguage ??
            (t as any).texts_by_language ??
            null,

        sourceRank: x.sourceRank,
        genreSlug: x.genreSlug,
        genreName: x.genreName,
        decadeSlug: x.decadeSlug,
        decadeName: x.decadeName
    };
}
