import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {lookupProgramCode, ProgramCodeLookupError, programCodeUrl} from '../src/lib/api/programCode.js';

const settings = {language: 'en', languages: ['en'], voices: ['intro'], playbackOrder: 'up', voicePlayMode: 'before', pauseMode: 'pause', skipPlayed: false};
const json = (body, status = 200) => ({status, ok: status >= 200 && status < 300, json: async () => body});

test('submits canonical and forgiving codes unchanged for registry normalization', async () => {
    const urls = [];
    const fetchMock = async (url) => { urls.push(url); return json({kind: 'nostalgia', target: {decade_slug: '1970s', genre_slug: 'folk'}}); };
    await lookupProgramCode('N-023', fetchMock, 'https://api.example');
    await lookupProgramCode(' n23 ', fetchMock, 'https://api.example');
    await lookupProgramCode('N 23', fetchMock, 'https://api.example');
    assert.deepEqual(urls, [
        'https://api.example/api/catalog/programs/N-023',
        'https://api.example/api/catalog/programs/n23',
        'https://api.example/api/catalog/programs/N%2023'
    ]);
});

test('builds existing N, C, A, and D program navigation URLs', () => {
    assert.match(programCodeUrl({kind: 'nostalgia', target: {decade_slug: '1970s', genre_slug: 'folk'}}, settings), /^\/car-page\?mode=decade_genre&decade=1970s&genre=folk&/);
    assert.match(programCodeUrl({kind: 'collection', target: {slug: 'music_legends'}}, settings), /^\/car-page\?mode=collection&collection=music_legends&/);
    assert.match(programCodeUrl({kind: 'artist_spotlight', target: {artist_id: 42}}, settings), /^\/car-page\?mode=artist_spotlight&artist_id=42&/);
    assert.equal(programCodeUrl({kind: 'docuseries_story', target: {slug: 'electric_guitar'}}, settings), '/story-player?type=music_docuseries&slug=electric_guitar&language=en');
    assert.equal(programCodeUrl({kind: 'docuseries_story', target: {slug: 'electric_guitar'}}, {...settings, language: 'ptbr'}), '/story-player?type=music_docuseries&slug=electric_guitar&language=pt-BR');
    assert.match(programCodeUrl({kind: 'collection', target: {slug: 'music & legends'}}, settings), /collection=music%20%26%20legends/);
});

test('reports 404 separately from service failures', async () => {
    await assert.rejects(() => lookupProgramCode('N-404', async () => json({}, 404)), error => error instanceof ProgramCodeLookupError && error.kind === 'not-found');
    await assert.rejects(() => lookupProgramCode('N-500', async () => json({}, 500)), error => error instanceof ProgramCodeLookupError && error.kind === 'service');
});

test('Enter-key form submission disables duplicate lookup and announces status accessibly', async () => {
    const source = await readFile(new URL('../src/lib/components/options-v2/ProgramCodeEntry.svelte', import.meta.url), 'utf8');
    assert.match(source, /on:submit\|preventDefault=\{submit\}/);
    assert.match(source, /if \(lookingUp\) return/);
    assert.match(source, /disabled=\{lookingUp\}/);
    assert.match(source, /<label for="program-code-input">/);
    assert.match(source, /role=\{statusKind === 'error' \? 'alert' : 'status'\}/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /topspotProgramCodeReturnFocus/);
    assert.match(source, /input\?\.focus\(\)/);
});

test('D-code story navigation does not automatically play audio', async () => {
    const source = await readFile(new URL('../src/routes/story-player/+page.svelte', import.meta.url), 'utf8');
    const mountBlock = source.slice(source.indexOf('onMount'), source.indexOf('function togglePlayback'));
    assert.doesNotMatch(mountBlock, /audio\.play\(/);
    assert.match(source, /on:click=\{togglePlayback\}/);
});

test('program code entry is confined to Program Mode, not the Radio section', async () => {
    const library = await readFile(new URL('../src/lib/components/options-v2/ListeningLibraryPanel.svelte', import.meta.url), 'utf8');
    const options = await readFile(new URL('../src/routes/options-v4/+page.svelte', import.meta.url), 'utf8');
    assert.match(library, /ProgramCodeEntry/);
    assert.doesNotMatch(options.slice(options.indexOf('<!-- 🔥 RADIO (NEW) -->'), options.indexOf('<ListeningLibraryPanel')), /ProgramCodeEntry/);
});
