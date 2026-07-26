// src/lib/stores/playbackSettings.store.ts

import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { DetailLength } from '$lib/types/playback';

export type PlaybackMethod = 'automatic' | 'guided';
const DETAIL_LENGTH_STORAGE_KEY = 'topspot_detail_length';

function initialDetailLength(): DetailLength {
	if (!browser) return 'short';
	return localStorage.getItem(DETAIL_LENGTH_STORAGE_KEY) === 'long' ? 'long' : 'short';
}

export type PlaybackSettings = {
	playbackMethod: PlaybackMethod;
	playbackOrder: 'up' | 'down' | 'shuffle';
	skipPlayed: boolean;
	pauseMode: 'pause' | 'continuous';
	voices: ('intro' | 'detail' | 'artist')[];
	voicePlayMode: 'before' | 'over';
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
