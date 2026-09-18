export const ARTIST_RADIO_GENRES = [
    'country', 'pop', 'rock', 'rnb_soul', 'latin_global', 'blues_jazz', 'folk_acoustic'
] as const;

export type ArtistRadioGenreSlug = typeof ARTIST_RADIO_GENRES[number];

export const ARTIST_RADIO_GENRE_LABELS: Record<ArtistRadioGenreSlug, string> = {
    country: 'Country', pop: 'Pop', rock: 'Rock', rnb_soul: 'R&B / Soul',
    latin_global: 'Latin / Global', blues_jazz: 'Blues / Jazz', folk_acoustic: 'Folk / Acoustic'
};

export function normalizeArtistRadioGenres(values: readonly string[]): ArtistRadioGenreSlug[] {
    const incoming = new Set(values);
    return ARTIST_RADIO_GENRES.filter(value => incoming.has(value));
}
