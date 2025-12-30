import type { DecadeOption, GenreOption } from './useCatalogLoader';

export type Language = 'en' | 'es' | 'pt';
export type VoicePart = 'intro' | 'detail' | 'artist';
export type PlaybackOrder = 'up' | 'down' | 'shuffle';
export type VoicePlayMode = 'before' | 'over';
export type PauseMode = 'pause' | 'continuous';
export type CategoryMode = 'single' | 'multiple';

export interface OptionsState {
	categoryMode: CategoryMode;
	language: Language;
	selectedVoices: VoicePart[];
	startRank: number;
	endRank: number;
	playbackOrder: PlaybackOrder;
	voicePlayMode: VoicePlayMode;
	pauseMode: PauseMode;
	decades: string[];
	genres: string[];
	collections: string[];
	activeGroup: 'decade_genre' | 'collection';
}

export function createDefaultState(): OptionsState {
	return {
		categoryMode: 'single',
		language: 'en',
		selectedVoices: ['intro'],
		startRank: 1,
		endRank: 40,
		playbackOrder: 'up',
		voicePlayMode: 'before',
		pauseMode: 'pause',
		decades: [],
		genres: [],
		collections: [],
		activeGroup: 'decade_genre'
	};
}

// ---- Utility helpers ----

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
		case 'intro':
			return 'Intro only';
		case 'detail':
			return 'Detail only';
		case 'artist':
			return 'Artist notes only';
		default:
			return 'Narration';
	}
}

export function summarizeSelection(
	activeGroup: 'decade_genre' | 'collection',
	decades: string[],
	genres: string[],
	collections: string[]
): string {
	if (activeGroup === 'decade_genre') {
		if (!decades.length && !genres.length) return 'No decade/genre selected';
		const decadePart =
			decades.length === 0 ? 'No decade' : decades.length === 1 ? decades[0] : `${decades.length} decades`;
		const genrePart =
			genres.length === 0 ? 'No genre' : genres.length === 1 ? genres[0] : `${genres.length} genres`;
		return `${decadePart} • ${genrePart}`;
	}

	if (!collections.length) return 'No collection selected';
	if (collections.length === 1) return collections[0];
	return `${collections.length} collections`;
}
