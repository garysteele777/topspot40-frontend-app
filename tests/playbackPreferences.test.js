// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

import {
    narrationFlagsFromVoices,
    normalizeDetailLength,
    normalizePauseMode,
    normalizePlaybackMethod,
    normalizePlaybackOrder,
    normalizeSelectedVoices,
    normalizeSkipPlayed,
    normalizeVoicePlayMode
} from '../src/lib/playbackPreferences.ts';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const values = new Map();
const writes = [];
globalThis.localStorage = {
    getItem(key) {
        return values.get(key) ?? null;
    },
    setItem(key, value) {
        values.set(key, String(value));
        writes.push([key, String(value)]);
    }
};

const {get} = await import('svelte/store');
const {playbackSettingsStore} = await import('../src/lib/stores/playbackSettings.store.ts');
const {buildSelectionFromUrl} = await import('../src/lib/helpers/car/selectionFromUrl.ts');
const {buildSelectionFromResume} = await import('../src/lib/options/applyResume.ts');
const {resolveSequenceNarrationUrls} = await import('../src/lib/audio/sequenceNarration.ts');

test('keeps the playback settings defaults at guided Intro+Detail/shuffle/continuous/skip=true/before/short', () => {
    assert.deepEqual(get(playbackSettingsStore), {
        playbackMethod: 'guided',
        playbackOrder: 'shuffle',
        skipPlayed: true,
        pauseMode: 'continuous',
        voices: ['intro', 'detail'],
        voicePlayMode: 'before',
        detailLength: 'short',
        spotlightBioLength: 'short'
    });
});

test('keeps URL/selection fallbacks at Intro/up/pause/skip=false', () => {
    const selection = buildSelectionFromUrl(new URL('https://example.test/car-page'));

    assert.deepEqual(selection.voices, ['intro']);
    assert.equal(selection.playbackOrder, 'up');
    assert.equal(selection.pauseMode, 'pause');
    assert.equal(selection.skipPlayed, false);
    assert.equal(selection.playIntro, true);
    assert.equal(selection.playDetail, false);
    assert.equal(selection.playArtistDescription, false);
});

test('keeps valid and malformed-present URL values on their existing paths', () => {
    const valid = buildSelectionFromUrl(new URL(
        'https://example.test/car-page?voices=detail,intro,detail&playbackOrder=down&voicePlayMode=over&pauseMode=continuous&skipPlayed=true'
    ));
    assert.deepEqual(valid.voices, ['detail', 'intro']);
    assert.equal(valid.playbackOrder, 'down');
    assert.equal(valid.voicePlayMode, 'over');
    assert.equal(valid.pauseMode, 'continuous');
    assert.equal(valid.skipPlayed, true);

    const malformed = buildSelectionFromUrl(new URL(
        'https://example.test/car-page?voices=invalid&playbackOrder=invalid&voicePlayMode=invalid&pauseMode=invalid&skipPlayed=invalid'
    ));
    assert.deepEqual(malformed.voices, []);
    assert.equal(malformed.playbackOrder, 'invalid');
    assert.equal(malformed.voicePlayMode, 'before');
    assert.equal(malformed.pauseMode, 'pause');
    assert.equal(malformed.skipPlayed, false);
});

test('normalizes invalid values to each caller-supplied fallback', () => {
    assert.equal(normalizeDetailLength('off', 'short'), 'off');
    assert.equal(normalizePlaybackMethod('invalid', 'guided'), 'guided');
    assert.equal(normalizePlaybackOrder('invalid', 'up'), 'up');
    assert.equal(normalizePauseMode('invalid', 'pause'), 'pause');
    assert.equal(normalizeSkipPlayed('invalid', true), true);
    assert.equal(normalizeVoicePlayMode('invalid', 'before'), 'before');
    assert.equal(normalizeDetailLength('invalid', 'short'), 'short');
});

