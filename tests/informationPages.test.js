// @ts-nocheck -- source-level route coverage is sufficient for localized static-content replacements.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const routes = [
    '../src/routes/discovery-guide/+page.svelte',
    '../src/routes/garys-story/+page.svelte'
];

test('localized information pages use the shared language preference and guard direct visits', async () => {
    for (const path of routes) {
        const page = await source(path);
        assert.match(page, /readStoredLanguagePreference/);
        assert.match(page, /if \(!savedLanguage\)[\s\S]*?goto\('\/journey-prototype', \{replaceState: true\}\)/s);
        assert.match(page, /en:\s*\{/);
        assert.match(page, /es:\s*\{/);
        assert.match(page, /ptbr:\s*\{/);
        assert.match(page, /<PublicJourneyHeader \{language\}\/>/);
        assert.match(page, /href="\/welcome"/);
        assert.match(page, /<meta name="description" content=\{copy\[language\]\.description\}/);
    }
});

test('Gary’s story preserves Patty’s Rule and the B.B. King and Buddy Guy discovery in every language', async () => {
    const page = await source('../src/routes/garys-story/+page.svelte');

    assert.equal((page.match(/Patty/g) ?? []).length >= 9, true);
    assert.equal((page.match(/B\.B\. King/g) ?? []).length, 3);
    assert.equal((page.match(/Buddy Guy/g) ?? []).length, 6);
    for (const label of ["Patty's Rule", 'La regla de Patty', 'A regra de Patty']) {
        assert.match(page, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
});

test('discovery guide keeps approved access wording and Spotify playback boundary in all languages', async () => {
    const page = await source('../src/routes/discovery-guide/+page.svelte');

    for (const wording of [
        'free through December 31, 2026',
        'No TopSpot40 account or credit card is required',
        'separate Spotify account is required for song playback',
        'Spotify Free or Premium may be used',
        'gratuito hasta el 31 de diciembre de 2026',
        'cuenta independiente de Spotify para reproducir canciones',
        'Spotify Free o Premium',
        'gratuito até 31 de dezembro de 2026',
        'conta separada do Spotify para reproduzir músicas',
        'Spotify Free ou Premium'
    ]) {
        assert.match(page, new RegExp(wording.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.match(page, /Spotify handles music playback, advertisements, availability, account restrictions, and Free or Premium behavior/);
    assert.match(page, /details open=\{i === 0\}/);
});
