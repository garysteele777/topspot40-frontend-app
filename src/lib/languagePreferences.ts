import type {Language} from '$lib/types/playback';

export const LANGUAGE_PREFERENCE_KEY = 'topspot_language';
export const TTS_LANGUAGE_PREFERENCE_KEY = 'tts_language';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function isLanguagePreference(value: unknown): value is Language {
    return value === 'en' || value === 'es' || value === 'ptbr';
}

export function normalizeLanguagePreference(
    value: unknown,
    fallback: Language = 'en'
): Language {
    return isLanguagePreference(value) ? value : fallback;
}

export function normalizeSelectedLanguages(
    values: readonly unknown[]
): Language[] {
    return [...new Set(values.map(value => normalizeLanguagePreference(value)))];
}

export function readStoredLanguagePreference(
    storage: Pick<Storage, 'getItem'> | null =
        typeof window !== 'undefined' ? localStorage : null
): Language | null {
    const value = storage?.getItem(LANGUAGE_PREFERENCE_KEY) ?? null;
    return isLanguagePreference(value) ? value : null;
}

export function readLanguagePreference(
    fallback: Language = 'en',
    storage: Pick<Storage, 'getItem'> | null =
        typeof window !== 'undefined' ? localStorage : null
): Language {
    return normalizeLanguagePreference(
        storage?.getItem(LANGUAGE_PREFERENCE_KEY) ?? null,
        fallback
    );
}

export function writeLanguagePreference(
    language: Language,
    storage: StorageLike | null =
        typeof window !== 'undefined' ? localStorage : null
): void {
    if (!storage) return;

    storage.setItem(LANGUAGE_PREFERENCE_KEY, language);
    storage.setItem(TTS_LANGUAGE_PREFERENCE_KEY, language);
}
