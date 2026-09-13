// @ts-nocheck -- direct Node coverage for the query-gated diagnostic surface.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    activateAudioDebugFromSearch,
    audioDebugEntries,
    clearAudioDebugLog,
    disableAudioDebug,
    isAudioDebugEnabled,
    logAudioDebug,
    setAudioDebugEnabledForTest
} = await import('../src/lib/audio/audioDebug.ts');

function createSessionStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
}

function readEntries() {
    let entries = [];
    const unsubscribe = audioDebugEntries.subscribe(value => { entries = value; });
    unsubscribe();
    return entries;
}

test('audio diagnostics are disabled unless audioDebug=1 is present', () => {
    assert.equal(isAudioDebugEnabled(''), false);
    assert.equal(isAudioDebugEnabled('?audioDebug=0'), false);
    assert.equal(isAudioDebugEnabled('?other=value'), false);
    assert.equal(isAudioDebugEnabled('?audioDebug=1'), true);
});

test('audioDebug=1 activates a diagnostic session that persists through navigation', () => {
    const storage = createSessionStorage();

    assert.equal(activateAudioDebugFromSearch('?audioDebug=1', storage), true);
    assert.equal(isAudioDebugEnabled('', storage), true);
    assert.equal(activateAudioDebugFromSearch('', storage), true);
});

test('disabling diagnostics clears the session flag and in-memory log', () => {
    const storage = createSessionStorage();
    activateAudioDebugFromSearch('?audioDebug=1', storage);
    setAudioDebugEnabledForTest(true);
    logAudioDebug('test event');
    assert.equal(readEntries().length, 1);
    setAudioDebugEnabledForTest(null);

    disableAudioDebug(storage);

    assert.equal(isAudioDebugEnabled('', storage), false);
    assert.deepEqual(readEntries(), []);
    clearAudioDebugLog();
});

test('Car Mode renders the diagnostic panel only through the audioDebug query gate', async () => {
    const page = await readFile(
        new URL('../src/routes/car-page/+page.svelte', import.meta.url),
        'utf8'
    );
    const diagnostics = await readFile(
        new URL('../src/lib/audio/audioDebug.ts', import.meta.url),
        'utf8'
    );

    const layout = await readFile(
        new URL('../src/routes/+layout.svelte', import.meta.url),
        'utf8'
    );

    assert.match(page, /\{#if \$audioDebugEnabled\}\s*<AudioDiagnosticPanel\s*\/>\s*\{\/if\}/);
    assert.match(layout, /activateAudioDebugFromSearch\(\$page\.url\.search\)/);
    assert.match(diagnostics, /new URLSearchParams\(search \?\? ''\)\.get\('audioDebug'\) === '1'/);
    assert.match(diagnostics, /topspot_audio_debug_enabled/);
    assert.doesNotMatch(diagnostics, /fetch\(|posthog|localStorage/i);
});
