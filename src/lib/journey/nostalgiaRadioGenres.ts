export const NOSTALGIA_RADIO_GENRES = [
    'country', 'pop', 'rock', 'rnb_soul', 'latin_global', 'blues_jazz', 'folk_acoustic', 'tv_themes'
] as const;

export type NostalgiaRadioGenreSlug = typeof NOSTALGIA_RADIO_GENRES[number];

export const NOSTALGIA_RADIO_GENRE_LABELS: Record<NostalgiaRadioGenreSlug, string> = {
    country: 'Country', pop: 'Pop', rock: 'Rock', rnb_soul: 'R&B / Soul',
    latin_global: 'Latin / Global', blues_jazz: 'Blues / Jazz',
    folk_acoustic: 'Folk / Acoustic', tv_themes: 'TV Themes'
};

export function isNostalgiaRadioGenreSlug(value: string): value is NostalgiaRadioGenreSlug {
    return (NOSTALGIA_RADIO_GENRES as readonly string[]).includes(value);
}

export function normalizeNostalgiaRadioGenres(values: readonly string[]): NostalgiaRadioGenreSlug[] {
    const seen = new Set<NostalgiaRadioGenreSlug>();
    for (const value of values) if (isNostalgiaRadioGenreSlug(value)) seen.add(value);
    return NOSTALGIA_RADIO_GENRES.filter(genre => seen.has(genre));
}

export function parseNostalgiaRadioGenres(value: string | null | undefined): NostalgiaRadioGenreSlug[] {
    return normalizeNostalgiaRadioGenres((value ?? '').split(','));
}

/** Null retains the legacy ALL station scope; a list is an explicit listener filter. */
export function selectedNostalgiaRadioGenres(savedGenres: string | undefined, legacyGenre: string | undefined): NostalgiaRadioGenreSlug[] | null {
    const parsed = parseNostalgiaRadioGenres(savedGenres);
    if (parsed.length > 0) return parsed;
    return legacyGenre && legacyGenre !== 'ALL' && isNostalgiaRadioGenreSlug(legacyGenre) ? [legacyGenre] : null;
}

export function serializeNostalgiaRadioGenres(values: readonly string[]): string {
    return normalizeNostalgiaRadioGenres(values).join(',');
}

export function isGeneratedNostalgiaRadioGenreAllowed(
    savedGenres: string | undefined,
    legacyGenre: string | undefined,
    generatedGenre: string | undefined
): boolean {
    const selected = selectedNostalgiaRadioGenres(savedGenres, legacyGenre);
    return selected === null || (generatedGenre !== undefined && selected.some(genre => genre === generatedGenre));
}

export function appendNostalgiaRadioGenres(params: URLSearchParams, genres: readonly NostalgiaRadioGenreSlug[] | null): void {
    if (!genres) return;
    for (const genre of genres) params.append('genres', genre);
}

export function nostalgiaRadioStationLabel(
    savedGenres: string | undefined,
    legacyGenre: string | undefined
): string {
    const selected = selectedNostalgiaRadioGenres(savedGenres, legacyGenre);
    if (selected === null || selected.length === NOSTALGIA_RADIO_GENRES.length) return 'ALL';
    if (selected.length > 1) return 'CUSTOM';
    return NOSTALGIA_RADIO_GENRE_LABELS[selected[0]];
}
