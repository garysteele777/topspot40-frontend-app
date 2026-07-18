// src/lib/stores/playbackSettings.store.ts

import { writable } from 'svelte/store';

export type PlaybackMethod = 'automatic' | 'guided';

export type PlaybackSettings = {
	playbackMethod: PlaybackMethod;
	playbackOrder: 'up' | 'down' | 'shuffle';
	skipPlayed: boolean;
	pauseMode: 'pause' | 'continuous';
	voices: ('intro' | 'detail' | 'artist')[];
	voicePlayMode: 'before' | 'over';
};

export const playbackSettingsStore = writable<PlaybackSettings>({
	playbackMethod: 'automatic',
	playbackOrder: 'shuffle',
	skipPlayed: true,
	pauseMode: 'continuous',
	voices: ['intro', 'detail'],
	voicePlayMode: 'before'
});