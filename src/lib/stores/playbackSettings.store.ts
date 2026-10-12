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

const ORDER_STORAGE_KEY = 'topspot_playback_order';
const SKIP_PLAYED_STORAGE_KEY = 'topspot_skip_played';

function initialPlaybackOrder(): PlaybackOrder {
    if (!browser) return 'shuffle';
    try {
        const saved = localStorage.getItem(ORDER_STORAGE_KEY);
        if (saved === 'up' || saved === 'down' || saved === 'shuffle') {
            return saved;
        }
    } catch {}
    return 'shuffle';
}

function initialSkipPlayed(): boolean {
    if (!browser) return true;
    try {
        const saved = localStorage.getItem(SKIP_PLAYED_STORAGE_KEY);
        if (saved === 'true') return true;
        if (saved === 'false') return false;
    } catch {}
    return true;
}

export const playbackSettingsStore = writable<PlaybackSettings>({
	playbackMethod: 'guided',
	playbackOrder: initialPlaybackOrder(),
	skipPlayed: initialSkipPlayed(),
	pauseMode: 'continuous',
	voices: ['intro', 'detail'],
	voicePlayMode: 'before',
	detailLength: initialDetailLength()
});

if (browser) {
	playbackSettingsStore.subscribe(({ detailLength, playbackOrder, skipPlayed }) => {
		try {
                    localStorage.setItem(DETAIL_LENGTH_STORAGE_KEY, detailLength);
                    localStorage.setItem(ORDER_STORAGE_KEY, playbackOrder);
                    localStorage.setItem(SKIP_PLAYED_STORAGE_KEY, String(skipPlayed));
                } catch {}
	});
}
