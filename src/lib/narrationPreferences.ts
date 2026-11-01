import type {DetailLength, VoicePart} from './types/playback';
export const NARRATION_STORAGE_KEY = 'topspot_narration_preferences_v1';
export type NarrationPreferences = {voices: VoicePart[]; detailLength: DetailLength; spotlightBioLength?: DetailLength};
const length = (value: unknown, fallback: DetailLength): DetailLength =>
    value === 'off' || value === 'short' || value === 'long' ? value : fallback;
export function normalizeNarrationPreferences(value: Partial<NarrationPreferences>): NarrationPreferences {
    const detailLength = length(value.detailLength, 'short');
    const voices: VoicePart[] = [];
    if (value.voices?.includes('intro')) voices.push('intro');
    if (detailLength !== 'off') voices.push('detail');
    if (value.voices?.includes('artist')) voices.push('artist');
    return {voices, detailLength, spotlightBioLength: length(value.spotlightBioLength, 'short')};
}
export function readNarrationPreferences(storage: Pick<Storage, 'getItem'>): NarrationPreferences {
    try {
        const saved = JSON.parse(storage.getItem(NARRATION_STORAGE_KEY) ?? 'null');
        if (saved && typeof saved === 'object' && Array.isArray(saved.voices)) {
            return normalizeNarrationPreferences(saved);
        }
    } catch { /* Recover from unavailable storage or invalid saved JSON. */ }
    let detailLength: DetailLength = 'short';
    try { detailLength = length(storage.getItem('topspot_detail_length'), 'short'); } catch { /* Defaults. */ }
    return normalizeNarrationPreferences({voices: ['intro'], detailLength});
}
