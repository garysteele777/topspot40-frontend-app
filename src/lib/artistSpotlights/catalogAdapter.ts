import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
import type {
    ArtistGenreOption,
    ArtistSpotlightCategory,
    ArtistSpotlightItem,
    ArtistStoryInfo,
    ArtistTrackItem
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

type ArtistSpotlightRequest = {
    genreId: string;
    featured: boolean;
    minTracks: number;
    maxTracks?: number | null;
};

function stringProperty(value: unknown, key: string): string | null {
    if (!value || typeof value !== 'object') return null;
    const property = (value as Record<string, unknown>)[key];
    return typeof property === 'string' ? property : null;
}

function titleCaseGenreLabel(label: string): string {
    return label.replace(/\b[a-z]/g, character => character.toUpperCase());
}


export async function loadArtistSpotlightGenres(): Promise<ArtistGenreOption[]> {
    const catalog = await loadCatalogOnce();

    return (Array.isArray(catalog.genres) ? catalog.genres : [])
        .map((genre): ArtistGenreOption | null => {
            const id =
                stringProperty(genre, 'slug') ??
                stringProperty(genre, 'id') ??
                stringProperty(genre, 'value') ??
                stringProperty(genre, 'key');
            const label =
                stringProperty(genre, 'label') ??
                stringProperty(genre, 'name') ??
                id;

            return id && label ? {id, label: titleCaseGenreLabel(label)} : null;
        })
        .filter((genre): genre is ArtistGenreOption => genre !== null && genre.id !== 'tv_themes');
}

export async function fetchArtistSpotlights({
    genreId,
    featured,
    minTracks,
    maxTracks = null
}: ArtistSpotlightRequest): Promise<ArtistSpotlightItem[]> {
    const query = new URLSearchParams({
        genre: genreId,
        min_tracks: String(minTracks),
        featured_only: String(featured)
    });

    if (maxTracks !== null) query.set('max_tracks', String(maxTracks));

    const response = await fetch(
        `${API_BASE}/artist-spotlight/artists-by-genre?${query.toString()}`
    );

    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const data: unknown = await response.json();
    return Array.isArray(data) ? data as ArtistSpotlightItem[] : [];
}

export function requestForArtistCategory(
    genreId: string,
    category: ArtistSpotlightCategory
): ArtistSpotlightRequest {
    if (category === 'single') {
        return {genreId, featured: false, minTracks: 1, maxTracks: 1};
    }

    if (category === 'other') {
        return {genreId, featured: false, minTracks: 2, maxTracks: null};
    }

    return {genreId, featured: true, minTracks: 2, maxTracks: null};
}

export async function loadArtistSpotlightsForCategory(
    genreId: string,
    category: ArtistSpotlightCategory
): Promise<ArtistSpotlightItem[]> {
    return fetchArtistSpotlights(requestForArtistCategory(genreId, category));
}

export async function fetchArtistTracks(artistId: number): Promise<ArtistTrackItem[]> {
    const response = await fetch(
        `${API_BASE}/artist-spotlight/artist-tracks?artist_id=${encodeURIComponent(artistId)}`
    );

    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const data: unknown = await response.json();
    return Array.isArray(data) ? data as ArtistTrackItem[] : [];
}

export async function fetchArtistStory(
    artistId: number,
    language: string,
    allowMissing = false
): Promise<ArtistStoryInfo | null> {
    const response = await fetch(
        `${API_BASE}/artist-spotlight/artist-story` +
        `?artist_id=${encodeURIComponent(artistId)}` +
        `&language=${encodeURIComponent(language)}`
    );

    if (!response.ok) {
        if (allowMissing) return null;
        throw new Error(`Request failed: ${response.status}`);
    }
    return await response.json() as ArtistStoryInfo;
}

export function titleCaseArtistName(name: string): string {
    return name.replace(/\b\w/g, character => character.toUpperCase());
}
