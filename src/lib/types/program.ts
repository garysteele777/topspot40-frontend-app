/* -----------------------
 * Program Types (SOURCE OF TRUTH)
 * --------------------- */

export type PlaybackProgramType =
    | 'DG'
    | 'COL'
    | 'FAV_DG'
    | 'FAV_COL'
    | 'RADIO_DG'
    | 'RADIO_COL';


/* -----------------------
 * Helpers (optional but powerful)
 * --------------------- */

export const PROGRAM_TYPES = {
    DG: 'DG',
    COL: 'COL',
    FAV_DG: 'FAV_DG',
    FAV_COL: 'FAV_COL',
    RADIO_DG: 'RADIO_DG',
    RADIO_COL: 'RADIO_COL'
} as const;


/** Type guard (safe runtime checks) */
export function isPlaybackProgramType(
    value: unknown
): value is PlaybackProgramType {
    return typeof value === 'string' &&
        Object.values(PROGRAM_TYPES).includes(value as PlaybackProgramType);
}

export function isRadioProgram(
    type: PlaybackProgramType | undefined
): boolean {
    return type === 'RADIO_DG' || type === 'RADIO_COL';
}