import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {compile} from 'svelte/compiler';
import {Window} from 'happy-dom';

const root = fileURLToPath(new URL('../', import.meta.url));
const window = new Window({url: 'http://localhost'});
for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'Text', 'Comment', 'Event', 'CustomEvent', 'HTMLMediaElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLButtonElement', 'DocumentFragment', 'MutationObserver', 'localStorage']) {
    Object.defineProperty(globalThis, name, {configurable: true, value: window[name]});
}
globalThis.requestAnimationFrame = window.requestAnimationFrame.bind(window);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
window.__favoritesDestinations = [];
const temp = await mkdtemp(path.join(tmpdir(), 'topspot-favorites-ui-'));
const outfile = path.join(temp, 'components.mjs');
await build({
    stdin: {contents: `export {default as FavoritesPlayback} from './src/lib/components/journey/FavoritesPlayback.svelte';
export {default as TrackListPanel} from './src/lib/components/shared/TrackListPanel.svelte';
export {favoritesStore} from './src/lib/favorites/favorites';
export {createCarModeNavigation} from './src/lib/carmode/CarModeNavigation';
export {upsertProgram, programHistoryStore} from './src/lib/carmode/programHistory';
export {get} from 'svelte/store';
export {mount, unmount, flushSync} from 'svelte';`, resolveDir: root},
    bundle: true, outfile, format: 'esm', platform: 'browser', conditions: ['browser'],
    plugins: [{name: 'favorites-test', setup(plugin) {
        plugin.onResolve({filter: /^\$app\//}, args => ({path: args.path, namespace: 'test-app'}));
        plugin.onLoad({filter: /.*/, namespace: 'test-app'}, args => ({contents: args.path === '$app/environment'
            ? 'export const browser = true;'
            : 'export function goto(url) {window.__favoritesDestinations.push(url); return Promise.resolve();}'}));
        plugin.onResolve({filter: /^\$lib\//}, args => ({path: path.join(root, 'src/lib', args.path.slice(5)) + '.ts'}));
        plugin.onLoad({filter: /\.svelte$/}, async args => ({contents: compile(await readFile(args.path, 'utf8'), {filename: args.path, generate: 'client'}).js.code, loader: 'js'}));
    }}]
});
const {FavoritesPlayback, TrackListPanel, favoritesStore, createCarModeNavigation, upsertProgram, programHistoryStore, get, mount, unmount, flushSync} = await import(pathToFileURL(outfile).href);
const seed = {DG: {'1950s|country': [1, 2], '1960s|country': [3], '1960s|rock': [4]}, COL: {'duets|specialty_mixes': [8]}};
const target = document.createElement('div');
document.body.append(target);

await test('catalog control shows additive counts, filters, launches, and disables empty selections', async () => {
    target.replaceChildren();
    favoritesStore.set(structuredClone(seed));
    const component = mount(FavoritesPlayback, {target, props: {program: 'DG', language: 'en', options: [{value: 'country', label: 'Country'}, {value: 'jazz', label: 'Jazz'}]}});
    flushSync();
    assert.match(target.textContent, /4 favorite entries/);
    const select = target.querySelector('select');
    // Happy DOM does not implement option:checked; native browsers return
    // the selected option here, which Svelte's binding reads on change.
    const querySelector = select.querySelector.bind(select);
    select.querySelector = selector => selector === ':checked'
        ? [...select.options].find(option => option.selected) ?? null
        : querySelector(selector);
    select.options[0].selected = false; select.options[1].selected = true;
    select.dispatchEvent(new Event('change', {bubbles: true})); flushSync();
    assert.match(target.textContent, /3 favorite entries/);
    target.querySelector('button').click();
    const url = new URL(window.__favoritesDestinations.at(-1), 'http://localhost');
    assert.equal(url.searchParams.get('programType'), 'FAVORITES_DG');
    assert.equal(url.searchParams.get('genre'), 'country');
    select.options[2].selected = true; select.dispatchEvent(new Event('change', {bubbles: true})); flushSync();
    assert.equal(target.querySelector('button').disabled, true);
    await unmount(component); target.replaceChildren();
});

await test('Spotlight track list omits the Favorites column and stars', async () => {
    target.replaceChildren();
    const component = mount(TrackListPanel, {target, props: {tracks: [{rank: 1, rankingId: null, trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash'}], programType: null, programGroup: null}});
    flushSync();
    assert.equal(target.querySelector('.fav-col'), null);
    assert.equal(target.textContent.includes('Fav'), false);
    assert.ok(target.querySelector('.without-favorites'));
    await unmount(component); target.replaceChildren();
});

await test('combined-list star toggles only its source list', async () => {
    target.replaceChildren();
    favoritesStore.set(structuredClone(seed));
    const component = mount(TrackListPanel, {target, props: {programType: 'DG', programGroup: 'ALL|country', tracks: [
        {rank: 1, sourceRank: 7, rankingId: 1, favoriteGroup: '1950s|country', trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash'},
        {rank: 2, sourceRank: 3, rankingId: 3, favoriteGroup: '1960s|country', trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash'}
    ]}});
    flushSync();
    assert.equal(target.querySelectorAll('.fav-col.active').length, 2);
    target.querySelector('.fav-col').click(); flushSync();
    const saved = JSON.parse(localStorage.getItem('ts-favorites-v1'));
    assert.deepEqual(saved.DG['1950s|country'], [2]);
    assert.deepEqual(saved.DG['1960s|country'], [3]);
    assert.deepEqual(saved.COL, seed.COL);
    assert.equal(saved.DG['ALL|country'], undefined);
    assert.equal(target.querySelectorAll('.fav-col.active').length, 1);
    await unmount(component); target.replaceChildren();
});

await test('navigation advances repeated recordings and records original ranks in original programs', () => {
    for (const program of ['DG', 'COL']) {
        const groups = program === 'DG' ? ['1950s|country', '1960s|country'] : ['duets|specialty_mixes', 'legends|music_legends'];
        for (const group of groups) upsertProgram(`${program}|${group}`, group, 45);
        const tracks = groups.map((favoriteGroup, index) => ({
            rank: index + 1, sourceRank: index ? 3 : 7, rankingId: index + 1,
            favoriteGroup, spotifyTrackId: 'same-recording', trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash',
            ...(program === 'DG' ? {decadeSlug: favoriteGroup.split('|')[0], genreSlug: 'country'}
                : {collectionSlug: favoriteGroup.split('|')[0], collectionGroupSlug: favoriteGroup.split('|')[1]})
        }));
        let current = tracks[0];
        const selection = {mode: program === 'DG' ? 'decade_genre' : 'collection', programType: `FAVORITES_${program}`, context: {decade: 'ALL', genre: 'ALL', collection_group_slug: 'ALL'}};
        const navigation = createCarModeNavigation({
            getCurrentTrack: () => current, getTracks: () => tracks, getSelection: () => selection,
            getPlaybackSettings: () => ({playbackOrder: 'up', skipPlayed: true}),
            setCurrentTrack: track => (current = track), setCurrentRank: () => {},
            stopNarrationAudio: () => {}, stopCurrentNarrationPhase: () => {}, stopBed: () => {},
            stopPlayback: async () => {}, markUserStartedPlayback: () => {}, setUserStartedPlayback: () => {},
            playTrack: async () => {}, startAutoPlay: async () => {}
        });
        assert.equal(navigation.queueNext().rank, 2);
        const history = get(programHistoryStore).find(item => item.key === `${program}|${groups[0]}`);
        assert.deepEqual(history.playedRanks, [7]);
        assert.equal(history.total, 45);
        // Favorites remain eligible despite Favor New being enabled elsewhere.
        assert.equal(navigation.queueNext().rank, 1);
    }
});

await rm(temp, {recursive: true, force: true});
window.happyDOM.abort();
