// src/lib/utils/normalizeTrack.ts

export type AudioKey = { bucket: string; key: string };
export type LoadedTrack = {
    id?: number | string | null;

    rankingId?: number | null;   // ⭐ NEW

    rank: number;

    trackName: string;
    artistName: string;

    albumName?: string | null;
    albumArtwork?: string | null;
    artistArtwork?: string | null;

    yearReleased?: number | null;

    durationMs?: number | null;

    // 👇 REQUIRED for CarMode.player.ts
    durationSeconds?: number | null;

    spotifyTrackId?: string | null;

    intro?: string | null;
    detail?: string | null;
    artistDescription?: string | null;

    introKey?: AudioKey | null;
    detailKey?: AudioKey | null;
    artistKey?: AudioKey | null;

    // ─────────────────────────────
    // ⭐ Favorites support (new)
    // ─────────────────────────────
    sourceRank?: number | null;

    decadeSlug?: string | null;
    decadeName?: string | null;

    genreSlug?: string | null;
    genreName?: string | null;
};


type RawTrack = Record<string, unknown>;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const asString = (v: unknown, fallback: string | null = null): string | null =>
    typeof v === 'string' ? v : fallback;

const asNumber = (v: unknown, fallback: number | null = null): number | null => {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
    }
    return fallback;
};

const asAudioKey = (v: unknown): AudioKey | null => {
    if (!isObject(v)) return null;
    const bucket = asString(v.bucket);
    const key = asString(v.key);
    return bucket && key ? {bucket, key} : null;
};


function firstDefined(raw: RawTrack, keys: string[]): unknown {
    for (const k of keys) {
        const v = raw[k];
        if (v !== undefined && v !== null) return v;
    }
    return null;
}

// ─────────────────────────────────────────────
// Normalizer handles BOTH Decade/Genre + Collections
// snake_case / camelCase variations.
// ─────────────────────────────────────────────
export function normalizeTrack(raw: RawTrack): LoadedTrack {
    const idVal = firstDefined(raw, ['id', 'trackId', 'track_id']);
    const rankingIdVal = firstDefined(raw, [
        'rankingId',
        'ranking_id',
        'track_ranking_id'
    ]);

    const rankVal = firstDefined(raw, ['rank', 'ranking']);


    const trackNameVal = firstDefined(raw, ['trackName', 'track_name', 'title']);
    const artistNameVal = firstDefined(raw, ['artistName', 'artist_name', 'artist_display_name', 'artist', 'track_artist']);

    const albumNameVal = firstDefined(raw, ['albumName', 'album_name']);
    const albumArtworkVal = firstDefined(raw, ['albumArtwork', 'album_artwork', 'album_image_url']);

    const yearReleasedVal = firstDefined(raw, ['yearReleased', 'year_released', 'release_year']);

    const durationMsVal = firstDefined(raw, ['durationMs', 'duration_ms']);
    const spotifyTrackIdVal = firstDefined(raw, ['spotifyTrackId', 'spotify_id', 'track_spotify_id']);

    const introVal = firstDefined(raw, ['intro']);
    const detailVal = firstDefined(raw, ['detail', 'detail_text']);
    const artistDescVal = firstDefined(raw, ['artistDescription', 'artist_description']);

    const introKeyVal = firstDefined(raw, ['introKey']);
    const detailKeyVal = firstDefined(raw, ['detailKey']);
    const artistKeyVal = firstDefined(raw, ['artistKey']);
    const artistArtworkVal = firstDefined(raw, ['artistArtwork', 'artist_artwork']);


    return {
        id: typeof idVal === 'string' || typeof idVal === 'number' ? idVal : null,
        rankingId: asNumber(rankingIdVal, null),

        rank: asNumber(rankVal, 0) ?? 0,

        trackName: asString(trackNameVal, '') ?? '',
        artistName: asString(artistNameVal, 'Unknown Artist') ?? 'Unknown Artist',

        albumName: asString(albumNameVal, null),
        albumArtwork: asString(albumArtworkVal, null),
        artistArtwork: asString(artistArtworkVal, null),

        yearReleased: asNumber(yearReleasedVal, null),

        durationMs: asNumber(durationMsVal, null),

        durationSeconds: asNumber(durationMsVal, null)
            ? Math.round((asNumber(durationMsVal, null) ?? 0) / 1000)
            : null,

        spotifyTrackId: asString(spotifyTrackIdVal, null),

        intro: asString(introVal, null),
        detail: asString(detailVal, null),
        artistDescription: asString(artistDescVal, null),

        introKey: asAudioKey(introKeyVal),
        detailKey: asAudioKey(detailKeyVal),
        artistKey: asAudioKey(artistKeyVal),
    };

}