test('normalizes voices by validating and de-duplicating in first-seen order', () => {
    assert.deepEqual(
        normalizeSelectedVoices(['detail', 'intro', 'detail', 'artist', 'intro', 'bad']),
        ['detail', 'intro', 'artist']
    );
    assert.deepEqual(normalizeSelectedVoices(null, ['intro']), ['intro']);
    assert.deepEqual(normalizeSelectedVoices(['bad']), []);
});

test('maps narration booleans exactly from selected voices', () => {
    assert.deepEqual(narrationFlagsFromVoices(['intro', 'artist']), {
        playIntro: true,
        playDetail: false,
        playArtistDescription: true
    });
});

test('persists narration choices alongside the legacy Detail Length key', () => {
    writes.length = 0;
    playbackSettingsStore.set({
        ...get(playbackSettingsStore),
        playbackMethod: 'automatic',
        playbackOrder: 'up',
        skipPlayed: false,
        pauseMode: 'pause',
        voices: ['artist'],
        voicePlayMode: 'over'
    });
    assert.deepEqual(writes.map(([key]) => key), ['topspot_narration_preferences_v1', 'topspot_detail_length', 'topspot_playback_order', 'topspot_skip_played']);
    assert.equal(JSON.parse(writes[0][1]).detailLength, 'short');
    assert.equal(writes[1][1], 'short');

    writes.length = 0;
    playbackSettingsStore.update(settings => ({...settings, detailLength: 'long'}));
    assert.deepEqual(writes.map(([key]) => key), ['topspot_narration_preferences_v1', 'topspot_detail_length', 'topspot_playback_order', 'topspot_skip_played']);
    assert.equal(JSON.parse(writes[0][1]).detailLength, 'long');
    assert.equal(writes[1][1], 'long');

    writes.length = 0;
    playbackSettingsStore.update(settings => ({...settings, detailLength: 'off'}));
    assert.deepEqual(writes.map(([key]) => key), ['topspot_narration_preferences_v1', 'topspot_detail_length', 'topspot_playback_order', 'topspot_skip_played']);
    assert.equal(JSON.parse(writes[0][1]).detailLength, 'off');
    assert.equal(writes[1][1], 'off');
});

test('Details Off preserves intro resolution but does not request detail narration', () => {
    const urls = resolveSequenceNarrationUrls({
        rank: 1,
        introUrl: 'https://example.test/intro.mp3',
        detailUrl: 'https://example.test/detail.mp3',
        shortDetailUrl: 'https://example.test/short.mp3'
    }, 'en', 'off');
    assert.equal(urls.intro, 'https://example.test/intro.mp3');
    assert.equal(urls.detail, null);
    assert.equal(urls.detailFallback, undefined);
});

test('keeps old resume snapshots compatible while applying their existing fallbacks', () => {
    const oldSnapshot = buildSelectionFromResume({
        mode: 'decade_genre',
        context: {decade: '1980s', genre: 'pop'},
        language: 'en',
        startRank: 1,
        endRank: 40,
        playbackOrder: 'shuffle',
        voices: ['intro', 'detail', 'intro']
    });

    assert.deepEqual(oldSnapshot.voices, ['intro', 'detail']);
    assert.equal(oldSnapshot.currentRank, 1);
    assert.equal(oldSnapshot.pauseMode, 'pause');
    assert.equal(oldSnapshot.skipPlayed, false);
    assert.equal(oldSnapshot.voicePlayMode, 'before');
    assert.equal(oldSnapshot.textIntro, true);
    assert.equal(oldSnapshot.textDetail, true);
    assert.equal(oldSnapshot.textArtistDescription, false);

    const malformed = buildSelectionFromResume({
        ...oldSnapshot,
        playbackOrder: 'invalid',
        pauseMode: 'invalid',
        skipPlayed: 'invalid'
    });
    assert.equal(malformed.playbackOrder, 'invalid');
    assert.equal(malformed.pauseMode, 'invalid');
    assert.equal(malformed.skipPlayed, 'invalid');
});
