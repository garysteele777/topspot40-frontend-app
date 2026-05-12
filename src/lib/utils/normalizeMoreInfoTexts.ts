// src/lib/utils/normalizeMoreInfoTexts.ts

export type MoreInfoLanguageTexts = {
    intro?: string | null;
    detail?: string | null;
    artist?: string | null;
};

export type MoreInfoTextsByLanguage = Record<string, MoreInfoLanguageTexts>;

function asText(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0
        ? value
        : null;
}

export function normalizeMoreInfoTexts(
    source: Record<string, unknown> | null | undefined
): MoreInfoTextsByLanguage {
    if (!source) return {};

    const existing =
        source.textsByLanguage ??
        source.texts_by_language;

    if (existing && typeof existing === 'object') {
        return existing as MoreInfoTextsByLanguage;
    }

    const en: MoreInfoLanguageTexts = {
        intro: asText(source.intro),
        detail: asText(source.detail ?? source.detail_text),
        artist: asText(source.artistText ?? source.artist_text ?? source.artistDescription ?? source.artist_description)
    };

    const result: MoreInfoTextsByLanguage = {};

    if (en.intro || en.detail || en.artist) {
        result.en = en;
    }

    return result;
}