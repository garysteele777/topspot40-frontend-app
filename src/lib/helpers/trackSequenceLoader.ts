// src/lib/helpers/trackSequenceLoader.ts

import type {SelectionState} from '$lib/stores/selection';
import {normalizeTrack, type LoadedTrack} from '$lib/utils/normalizeTrack';

import {
    loadCollectionFromSupabase,
    loadDecadeGenreFromSupabase,
    type CollectionResponse,
    type DecadeGenreResponse,
    type SequenceItem
} from '$lib/api/supabaseLoader';

// Svelte 5 reactive Map (silences ESLint warnings)
import {SvelteMap} from 'svelte/reactivity';

// ------------------------------------------------------------
// Extend SequenceItem with all optional fields received
// ------------------------------------------------------------
type SequenceItemExtended = SequenceItem & {
    // ranking context
    rankingId?: number;
    ranking_id?: number;

    spotifyTrackId?: string | null;
    spotify_track_id?: string | null;

    trackName?: string | null;
    track_name?: string | null;

    artistName?: string | null;
    artist_name?: string | null;

    decadeSlug?: string | null;
    decade_slug?: string | null;

    genreSlug?: string | null;
    genre_slug?: string | null;

    // narration fields
    info?: string | null;
    intro?: string | null;

    detail?: string | null;
    detail_text?: string | null;

    artistDescription?: string | null;
    artist_detail?: string | null;

    artistImage?: string | null;
    artist_image?: string | null;
    artist_artwork?: string | null;
    artistArtwork?: string | null;
};

const PROGRAM_LENGTH = 40;

// ------------------------------------------------------------
// Local normalization helper
// ------------------------------------------------------------
function preNormalizeRow(t: SequenceItemExtended): SequenceItemExtended {
    return {
        ...t,
        intro: t.intro ?? t.info ?? null,
        detail: t.detail ?? t.detail_text ?? null,
        artistDescription: t.artistDescription ?? t.artist_detail ?? null,
        artistImage:
            t.artistImage ??
            t.artist_image ??
            t.artist_artwork ??
            t.artistArtwork ??
            null
    };
}

