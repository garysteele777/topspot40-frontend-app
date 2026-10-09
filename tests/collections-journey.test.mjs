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
    stdin: {contents: `export {default as CollectionsJourneyPanel} from './src/lib/components/journey/CollectionsJourneyPanel.svelte';
export {favoritesStore} from './src/lib/favorites/favorites';
export {programHistoryStore} from './src/lib/carmode/programHistory';
export {collectionCounts} from './src/lib/journey/collectionsHistory';
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
const {CollectionsJourneyPanel, favoritesStore, programHistoryStore, collectionCounts, get, mount, unmount, flushSync} = await import(pathToFileURL(outfile).href);


const collectionGroups = [{name:'Heritage',slug:'heritage',items:[{name:'Railroads',slug:'railroads'},{name:'Western',slug:'western'}]}, {name:'Mixes',slug:'mixes',items:[{name:'Duets',slug:'duets'}]}];
const favorites = {DG:{'1950s|country':[1]},COL:{'railroads|heritage':[1,2],'western|heritage':[3],'duets|mixes':[4]}};
const history = ['COL|railroads|heritage','COL|western|heritage','COL|duets|mixes','DG|1950s|country'].map((key,i)=>({key,label:key,total:10+i,playedRanks:[1,2],updatedAt:10}));
const target = document.createElement('div'); document.body.append(target);
function seed() { favoritesStore.set(structuredClone(favorites));localStorage.setItem('ts_program_history_v1',JSON.stringify(history));programHistoryStore.set(structuredClone(history)); }
function click(text) { const b=[...target.querySelectorAll('button')].find(b=>b.textContent.trim()===text || b.getAttribute('aria-label')===text); assert.ok(b,text);b.click();flushSync(); }
await test('group totals count exact source lists once',()=> {
    assert.deepEqual(collectionCounts(history,favorites,['railroads|heritage','western|heritage']),{collections:2,total:21,played:4,favorites:3});
});
await test('group favorites clearing cancels safely then persists and refreshes, preserving history and other categories',async()=>{
    seed(); const c=mount(CollectionsJourneyPanel,{target,props:{collectionGroups}});flushSync();
    click('Expand group Heritage'); assert.match(target.textContent,/4 \/ 21 tracks played/);
    click('Clear favorites for Heritage');click('Cancel');assert.deepEqual(get(favoritesStore),favorites);
    click('Clear favorites for Heritage');click('Confirm Clear Favorites');
    assert.deepEqual(get(favoritesStore),{DG:favorites.DG,COL:{'duets|mixes':[4]}});
    assert.deepEqual(JSON.parse(localStorage.getItem('ts-favorites-v1')),get(favoritesStore));
    assert.deepEqual(get(programHistoryStore),history);
    assert.match(target.querySelector('.cards').textContent,/★ 0 favorites/);
    await unmount(c);target.replaceChildren();
});
await test('individual and all history reset preserves totals, favorites and Nostalgia; cancel leaves history intact',async()=>{
    seed();const c=mount(CollectionsJourneyPanel,{target,props:{collectionGroups}});flushSync();
    click('Expand group Heritage');click('Clear history for Railroads');click('Cancel');
    assert.deepEqual(get(programHistoryStore),history);
    click('Clear history for Western');click('Confirm Clear Listening History');
    assert.deepEqual(get(programHistoryStore)[0],history[0]);assert.deepEqual(get(programHistoryStore)[1],{...history[1],playedRanks:[]});
    assert.deepEqual(get(favoritesStore),favorites);
    click('Clear All Listening History');click('Confirm Clear Listening History');
    assert.ok(get(programHistoryStore).slice(0,3).every(h=>!h.playedRanks.length));assert.deepEqual(get(programHistoryStore)[3],history[3]);
    assert.ok([...target.querySelectorAll('button')].find(b=>b.textContent==='Clear All Listening History').disabled);
    click('Clear All Favorites');click('Confirm Clear Favorites');assert.deepEqual(get(favoritesStore),{DG:favorites.DG,COL:{}});
    assert.deepEqual(JSON.parse(localStorage.getItem('ts_program_history_v1')),get(programHistoryStore));
    await unmount(c);target.replaceChildren();
});
await rm(temp,{recursive:true,force:true});
