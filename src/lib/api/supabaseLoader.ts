// src/lib/api/supabaseLoader.ts
// ------------------------------------------------------------
// FINAL + CORRECT — Matches backend routes EXACTLY
// ------------------------------------------------------------

export type SequenceItem = {
	rank: number;
	trackName?: string;
	track_name?: string;
	artistName?: string;
	artist_name?: string;
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
	tts_language?: 'en' | 'es' | 'ptbr' | 'pt-BR';
}): Promise<DecadeGenreResponse> {
	const { decade, genre, tts_language = 'en' } = payload;

	const url = new URL('/supabase/load-decade-genre-data', API_BASE);
	url.searchParams.set('decade', decade);
	url.searchParams.set('genre', genre);
	url.searchParams.set('tts_language', tts_language);

	return getJson<DecadeGenreResponse>(url.toString());
}

// ------------------------------------------------------------
// COLLECTION LOADER (REAL BACKEND ROUTE)
// ------------------------------------------------------------
export async function loadCollectionFromSupabase(payload: {
	slug: string;
	tts_language?: 'en' | 'es' | 'ptbr' | 'pt-BR';
}): Promise<CollectionResponse> {
	const { slug, tts_language = 'en' } = payload;

	const url = new URL(`/supabase/load-collection-data/${slug}`, API_BASE);
	url.searchParams.set('tts_language', tts_language);

	return getJson<CollectionResponse>(url.toString());
}
