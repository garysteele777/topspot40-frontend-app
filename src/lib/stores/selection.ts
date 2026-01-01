import { writable } from 'svelte/store';

// ──────────────────────────────────────────
// Mode type (global)
// ──────────────────────────────────────────
export type Mode = 'decade_genre' | 'collection' | null;

// ─────────────── Extra Car-Mode Settings ───────────────
export type PlaybackOrder = 'up' | 'down' | 'shuffle';
export type VoicePlayMode = 'before' | 'over';
export type PauseMode = 'pause' | 'continuous';
export type CategoryMode = 'single' | 'multiple';

// ──────────────────────────────────────────
// Track Model
// ──────────────────────────────────────────
export interface LoadedTrack {
	id?: number | string;
	rank: number;
	trackId?: number;
	trackName: string;
	artistName: string;
	albumArtwork?: string;
	durationMs?: number;
	yearReleased?: number;

	spotifyTrackId?: string;
	albumName?: string;

	intro?: string;
	detail?: string;
	artistDescription?: string;
}

// ──────────────────────────────────────────
// Selection Model
// ──────────────────────────────────────────
export interface SelectionState {
	mode: Mode;
	language: string;
	context: Record<string, string> | null;

	startRank: number;
	endRank: number;

	// Narration / Audio Toggles
	playIntro: boolean;
	playDetail: boolean;
	playArtistDescription: boolean;

	textIntro: boolean;
	textDetail: boolean;
	textArtistDescription: boolean;

	// Car-Mode Settings
	voices: string[]; // ['intro'], ['intro','detail'], etc.
	playbackOrder: PlaybackOrder; // 'up' | 'down' | 'shuffle'
	voicePlayMode: VoicePlayMode; // 'before' | 'over'
	pauseMode: PauseMode; // 'pause' | 'continuous'
	categoryMode: CategoryMode; // 'single' | 'multiple'
}

// ──────────────────────────────────────────
// Default values
// ──────────────────────────────────────────
const defaultSelection: SelectionState = {
	mode: null,
	language: 'en',
	context: null,
	startRank: 1,
	endRank: 40,

	playIntro: true,
	playDetail: false,
	playArtistDescription: false,

	textIntro: true,
	textDetail: false,
	textArtistDescription: false,

	voices: ['intro'],
	playbackOrder: 'up',
	voicePlayMode: 'before',
	pauseMode: 'pause',
	categoryMode: 'single'
};

// ──────────────────────────────────────────
// Load from sessionStorage
// ──────────────────────────────────────────
function loadInitial(): SelectionState {
	try {
		const raw = sessionStorage.getItem('ts_selection');
		if (raw) {
			const parsed = JSON.parse(raw) as Partial<SelectionState>;
			return { ...defaultSelection, ...parsed };
		}
	} catch {
		/* ignore */
	}
	return { ...defaultSelection };
}

// ──────────────────────────────────────────
// Writable Store
// ──────────────────────────────────────────
export const selection = writable<SelectionState>(loadInitial());

// Persist on update
selection.subscribe((v) => {
	try {
		sessionStorage.setItem('ts_selection', JSON.stringify(v));
	} catch {
		/* ignore */
	}
});

// ──────────────────────────────────────────
// Helper Updaters
// ──────────────────────────────────────────
export function setDecadeGenreSelection(args: {
  language: string;
  decade: string;
  genre: string;
  startRank?: number;
  endRank?: number;

  playIntro?: boolean;
  playDetail?: boolean;
  playArtistDescription?: boolean;
  textIntro?: boolean;
  textDetail?: boolean;
  textArtistDescription?: boolean;

  voices?: string[];
  playbackOrder?: PlaybackOrder;
  voicePlayMode?: VoicePlayMode;
  pauseMode?: PauseMode;
  categoryMode?: CategoryMode;
}) {
  selection.set({
    ...defaultSelection,
    mode: 'decade_genre',
    language: args.language,
    context: { decade: args.decade, genre: args.genre },

    startRank: args.startRank ?? 1,
    endRank: args.endRank ?? 40,

    playIntro: args.playIntro ?? true,
    playDetail: args.playDetail ?? false,
    playArtistDescription: args.playArtistDescription ?? false,

    textIntro: args.textIntro ?? true,
    textDetail: args.textDetail ?? false,
    textArtistDescription: args.textArtistDescription ?? false,

    voices: args.voices ?? ['intro'],
    playbackOrder: args.playbackOrder ?? 'up',
    voicePlayMode: args.voicePlayMode ?? 'before',
    pauseMode: args.pauseMode ?? 'pause',
    categoryMode: args.categoryMode ?? 'single'
  });
}

export function setCollectionSelection(args: {
  language: string;
  collection_slug: string;
  collection_name?: string;
  startRank?: number;
  endRank?: number;

  playIntro?: boolean;
  playDetail?: boolean;
  playArtistDescription?: boolean;

  textIntro?: boolean;
  textDetail?: boolean;
  textArtistDescription?: boolean;

  voices?: string[];
  playbackOrder?: PlaybackOrder;
  voicePlayMode?: VoicePlayMode;
  pauseMode?: PauseMode;
  categoryMode?: CategoryMode;
}) {
  selection.set({
    ...defaultSelection,
    mode: 'collection',
    language: args.language,
    context: {
      collection_slug: args.collection_slug,
      ...(args.collection_name ? { collection_name: args.collection_name } : {})
    },

    startRank: args.startRank ?? 1,
    endRank: args.endRank ?? 40,

    playIntro: args.playIntro ?? true,
    playDetail: args.playDetail ?? false,
    playArtistDescription: args.playArtistDescription ?? false,

    textIntro: args.textIntro ?? true,
    textDetail: args.textDetail ?? false,
    textArtistDescription: args.textArtistDescription ?? false,

    voices: args.voices ?? ['intro'],
    playbackOrder: args.playbackOrder ?? 'up',
    voicePlayMode: args.voicePlayMode ?? 'before',
    pauseMode: args.pauseMode ?? 'pause',
    categoryMode: args.categoryMode ?? 'single'
  });
}

export function resetSelection() {
	selection.set({ ...defaultSelection });
	sessionStorage.removeItem('ts_selection');
}

export function setFromUrlParams(params: URLSearchParams) {
	const mode = params.get('mode') as Mode;

	const decade = params.get('decade');
	const genre = params.get('genre');
	const collection = params.get('collection');

	selection.set({
		...defaultSelection,
		mode: mode,
		language: params.get('language') ?? 'en',

		context:
			mode === 'collection'
				? {
						collection_slug: collection ?? ''
				  }
				: {
						decade: decade ?? '',
						genre: genre ?? ''
				  },

		startRank: Number(params.get('startRank') ?? 1),
		endRank: Number(params.get('endRank') ?? 40),

		voices: (params.get('voices') ?? 'intro').split(','),
		playbackOrder: (params.get('playbackOrder') ?? 'up') as PlaybackOrder,
		voicePlayMode: (params.get('voicePlayMode') ?? 'before') as VoicePlayMode,
		pauseMode: (params.get('pauseMode') ?? 'pause') as PauseMode,

		playIntro: params.get('playIntro') === 'true',
		playDetail: params.get('playDetail') === 'true',
		playArtistDescription: params.get('playArtistDescription') === 'true',

		textIntro: params.get('textIntro') !== 'false',
		textDetail: params.get('textDetail') === 'true',
		textArtistDescription: params.get('textArtistDescription') === 'true',

		categoryMode: 'single'
	});
}
