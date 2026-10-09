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
    stdin: {contents: `export {default as NostalgiaJourneyPanel} from './src/lib/components/journey/NostalgiaJourneyPanel.svelte';
export {favoritesStore} from './src/lib/favorites/favorites';
export {programHistoryStore} from './src/lib/carmode/programHistory';
export {nostalgiaGroups} from './src/lib/journey/nostalgia';
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
const {NostalgiaJourneyPanel, favoritesStore, programHistoryStore, nostalgiaGroups, get, mount, unmount, flushSync} = await import(pathToFileURL(outfile).href);

const favorites = {DG: {'1950s|country': [1, 2], '1960s|country': [3], '1950s|rock': [4]}, COL: {'duets|specialty_mixes': [9]}};
const history = ['DG|1950s|country', 'DG|1960s|country', 'DG|1950s|rock', 'COL|duets|specialty_mixes'].map(key => ({key, label: key, total: 45, playedRanks: [1, 2], updatedAt: 10}));
const target = document.createElement('div'); document.body.append(target);
function seed() {
    favoritesStore.set(structuredClone(favorites));
    localStorage.setItem('ts_program_history_v1', JSON.stringify(history));
    programHistoryStore.set(structuredClone(history));
}
function click(text) { const button = [...target.querySelectorAll('button')].find(b => b.textContent.trim() === text); assert.ok(button, text); button.click(); flushSync(); }
function choose(label) { const button = [...target.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label); assert.ok(button, label); button.click(); flushSync(); }
await test('row, column, cell and all select exact source programs; empty scopes select nothing', () => {
    assert.equal(nostalgiaGroups({decade: 'ALL', genre: 'country'}).length, 8);
    assert.equal(nostalgiaGroups({decade: '1950s', genre: 'ALL'}).length, 8);
    assert.deepEqual(nostalgiaGroups({decade: '1950s', genre: 'country'}), ['1950s|country']);
    assert.equal(nostalgiaGroups({decade: 'ALL', genre: 'ALL'}).length, 64);
    assert.deepEqual(nostalgiaGroups({decade: '', genre: ''}), []);
    assert.deepEqual(nostalgiaGroups({decade: 'ALL', genre: 'invalid'}), []);
});
await test('favorites confirmation cancels safely, then clears a genre across decades and persists only selected lists', async () => {
    seed(); const component = mount(NostalgiaJourneyPanel, {target}); flushSync();
    assert.match(target.textContent, /No programs selected/);
    assert.equal([...target.querySelectorAll('button')].find(b => b.textContent === 'Clear Favorites').disabled, true);
    choose('Select Country across all decades'); assert.match(target.textContent, /8 programs selected · 4 played entries · 3 favorites/);
    click('Clear Favorites'); assert.deepEqual(get(favoritesStore), favorites);
    click('Cancel'); assert.deepEqual(get(favoritesStore), favorites);
    click('Clear Favorites'); click('Confirm Clear Favorites');
    assert.deepEqual(get(favoritesStore), {DG: {'1950s|rock': [4]}, COL: favorites.COL});
    assert.deepEqual(JSON.parse(localStorage.getItem('ts-favorites-v1')), get(favoritesStore));
    assert.deepEqual(get(programHistoryStore), history);
    assert.ok(target.querySelector('[aria-label="Select 1950s Country, 2 played, 0 favorites"]'));
    assert.ok(target.querySelector('[aria-label="Select 1960s Country, 2 played, 0 favorites"]'));
    assert.ok(target.querySelector('[aria-label="Select 1950s Rock, 2 played, 1 favorites"]'));
    await unmount(component); target.replaceChildren();
});
await test('cell selection replaces column selection; history reset retains favorites, other decades, totals, and Collections', async () => {
    seed(); const component = mount(NostalgiaJourneyPanel, {target}); flushSync();
    choose('Select all genres in 1950s'); assert.match(target.textContent, /8 programs selected/);
    choose('Select 1950s Country, 2 played, 2 favorites'); assert.match(target.textContent, /1 programs selected/);
    click('Clear Listening History'); click('Confirm Clear Listening History');
    const saved = JSON.parse(localStorage.getItem('ts_program_history_v1'));
    assert.deepEqual(saved[0], {...history[0], playedRanks: []});
    assert.deepEqual(saved.slice(1), history.slice(1)); assert.deepEqual(get(favoritesStore), favorites);
    const cell = target.querySelector('[aria-label="Select 1950s Country, 0 played, 2 favorites"]');
    assert.ok(cell); assert.match(cell.textContent, /0 played/);
    assert.equal(cell.getAttribute('aria-pressed'), 'true');
    assert.ok(target.querySelector('[aria-label="Select 1960s Country, 2 played, 1 favorites"]'));
    click('Select All Nostalgia Programs'); assert.match(target.textContent, /64 programs selected/);
    click('Clear Listening History'); click('Confirm Clear Listening History');
    assert.ok(get(programHistoryStore).filter(h => h.key.startsWith('DG|')).every(h => h.playedRanks.length === 0));
    assert.deepEqual(get(programHistoryStore)[3], history[3]);
    click('Clear Favorites'); click('Confirm Clear Favorites');
    assert.deepEqual(get(favoritesStore), {DG: {}, COL: favorites.COL});
    await unmount(component); target.replaceChildren();
});
await test('mobile dropdowns select the same scope as matrix headers', async () => {
    seed(); const component = mount(NostalgiaJourneyPanel, {target}); flushSync();
    const selects = [...target.querySelectorAll('select')];
    for (const [index, value] of [[0, 'ALL'], [1, 'country']]) {
        const select = selects[index];
        const querySelector = select.querySelector.bind(select);
        select.querySelector = selector => selector === ':checked' ? [...select.options].find(o => o.selected) ?? null : querySelector(selector);
        for (const option of select.options) option.selected = option.value === value;
        select.dispatchEvent(new Event('change', {bubbles: true})); flushSync();
    }
    assert.match(target.textContent, /8 programs selected · 4 played entries · 3 favorites/);
    click('Clear Selection'); assert.match(target.textContent, /No programs selected/);
    await unmount(component); target.replaceChildren();
});
await rm(temp, {recursive: true, force: true});
