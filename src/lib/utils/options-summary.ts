// src/lib/utils/options-summary.ts

type VoicePart = 'intro' | 'detail' | 'artist';
type ModeType = 'decade_genre' | 'collection';

export function summarizeVoices(parts: VoicePart[]): string {
	const sorted = [...parts].sort();

	if (sorted.length === 0) return 'No narration';
	if (sorted.length === 3) return 'Intro + Detail + Artist';

	if (sorted.length === 2) {
		if (!sorted.includes('artist')) return 'Intro + Detail';
		if (!sorted.includes('detail')) return 'Intro + Artist';
		return 'Detail + Artist';
	}

	switch (sorted[0]) {
		case 'intro': return 'Intro only';
		case 'detail': return 'Detail only';
		default: return 'Artist notes only';
	}
}

export function summarizeSelection(
	mode: ModeType,
	decades: string[],
	genres: string[],
	collections: string[]
): string {
	if (mode === 'decade_genre') {
		const decadePart =
			decades.length === 0 ? 'No decade'
			: decades.length === 1 ? decades[0]
			: `${decades.length} decades`;

		const genrePart =
			genres.length === 0 ? 'No genre'
			: genres.length === 1 ? genres[0]
			: `${genres.length} genres`;

		return `${decadePart} • ${genrePart}`;
	}

	if (!collections.length) return 'No collection selected';
	return collections.length === 1 ? collections[0] : `${collections.length} collections`;
}
