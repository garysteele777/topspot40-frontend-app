// src/lib/utils/options-reactive.ts

type ModeType = 'decade_genre' | 'collection';

export function computeModeLabel(mode: ModeType): string {
	return mode === 'decade_genre' ? 'Decade–Genre' : 'Collections';
}

export function computeRankLabel(startRank: number, endRank: number): string {
	return `Rank ${startRank}–${endRank}`;
}

export function canLaunchDecadeGenre(
	mode: ModeType,
	decades: string[],
	genres: string[]
): boolean {
	return mode === 'decade_genre' && decades.length > 0 && genres.length > 0;
}

export function canLaunchCollection(
	mode: ModeType,
	collections: string[]
): boolean {
	return mode === 'collection' && collections.length > 0;
}
