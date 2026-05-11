// src/lib/utils/normalizePlaybackContext.ts

export type NormalizedPlaybackContext = {
    intro?: string | null;
    detail?: string | null;
    artistText?: string | null;

    textsByLanguage?: Record<
        string,
        {
            intro?: string | null;
            detail?: string | null;
            artist?: string | null;
        }
    >;

    durationMs?: number | null;

    collection_name?: string | null;
    collection_group_name?: string | null;

    collection_slug?: string | null;
    collection_group_slug?: string | null;

    decade_slug?: string | null;
    decade_name?: string | null;

    genre_slug?: string | null;
    genre_name?: string | null;

    album_artwork?: string | null;
    artist_artwork?: string | null;

    setNumber?: number | null;
    blockPosition?: number | null;
    blockSize?: number | null;
};

export function normalizePlaybackContext(
    ctx: Record<string, unknown> | null | undefined
): NormalizedPlaybackContext {

    if (!ctx) return {};

    return {
        intro:
            (ctx.intro as string | null) ?? null,

        detail:
            (ctx.detail as string | null) ??
            (ctx.detail_text as string | null) ??
            null,

        artistText:
            (ctx.artistText as string | null) ??
            (ctx.artist_text as string | null) ??
            null,

        textsByLanguage:
            (ctx.textsByLanguage as NormalizedPlaybackContext['textsByLanguage']) ??
            {},

        durationMs:
            typeof ctx.durationMs === 'number'
                ? ctx.durationMs
                : typeof ctx.duration_ms === 'number'
                    ? ctx.duration_ms
                    : typeof ctx.duration_seconds === 'number'
                        ? Math.round(ctx.duration_seconds * 1000)
                        : null,

        collection_name:
            (ctx.collection_name as string | null) ?? null,

        collection_group_name:
            (ctx.collection_group_name as string | null) ?? null,

        collection_slug:
            (ctx.collection_slug as string | null) ?? null,

        collection_group_slug:
            (ctx.collection_group_slug as string | null) ?? null,

        decade_slug:
            (ctx.decade_slug as string | null) ?? null,

        decade_name:
            (ctx.decade_name as string | null) ?? null,

        genre_slug:
            (ctx.genre_slug as string | null) ?? null,

        genre_name:
            (ctx.genre_name as string | null) ?? null,

        album_artwork:
            (ctx.album_artwork as string | null) ?? null,

        artist_artwork:
            (ctx.artist_artwork as string | null) ?? null,

        setNumber:
            typeof ctx.set_number === 'number'
                ? ctx.set_number
                : null,

        blockPosition:
            typeof ctx.block_position === 'number'
                ? ctx.block_position
                : null,

        blockSize:
            typeof ctx.block_size === 'number'
                ? ctx.block_size
                : null,
    };
}