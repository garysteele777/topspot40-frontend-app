// src/lib/types/program.ts

// ─────────────────────────────────────────────
// Playback program / experience types
// ─────────────────────────────────────────────
//
// PlaybackProgramType identifies the user-facing experience.
// This is what distinguishes Radio vs Program behavior.
//
// DG        = Nostalgia Programs
// RADIO_DG  = Nostalgia Radio
//
// COL       = Collections Programs
// RADIO_COL = Collections Radio
//
// FAV_DG    = Favorite Nostalgia tracks
// FAV_COL   = Favorite Collection tracks
//
// ARTIST    = Artist Spotlight

export type PlaybackProgramType =
    | 'DG'
    | 'COL'
    | 'FAV_DG'
    | 'FAV_COL'
    | 'RADIO_DG'
    | 'RADIO_COL'
    | 'ARTIST'
    | 'RADIO_ARTIST';

export const PROGRAM_TYPES = {
    DG: 'DG',
    COL: 'COL',
    FAV_DG: 'FAV_DG',
    FAV_COL: 'FAV_COL',
    RADIO_DG: 'RADIO_DG',
    RADIO_COL: 'RADIO_COL',
    ARTIST: 'ARTIST',
    RADIO_ARTIST: 'RADIO_ARTIST'
} as const;

/**
 * Runtime type guard for safely checking unknown values.
 */
export function isPlaybackProgramType(
    value: unknown
): value is PlaybackProgramType {
    return (
        typeof value === 'string' &&
        Object.values(PROGRAM_TYPES).includes(value as PlaybackProgramType)
    );
}

/**
 * True when the program type represents a radio-style experience.
 */
export function isRadioProgram(
    type: PlaybackProgramType | undefined
): boolean {
    return (
    type === 'RADIO_DG' ||
    type === 'RADIO_COL' ||
    type === 'RADIO_ARTIST'
);
}