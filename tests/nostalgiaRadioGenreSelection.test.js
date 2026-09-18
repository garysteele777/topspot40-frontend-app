// @ts-nocheck -- Node source-contract test, consistent with the existing suite.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const genres = await import('../src/lib/journey/nostalgiaRadioGenres.ts');
const selectorPath = new URL('../src/lib/components/options-v2/NostalgiaRadioGenreSelection.svelte', import.meta.url);
const launcherPath = new URL('../src/lib/components/options-v2/InteractiveRadioPanel.svelte', import.meta.url);
const carPagePath = new URL('../src/routes/car-page/+page.svelte', import.meta.url);
const selectionPath = new URL('../src/lib/helpers/car/selectionFromUrl.ts', import.meta.url);
const backendRouterPath = new URL('../../topspot-backend-interactive-radio/backend/routers/decade_genre_player.py', import.meta.url);
const backendSequencePath = new URL('../../topspot-backend-interactive-radio/backend/services/all_radio_sequence.py', import.meta.url);
const {buildSelectionFromUrl} = await import('../src/lib/helpers/car/selectionFromUrl.ts');

test('Nostalgia Radio defaults to all eight genres and individual toggles retain canonical order', () => {
    assert.equal(genres.NOSTALGIA_RADIO_GENRES.length, 8);
    assert.deepEqual(
        genres.normalizeNostalgiaRadioGenres(['rock', 'country']),
        ['country', 'rock']
    );
    assert.deepEqual(genres.normalizeNostalgiaRadioGenres(genres.NOSTALGIA_RADIO_GENRES), genres.NOSTALGIA_RADIO_GENRES);
});

test('genre selection supports Clear All, Select All, and one-genre labels', async () => {
    const selector = await readFile(selectorPath, 'utf8');
    assert.match(selector, /selectedGenres: NostalgiaRadioGenreSlug\[\] = \[\.\.\.NOSTALGIA_RADIO_GENRES\]/);
    assert.match(selector, /function toggleGenre/);
    assert.match(selector, /Select All Genres/);
    assert.match(selector, /Clear All Genres/);
    assert.match(selector, /disabled=\{selectedCount === 0\}/);
    assert.match(selector, /export let language: Language \| 'pt-BR' = 'en'/);
    assert.match(selector, /es: \{artAlt:[\s\S]*Selecciona todos los géneros/);
    assert.match(selector, /ptbr: \{artAlt:[\s\S]*Selecione todos os gêneros/);
    assert.match(selector, /\$\{text\.continue\} \$\{selectedCount\}/);
    assert.match(selector, /checkmark/);
    assert.deepEqual(genres.normalizeNostalgiaRadioGenres([]), []);
    assert.deepEqual(genres.normalizeNostalgiaRadioGenres(['pop']), ['pop']);
});

test('multiple genres pass through URL state while legacy all and single-genre stations remain compatible', async () => {
    const [launcher, carPage, selection] = await Promise.all([
        readFile(launcherPath, 'utf8'), readFile(carPagePath, 'utf8'), readFile(selectionPath, 'utf8')
    ]);
    const url = new URL('https://topspot.test/car-page?mode=nostalgia&decade=ALL&genre=ALL&genres=rock&genres=country');
    const radioSelection = buildSelectionFromUrl(url);
    assert.equal(radioSelection.context.radioGenres, 'country,rock');
    assert.deepEqual(genres.selectedNostalgiaRadioGenres(radioSelection.context.radioGenres, radioSelection.context.genre), ['country', 'rock']);
    assert.equal(genres.selectedNostalgiaRadioGenres('', 'ALL'), null);
    assert.deepEqual(genres.selectedNostalgiaRadioGenres('', 'country'), ['country']);
    const params = new URLSearchParams({genre: 'ALL'});
    genres.appendNostalgiaRadioGenres(params, ['country', 'rock']);
    assert.deepEqual(params.getAll('genres'), ['country', 'rock']);
    assert.match(launcher, /common\.set\('genres', selectedGenres\.join\(','\)\)/);
    assert.match(selection, /sp\.getAll\('genres'\)/);
    assert.match(carPage, /appendNostalgiaRadioGenres/);
});

test('radio track installation only accepts sets in the requested genre list', async () => {
    const [carPage, backendRouter, backendSequence] = await Promise.all([
        readFile(carPagePath, 'utf8'), readFile(backendRouterPath, 'utf8'), readFile(backendSequencePath, 'utf8')
    ]);
    assert.equal(genres.isGeneratedNostalgiaRadioGenreAllowed('pop,rock', 'ALL', 'pop'), true);
    assert.equal(genres.isGeneratedNostalgiaRadioGenreAllowed('pop,rock', 'ALL', 'rock'), true);
    assert.equal(genres.isGeneratedNostalgiaRadioGenreAllowed('pop,rock', 'ALL', 'folk_acoustic'), false);
    assert.match(carPage, /isGeneratedNostalgiaRadioGenreAllowed/);
    assert.match(backendRouter, /genres: list\[str\] \| None = Query\(None\)/);
    assert.match(backendRouter, /genre_filters=genre_filter/);
    assert.match(backendSequence, /if g in genre_filters/);
});

test('radio labels distinguish ALL, CUSTOM, and a single selected genre', () => {
    assert.equal(genres.nostalgiaRadioStationLabel('country,pop,rock,rnb_soul,latin_global,blues_jazz,folk_acoustic,tv_themes', 'ALL'), 'ALL');
    assert.equal(genres.nostalgiaRadioStationLabel('pop,rock', 'ALL'), 'CUSTOM');
    assert.equal(genres.nostalgiaRadioStationLabel('pop', 'ALL'), 'Pop');
    assert.equal(genres.nostalgiaRadioStationLabel('', 'rock'), 'Rock');
});

test('genre choices persist for Back navigation and refresh', async () => {
    const selector = await readFile(selectorPath, 'utf8');
    assert.match(selector, /const STORAGE_KEY = 'topspot_nostalgia_radio_genres'/);
    assert.match(selector, /localStorage\.setItem\(STORAGE_KEY, selectedGenres\.join\(','\)\)/);
    assert.match(selector, /localStorage\.getItem\(STORAGE_KEY\)/);
});
