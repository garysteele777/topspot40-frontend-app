// src/lib/stores/playbackSettings.store.ts

import { writable } from 'svelte/store';

export type PlaybackSettings = {
	playbackOrder: 'up' | 'down' | 'shuffle';
	skipPlayed: boolean;
	pauseMode: 'pause' | 'continuous';
	voices: ('intro' | 'detail' | 'artist')[];
	voicePlayMode: 'before' | 'over';
};

export const playbackSettingsStore = writable<PlaybackSettings>({
	playbackOrder: 'up',
	skipPlayed: true,
	pauseMode: 'pause',
	voices: ['intro'],
	voicePlayMode: 'before'
});