// ------------------------------------------------------------
// Map + filter AFTER normalization
// ------------------------------------------------------------
function mapItemsToTracks(
    rows: SequenceItemExtended[],
    startRank: number,
    endRank: number,
    sel: SelectionState   // 👈 ADD THIS
): LoadedTrack[] {
    const result: LoadedTrack[] = [];

    for (const raw of rows) {
        const r = raw.rank ?? 0;

        if (r < startRank || r > Math.min(endRank, 40)) continue;

        const row = preNormalizeRow(raw);
        const track = normalizeTrack(row);

        // attach ranking info
        track.sourceRank = track.rank;

        // attach decade + genre metadata
        track.decadeSlug =
            row.decadeSlug ??
            row.decade_slug ??
            (row as any).decade ??
            (sel.context?.decade as string | undefined) ??
            undefined;

        track.genreSlug =
            row.genreSlug ??
            row.genre_slug ??
            (row as any).genre ??
            (sel.context?.genre as string | undefined) ??
            undefined;

        track.decadeName = track.decadeSlug?.toUpperCase();
        track.genreName = track.genreSlug?.toUpperCase();

        result.push(track);
    }

    return result.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

// ------------------------------------------------------------
// SMALL INTERNAL CACHE
// ------------------------------------------------------------
const loaderCache = new SvelteMap<string, LoadedTrack[]>();

function mkCacheKey(sel: SelectionState): string {
    if (sel.mode === 'collection') {
        const slug =
            sel.context?.collection_slug ??
            sel.context?.collectionId ??
            sel.context?.collection ??
            '';
        return `c:${slug}:${sel.language}:${sel.startRank}:${sel.endRank}`;
    }

    const decade = sel.context?.decade ?? '';
    const genre = sel.context?.genre ?? '';
    return `dg:${decade}:${genre}:${sel.language}:${sel.startRank}:${sel.endRank}`;
}

// ------------------------------------------------------------
// MAIN LOADER
// ------------------------------------------------------------
export async function loadTrackSequence(
    sel: SelectionState
): Promise<LoadedTrack[]> {
    if (!sel?.mode || !sel.context) {
        console.warn('⚠ loadTrackSequence called with invalid selection:', sel);
        return [];
    }

    const ctx = sel.context as NonNullable<SelectionState['context']>;
    const key = mkCacheKey(sel);

    // Cache hit
    if (loaderCache.has(key)) {
        return loaderCache.get(key)!;
    }

    const isAllDecades =
        sel.mode === 'decade_genre' && (sel.context as any)?.decade === 'ALL';

    const startRank = sel.startRank ?? 1;
    const endRank = isAllDecades
        ? (sel.endRank ?? PROGRAM_LENGTH)     // allow 320 / 2560 etc
        : PROGRAM_LENGTH;                     // normal DG stays 40


    try {
        // --------------------------------------------------------
        // COLLECTION MODE
        // --------------------------------------------------------
        if (sel.mode === 'collection') {
            const slug =
                ctx.collection_slug ??
                ctx.collectionId ??
                ctx.collection ??
                '';

            if (!slug) {
                console.warn('⚠ No slug found in collection context:', ctx);
                return [];
            }

            const data: CollectionResponse =
                await loadCollectionFromSupabase({slug});

            const rows: SequenceItemExtended[] =
                data.tracks ??
                data.rankings ??
                (data.rows as SequenceItemExtended[]) ??
                [];

            if (!rows.length) return [];

            const mapped = mapItemsToTracks(rows, startRank, endRank, sel);

            // Only cap normal decades to 40. ALL decades stays full length.
            const finalTracks = isAllDecades ? mapped : mapped.slice(0, PROGRAM_LENGTH);

            loaderCache.set(key, finalTracks);
            return finalTracks;
        }

        // --------------------------------------------------------
        // DECADE / GENRE MODE
        // --------------------------------------------------------
        const decade = ctx.decade ?? '';
        const genre = ctx.genre ?? '';

        if (!decade || !genre) return [];

        const data: DecadeGenreResponse =
            await loadDecadeGenreFromSupabase({
                decade,
                genre
            });

        const rows: SequenceItemExtended[] =
            data.tracks ??
            data.rankings ??
            (data.rows as SequenceItemExtended[]) ??
            [];

        if (rows.length) {
            console.log('🎧 Raw rows received from Supabase:', rows.length);

            console.table(
                rows.slice(0, 40).map(r => ({
                    rankingId: r.rankingId ?? r.ranking_id,
                    rank: r.rank,
                    track: r.trackName ?? r.track_name,
                    artist: r.artistName ?? r.artist_name,
                    spotifyTrackId: r.spotifyTrackId ?? r.spotify_track_id,
                    decade: r.decadeSlug ?? r.decade_slug,
                    genre: r.genreSlug ?? r.genre_slug
                }))
            );

            // optional — expose full array for inspection
            // @ts-ignore debug
            window.__TS40_ROWS__ = rows;
        }

        if (!rows.length) return [];

        const mapped = mapItemsToTracks(rows, startRank, endRank, sel);

// Only cap normal decades to 40
        const finalTracks = isAllDecades ? mapped : mapped.slice(0, PROGRAM_LENGTH);

        loaderCache.set(key, finalTracks);
        return finalTracks;

    } catch (err) {
        console.error('❌ loadTrackSequence failed:', err);
        return [];
    }
}

// ------------------------------------------------------------
// FAST FIRST-TRACK LOADER (UI-only)
// ------------------------------------------------------------
export async function loadFirstTrack(
    sel: SelectionState
): Promise<LoadedTrack | null> {
    const tracks = await loadTrackSequence(sel);
    return tracks[0] ?? null;
}
