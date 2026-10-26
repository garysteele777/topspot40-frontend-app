// src/lib/stores/playbackSettings.store.ts

import { writable, get } from 'svelte/store';
import {normalizeNarrationPreferences, readNarrationPreferences, NARRATION_STORAGE_KEY} from '$lib/narrationPreferences';
import { browser } from '$app/environment';
import type {
    DetailLength,
    PauseMode,
    PlaybackOrder,
    VoicePart,
    VoicePlayMode
} from '$lib/types/playback';
import {
    type PlaybackMethod
} from '$lib/playbackPreferences';

export type {PlaybackMethod} from '$lib/playbackPreferences';
function initialNarrationPreferences() {
    if (!browser) return normalizeNarrationPreferences({voices: ['intro'], detailLength: 'short'});
    try { return readNarrationPreferences(localStorage); }
    catch { return normalizeNarrationPreferences({voices: ['intro'], detailLength: 'short'}); }
}

export type PlaybackSettings = {
	playbackMethod: PlaybackMethod;
	playbackOrder: PlaybackOrder;
	skipPlayed: boolean;
	pauseMode: PauseMode;
	voices: VoicePart[];
	voicePlayMode: VoicePlayMode;
	detailLength: DetailLength;
	spotlightBioLength?: DetailLength;
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

const settingsStore = writable<PlaybackSettings>({
	playbackMethod: 'guided',
	playbackOrder: initialPlaybackOrder(),
	skipPlayed: initialSkipPlayed(),
	pauseMode: 'continuous',
	voicePlayMode: 'before',
	...initialNarrationPreferences()
});

export const playbackSettingsStore = {
    subscribe: settingsStore.subscribe,
    set(value: PlaybackSettings) {
        const current = get(settingsStore);
        const next = {...current, ...value, spotlightBioLength: value.spotlightBioLength ?? current.spotlightBioLength};
        settingsStore.set({...next, ...normalizeNarrationPreferences(next)});
    },
    update(updater: (current: PlaybackSettings) => PlaybackSettings) {
        this.set(updater(get(settingsStore)));
    }
};

if (browser) {
    settingsStore.subscribe(value => {
        try {
            localStorage.setItem(NARRATION_STORAGE_KEY, JSON.stringify(normalizeNarrationPreferences(value)));
            localStorage.setItem('topspot_detail_length', value.detailLength);
            localStorage.setItem(ORDER_STORAGE_KEY, value.playbackOrder);
            localStorage.setItem(SKIP_PLAYED_STORAGE_KEY, String(value.skipPlayed));
        } catch { /* Playback remains available if browser storage is blocked. */ }
    });
}
