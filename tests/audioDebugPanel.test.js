// @ts-nocheck -- direct Node coverage for the query-gated diagnostic surface.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {isAudioDebugEnabled} = await import('../src/lib/audio/audioDebug.ts');

test('audio diagnostics are disabled unless audioDebug=1 is present', () => {
    assert.equal(isAudioDebugEnabled(''), false);
    assert.equal(isAudioDebugEnabled('?audioDebug=0'), false);
    assert.equal(isAudioDebugEnabled('?other=value'), false);
    assert.equal(isAudioDebugEnabled('?audioDebug=1'), true);
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

    assert.match(page, /\{#if isAudioDebugEnabled\(\)\}\s*<AudioDiagnosticPanel\s*\/>\s*\{\/if\}/);
    assert.match(diagnostics, /new URLSearchParams\(search\)\.get\('audioDebug'\) === '1'/);
    assert.doesNotMatch(diagnostics, /fetch\(|posthog|localStorage|sessionStorage/i);
});
