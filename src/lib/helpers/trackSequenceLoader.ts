// src/lib/helpers/trackSequenceLoader.ts

import type { SelectionState } from '$lib/stores/selection';
import { normalizeTrack, type LoadedTrack } from '$lib/utils/normalizeTrack';

import {
	loadCollectionFromSupabase,
	type CollectionResponse,
	type SequenceItem
} from '$lib/api/supabaseLoader';

import { loadDecadeGenrePauseMode } from '$lib/api/playbackPauseLoader';

// Svelte 5 reactive Map (silences ESLint warnings)
import { SvelteMap } from 'svelte/reactivity';

// ------------------------------------------------------------
// Extend SequenceItem with all optional fields received
// ------------------------------------------------------------
type SequenceItemExtended = SequenceItem & {
	info?: string | null;
	intro?: string | null;

	detail?: string | null;
	detail_text?: string | null;

	artistDescription?: string | null;
	artist_detail?: string | null;

	artistImage?: string | null;
	artist_image?: string | null;
	artist_artwork?: string | null;
	artistArtwork?: string | null;
};

// ------------------------------------------------------------
// Local normalization helper
// ------------------------------------------------------------
function preNormalizeRow(t: SequenceItemExtended): SequenceItemExtended {
	return {
		...t,
		intro: t.intro ?? t.info ?? null,
		detail: t.detail ?? t.detail_text ?? null,
		artistDescription: t.artistDescription ?? t.artist_detail ?? null,
		artistImage:
			t.artistImage ??
			t.artist_image ??
			t.artist_artwork ??
			t.artistArtwork ??
			null
	};
}

// ------------------------------------------------------------
// Map + filter AFTER normalization
// ------------------------------------------------------------
function mapItemsToTracks(
	rows: SequenceItemExtended[],
	startRank: number,
	endRank: number
): LoadedTrack[] {
	const result: LoadedTrack[] = [];

	for (const raw of rows) {
		const r = raw.rank ?? 0;
		if (r < startRank || r > endRank) continue;

		const row = preNormalizeRow(raw);
		result.push(normalizeTrack(row));
	}

	return result.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

// ------------------------------------------------------------
// SMALL INTERNAL CACHE
// ------------------------------------------------------------
const loaderCache = new SvelteMap<string, LoadedTrack[]>();

function mkCacheKey(sel: SelectionState): string {
	if (sel.mode === 'collection') {
		const slug =
			sel.context?.collection_slug ??
			sel.context?.collectionId ??
			sel.context?.collection ??
			'';
		return `c:${slug}:${sel.language}:${sel.startRank}:${sel.endRank}`;
	}

	const decade = sel.context?.decade ?? '';
	const genre = sel.context?.genre ?? '';
	return `dg:${decade}:${genre}:${sel.language}:${sel.startRank}:${sel.endRank}`;
}

// ------------------------------------------------------------
// MAIN LOADER
// ------------------------------------------------------------
export async function loadTrackSequence(
	sel: SelectionState
): Promise<LoadedTrack[]> {
	if (!sel?.mode || !sel.context) {
		console.warn('⚠ loadTrackSequence called with invalid selection:', sel);
		return [];
	}

	const ctx = sel.context as NonNullable<SelectionState['context']>;
	const key = mkCacheKey(sel);

	// Cache hit
	if (loaderCache.has(key)) {
		return loaderCache.get(key)!;
	}

	const { startRank, endRank } = sel;
	const tts_language = (sel.language ?? 'en') as
		| 'en'
		| 'es'
		| 'ptbr'
		| 'pt-BR';

	try {
		// --------------------------------------------------------
		// COLLECTION MODE (unchanged)
		// --------------------------------------------------------
		if (sel.mode === 'collection') {
			const slug =
				ctx.collection_slug ??
				ctx.collectionId ??
				ctx.collection ??
				'';

			if (!slug) {
				console.warn('⚠ No slug found in collection context:', ctx);
				return [];
			}

			const data: CollectionResponse =
				await loadCollectionFromSupabase({
					slug,
					tts_language
				});

			const rows: SequenceItemExtended[] =
				data.tracks ??
				data.rankings ??
				(data.rows as SequenceItemExtended[]) ??
				[];

			if (!rows.length) return [];

			const mapped = mapItemsToTracks(rows, startRank, endRank);
			loaderCache.set(key, mapped);
			return mapped;
		}

		// --------------------------------------------------------
		// DECADE / GENRE MODE (Pause Mode via FastAPI)
		// --------------------------------------------------------
		const decade = ctx.decade ?? '';
		const genre = ctx.genre ?? '';

		if (!decade || !genre) return [];

		const data = await loadDecadeGenrePauseMode({
			decade,
			genre
		});

		// backend guarantees `tracks`
		const rows: SequenceItemExtended[] = data.tracks ?? [];

		if (!rows.length) return [];

		const mapped = mapItemsToTracks(rows, startRank, endRank);
		loaderCache.set(key, mapped);
		return mapped;
	} catch (err) {
		console.error('❌ loadTrackSequence failed:', err);
		return [];
	}
}

// ------------------------------------------------------------
// FAST FIRST-TRACK LOADER (UI-only)
// ------------------------------------------------------------
export async function loadFirstTrack(
	sel: SelectionState
): Promise<LoadedTrack | null> {
	const tracks = await loadTrackSequence(sel);
	return tracks[0] ?? null;
}
