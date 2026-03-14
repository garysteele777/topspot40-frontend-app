// src/lib/api/supabaseLoader.ts
// ------------------------------------------------------------
// FINAL + CORRECT — Matches backend routes EXACTLY
// ------------------------------------------------------------

export type SequenceItem = {
    rank: number;

    rankingId?: number;
    ranking_id?: number;

    trackName?: string;
    track_name?: string;

    artistName?: string;
    artist_name?: string;

    spotifyTrackId?: string;
    spotify_track_id?: string;

    decadeSlug?: string;
    decade_slug?: string;

    genreSlug?: string;
    genre_slug?: string;
};

export type DecadeGenreResponse = {
    rankings?: SequenceItem[] | null;
    tracks?: SequenceItem[] | null;
    rows?: SequenceItem[] | null;
};

export type CollectionResponse = {
    rankings?: SequenceItem[] | null;
    tracks?: SequenceItem[] | null;
    rows?: SequenceItem[] | null;
};

// ------------------------------------------------------------
// API Base URL
// ------------------------------------------------------------
const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

// ------------------------------------------------------------
// Shared GET helper
// ------------------------------------------------------------
async function getJson<T>(url: string): Promise<T> {
    console.log('🔗 FETCH:', url);

    const res = await fetch(url);
    if (!res.ok) {
        const txt = await res.text();
        console.error('❌ Supabase loader error:', res.status, txt);
        throw new Error(`Supabase loader failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
}

// ------------------------------------------------------------
// DECADE + GENRE LOADER  (REAL BACKEND ROUTE)
// ------------------------------------------------------------
export async function loadDecadeGenreFromSupabase(payload: {
    decade: string;
    genre: string;
}): Promise<DecadeGenreResponse> {
    const {decade, genre} = payload;

    const url = new URL('/supabase/decade-genre/get-sequence', API_BASE);
    url.searchParams.set('decade', decade);
    url.searchParams.set('genre', genre);

    return getJson<DecadeGenreResponse>(url.toString());
}

// ------------------------------------------------------------
// COLLECTION LOADER  (REAL BACKEND ROUTE)
// ------------------------------------------------------------
export async function loadCollectionFromSupabase(payload: {
    slug: string;
}): Promise<CollectionResponse> {
    const {slug} = payload;

    const url = new URL('/supabase/collections/get-sequence', API_BASE);
    url.searchParams.set('collection_slug', slug);

    return getJson<CollectionResponse>(url.toString());
}
