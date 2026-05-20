// src/lib/types/program.ts

// ─────────────────────────────────────────────
// Playback program / experience types
// ─────────────────────────────────────────────
//
// PlaybackProgramType identifies the USER EXPERIENCE.
//
// PROGRAM_*  = interactive playback experience
// RADIO_*    = continuous DJ/radio experience
// FAVORITES_* = favorites-based playback
//
// Engines underneath may still use:
// - decade_genre
// - collection
// - artist
//
// Examples:
//
// PROGRAM_DG       = Nostalgia Programs
// RADIO_DG         = Nostalgia Radio
//
// PROGRAM_COL      = Collections Programs
// RADIO_COL        = Collections Radio
//
// PROGRAM_ARTIST   = Artist Spotlight
// RADIO_ARTIST     = Artist Spotlight Radio
//

export const PROGRAM_TYPES = {
    PROGRAM_DG: 'PROGRAM_DG',
    PROGRAM_COL: 'PROGRAM_COL',

    FAVORITES_DG: 'FAVORITES_DG',
    FAVORITES_COL: 'FAVORITES_COL',

    RADIO_DG: 'RADIO_DG',
    RADIO_COL: 'RADIO_COL',

    PROGRAM_ARTIST: 'PROGRAM_ARTIST',
    RADIO_ARTIST: 'RADIO_ARTIST'
} as const;

// ─────────────────────────────────────────────
// Derived union type
// ─────────────────────────────────────────────

export type PlaybackProgramType =
    (typeof PROGRAM_TYPES)[keyof typeof PROGRAM_TYPES];

// ─────────────────────────────────────────────
// Cached values for runtime validation
// ─────────────────────────────────────────────

const PROGRAM_TYPE_VALUES: PlaybackProgramType[] =
    Object.values(PROGRAM_TYPES);

// ─────────────────────────────────────────────
// Runtime type guard
// Safely validates unknown values
// (localStorage, backend payloads, etc.)
// ─────────────────────────────────────────────

export function isPlaybackProgramType(
    value: unknown
): value is PlaybackProgramType {
    return (
        typeof value === 'string' &&
        PROGRAM_TYPE_VALUES.includes(
            value as PlaybackProgramType
        )
    );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

export function isRadioProgram(
    type: PlaybackProgramType | undefined
): boolean {
    return (
        type === PROGRAM_TYPES.RADIO_DG ||
        type === PROGRAM_TYPES.RADIO_COL ||
        type === PROGRAM_TYPES.RADIO_ARTIST
    );
}

export function isProgramPlayback(
    type: PlaybackProgramType | undefined
): boolean {
    return (
        type === PROGRAM_TYPES.PROGRAM_DG ||
        type === PROGRAM_TYPES.PROGRAM_COL ||
        type === PROGRAM_TYPES.PROGRAM_ARTIST
    );
}

export function isFavoritesProgram(
    type: PlaybackProgramType | undefined
): boolean {
    return (
        type === PROGRAM_TYPES.FAVORITES_DG ||
        type === PROGRAM_TYPES.FAVORITES_COL
    );
}

// ─────────────────────────────────────────────
// Backward compatibility migration helper
// Converts old saved values into new values
// ─────────────────────────────────────────────

export function normalizeProgramType(
    value: string | undefined
): PlaybackProgramType | undefined {

    switch (value) {
        case 'DG':
            return PROGRAM_TYPES.PROGRAM_DG;

        case 'COL':
            return PROGRAM_TYPES.PROGRAM_COL;

        case 'ARTIST':
            return PROGRAM_TYPES.PROGRAM_ARTIST;

        case 'FAV_DG':
            return PROGRAM_TYPES.FAVORITES_DG;

        case 'FAV_COL':
            return PROGRAM_TYPES.FAVORITES_COL;

        default:
            return isPlaybackProgramType(value)
                ? value
                : undefined;
    }
}