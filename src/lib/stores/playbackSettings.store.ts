// src/lib/stores/playbackSettings.store.ts

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type {
    DetailLength,
    PauseMode,
    PlaybackOrder,
    VoicePart,
    VoicePlayMode
} from '$lib/types/playback';
import {
    normalizeDetailLength,
    type PlaybackMethod
} from '$lib/playbackPreferences';

export type {PlaybackMethod} from '$lib/playbackPreferences';
const DETAIL_LENGTH_STORAGE_KEY = 'topspot_detail_length';

function initialDetailLength(): DetailLength {
	if (!browser) return 'short';
	return normalizeDetailLength(
		localStorage.getItem(DETAIL_LENGTH_STORAGE_KEY),
		'short'
	);
}

export type PlaybackSettings = {
	playbackMethod: PlaybackMethod;
	playbackOrder: PlaybackOrder;
	skipPlayed: boolean;
	pauseMode: PauseMode;
	voices: VoicePart[];
	voicePlayMode: VoicePlayMode;
	detailLength: DetailLength;
};

export const playbackSettingsStore = writable<PlaybackSettings>({
	playbackMethod: 'guided',
	playbackOrder: 'shuffle',
	skipPlayed: true,
	pauseMode: 'continuous',
	voices: ['intro', 'detail'],
	voicePlayMode: 'before',
	detailLength: initialDetailLength()
});

if (browser) {
	playbackSettingsStore.subscribe(({ detailLength }) => {
		localStorage.setItem(DETAIL_LENGTH_STORAGE_KEY, detailLength);
	});
}
