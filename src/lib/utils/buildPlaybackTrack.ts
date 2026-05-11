// src/lib/utils/buildPlaybackTrack.ts

import type {NormalizedPlaybackContext} from '$lib/utils/normalizePlaybackContext';

type PlaybackBaseTrack = Record<string, unknown> & {
    rank: number;
    collection_name?: string | null;
    collection_group_name?: string | null;
    intro?: string | null;
    detail?: string | null;
    artistText?: string | null;
    artistArtwork?: string | null;
    textsByLanguage?: NormalizedPlaybackContext['textsByLanguage'] | null;
    decadeSlug?: string | null;
    decadeName?: string | null;
    genreSlug?: string | null;
    genreName?: string | null;
    setNumber?: number | null;
    blockPosition?: number | null;
    blockSize?: number | null;
};

type FallbackTrackInput = {
    spotifyId: string;
    currentRank: number;
    trackName: string;
    artistName: string;

    normalizedCtx: NormalizedPlaybackContext;
};

export function buildFallbackPlaybackTrack({
                                               spotifyId,
                                               currentRank,
                                               trackName,
                                               artistName,
                                               normalizedCtx
                                           }: FallbackTrackInput) {

    return {
        id: null,

        rankingId: null,

        rank: currentRank,

        trackName,
        artistName,

        spotifyTrackId: spotifyId,

        collection_name:
            normalizedCtx.collection_name ?? null,

        collection_group_name:
            normalizedCtx.collection_group_name ?? null,

        collection_slug:
            normalizedCtx.collection_slug ?? null,

        collection_group_slug:
            normalizedCtx.collection_group_slug ?? null,

        intro:
            normalizedCtx.intro ?? null,

        detail:
            normalizedCtx.detail ?? null,

        artistText:
            normalizedCtx.artistText ?? null,

        artistArtwork:
            normalizedCtx.artist_artwork ?? null,

        textsByLanguage:
            normalizedCtx.textsByLanguage ?? null,

        decadeSlug:
            normalizedCtx.decade_slug ?? null,

        decadeName:
            normalizedCtx.decade_name ?? null,

        genreSlug:
            normalizedCtx.genre_slug ?? null,

        genreName:
            normalizedCtx.genre_name ?? null,

        yearReleased: null,

        albumArtwork:
            normalizedCtx.album_artwork ?? null,

        setNumber:
        normalizedCtx.setNumber,

        blockPosition:
        normalizedCtx.blockPosition,

        blockSize:
        normalizedCtx.blockSize,
    };
}

export function buildEnrichedPlaybackTrack({
                                               baseTrack,
                                               normalizedCtx
                                           }: {
    baseTrack: PlaybackBaseTrack;
    normalizedCtx: NormalizedPlaybackContext;
}) {
    return {
        ...baseTrack,

        collection_name:
            normalizedCtx.collection_name ?? baseTrack.collection_name,

        collection_group_name:
            normalizedCtx.collection_group_name ?? baseTrack.collection_group_name,

        collection_slug:
            normalizedCtx.collection_slug ?? null,

        collection_group_slug:
            normalizedCtx.collection_group_slug ?? null,

        intro:
            normalizedCtx.intro ?? baseTrack.intro,

        detail:
            normalizedCtx.detail ?? baseTrack.detail,

        artistText:
            normalizedCtx.artistText ?? baseTrack.artistText,

        artistArtwork:
            normalizedCtx.artist_artwork ?? baseTrack.artistArtwork,

        textsByLanguage:
            normalizedCtx.textsByLanguage ?? baseTrack.textsByLanguage,

        decadeSlug:
            normalizedCtx.decade_slug ?? baseTrack.decadeSlug,

        decadeName:
            normalizedCtx.decade_name ?? baseTrack.decadeName,

        genreSlug:
            normalizedCtx.genre_slug ?? baseTrack.genreSlug,

        genreName:
            normalizedCtx.genre_name ?? baseTrack.genreName,

        setNumber:
            normalizedCtx.setNumber ?? baseTrack.setNumber,

        blockPosition:
            normalizedCtx.blockPosition ?? baseTrack.blockPosition,

        blockSize:
            normalizedCtx.blockSize ?? baseTrack.blockSize,
    };
}
