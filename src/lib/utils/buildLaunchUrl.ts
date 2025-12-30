// src/lib/utils/buildLaunchUrl.ts

export type PlaybackOrder = 'up' | 'down' | 'shuffle';
export type VoicePlayMode = 'before' | 'over';
export type PauseMode = 'pause' | 'continuous';
export type LayoutMode = 'car' | 'list';

export type BuildParams = {
	layoutMode: LayoutMode;

	// browsing
	decade?: string;
	genre?: string;
	collection?: string;

	// playback
	language: string;
	voices: string[];
	startRank: number;
	endRank: number;
	playbackOrder: PlaybackOrder;
	voicePlayMode: VoicePlayMode;
	pauseMode: PauseMode;

	// ✅ optional future flags (safe to add now)
	randomAllCategories?: boolean;
	overdub?: {
		enabled: boolean;
		intro: boolean;
		detail: boolean;
		artist: boolean;
	};

	// ✅ if you later add text-vs-tts toggles
	textIntro?: boolean;
	textDetail?: boolean;
	textArtistDescription?: boolean;
};

// Ensures undefined values are not added to URL
function addParam(
	params: URLSearchParams,
	key: string,
	value: string | number | boolean | undefined | null
) {
	if (value !== undefined && value !== null) {
		params.set(key, String(value));
	}
}

export function buildLaunchUrl(p: BuildParams): string {
	const base = p.layoutMode === 'car' ? '/car-page' : '/list-page';
	const qs = new URLSearchParams();

	// mode resolver
	if (p.collection) {
		qs.set('mode', 'collection');
		addParam(qs, 'collection', p.collection);
	} else {
		qs.set('mode', 'decade_genre');
		addParam(qs, 'decade', p.decade);
		addParam(qs, 'genre', p.genre);
	}

	// main params (same keys you already use)
	addParam(qs, 'language', p.language);
	addParam(qs, 'voices', p.voices.join(','));
	addParam(qs, 'startRank', p.startRank);
	addParam(qs, 'endRank', p.endRank);
	addParam(qs, 'playbackOrder', p.playbackOrder);
	addParam(qs, 'voicePlayMode', p.voicePlayMode);
	addParam(qs, 'pauseMode', p.pauseMode);

	// optional flags (only included if truthy / enabled)
	if (p.randomAllCategories) {
		qs.set('randomAllCategories', 'true');
	}

	if (p.overdub?.enabled) {
		qs.set('overdub', 'true');
		addParam(qs, 'overdubIntro', p.overdub.intro);
		addParam(qs, 'overdubDetail', p.overdub.detail);
		addParam(qs, 'overdubArtist', p.overdub.artist);
	}

	addParam(qs, 'textIntro', p.textIntro);
	addParam(qs, 'textDetail', p.textDetail);
	addParam(qs, 'textArtistDescription', p.textArtistDescription);

	return `${base}?${qs.toString()}`;
}

export async function launchWithPlayback(p: BuildParams): Promise<string> {
	// 🚫 NO BACKEND CALLS
	// 🚫 NO PLAYBACK
	// ✅ ONLY NAVIGATION URL

	return buildLaunchUrl(p);
}
