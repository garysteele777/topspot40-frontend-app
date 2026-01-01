// src/lib/stores/playlistSettings.ts
import { writable } from 'svelte/store';

export type PlaylistSettings = {
	playOption: 'countup' | 'countdown' | 'random' | 'custom';
	decades?: string[];
	genres?: string[];
	viewOption: ('intro' | 'detail' | 'artist')[];
	playMP3Option: ('intro' | 'detail' | 'artist')[];
	languageOption: 'english' | 'spanish' | 'brazil-portuguese';
	playRangeOption: 10 | 20 | 30 | 40;
};

export const playlistSettingsStore = writable<PlaylistSettings | null>(null);
