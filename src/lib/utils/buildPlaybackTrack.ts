// src/lib/utils/buildPlaybackTrack.ts

import type {NormalizedPlaybackContext} from '$lib/utils/normalizePlaybackContext';

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