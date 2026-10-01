// @ts-nocheck -- Runtime component tests use Node and a simulated browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdtemp, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {build} from 'esbuild';
import {compile} from 'svelte/compiler';
import {Window} from 'happy-dom';

// Mount the real compiled player with deterministic media and API adapters.
// This tests component transitions; actual phone audio remains an acceptance check.
const root = fileURLToPath(new URL('../', import.meta.url));
const window = new Window({url: 'http://localhost:5173'});
for (const name of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement',
    'HTMLMediaElement', 'HTMLAudioElement', 'Text', 'Comment', 'DocumentFragment', 'Event',
    'CustomEvent', 'MutationObserver']) {
    Object.defineProperty(globalThis, name, {value: name === 'window' ? window : window[name], configurable: true});
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;

const bundled = await build({
    stdin: {contents: `export {default as Player} from './src/lib/musicDocuseries/DocuseriesPlayer.svelte';
        export {mount, unmount, flushSync} from 'svelte';
        export {docuseriesHistoryStore} from './src/lib/musicDocuseries/history.ts';`,
        resolveDir: root, sourcefile: 'docuseries-test-entry.js'},
    bundle: true, write: false, platform: 'browser', format: 'esm', conditions: ['browser'],
    define: {'import.meta.env': '{}'},
    plugins: [{name: 'svelte-test', setup(builder) {
        builder.onResolve({filter: /^\$lib\//}, args => {
            const path = `${root}src/lib/${args.path.slice(5)}`;
            return {path: existsSync(path) ? path : `${path}.ts`};
        });
        builder.onResolve({filter: /^\$app\/navigation$/}, () => ({path: 'navigation', namespace: 'test-app'}));
        builder.onLoad({filter: /.*/, namespace: 'test-app'}, () => ({contents: 'export async function goto(path) { globalThis.__docNavigation = path; }'}));
        builder.onLoad({filter: /\.svelte$/}, async args => ({contents: compile(await readFile(args.path, 'utf8'),
            {filename: args.path, generate: 'client', css: 'injected'}).js.code, loader: 'js'}));
    }}]
});
const temporary = await mkdtemp(join(tmpdir(), 'topspot-player-test-'));
const modulePath = join(temporary, 'player.mjs');
await writeFile(modulePath, bundled.outputFiles[0].text);
const {Player, mount, unmount, flushSync, docuseriesHistoryStore} = await import(pathToFileURL(modulePath).href);
await rm(temporary, {recursive: true});

const media = new WeakMap();
function state(element) {
    if (!media.has(element)) media.set(element, {time: 0, ranges: [], paused: true});
    return media.get(element);
}
const prototype = window.HTMLMediaElement.prototype;
Object.defineProperties(prototype, {
    currentTime: {get() {return state(this).time;}, set(value) {state(this).time = value;}, configurable: true},
    duration: {get() {return 100;}, configurable: true},
    played: {get() {const ranges = state(this).ranges; return {length: ranges.length, start: i => ranges[i][0], end: i => ranges[i][1]};}, configurable: true},
    paused: {get() {return state(this).paused;}, configurable: true}
});
prototype.play = async function() {state(this).paused = false; this.dispatchEvent(new window.Event('play'));};
prototype.pause = function() {state(this).paused = true; this.dispatchEvent(new window.Event('pause'));};
prototype.load = function() {media.set(this, {time: 0, ranges: [], paused: true});};

const stories = [1, 2, 3].map(id => ({id, slug: `story_${id}`, title: `Story ${id}`, sort_order: id}));
let requested = [];
globalThis.fetch = async (input) => {
    const url = new URL(input);
    requested.push(url);
    if (url.pathname.endsWith('/collections')) return new Response(JSON.stringify([{id: 1, slug: 'history_eras', name: 'History & Eras', sort_order: 1}]));
    if (url.pathname.endsWith('/items')) return new Response(JSON.stringify(stories));
    const slug = url.searchParams.get('slug');
    return new Response(JSON.stringify({ok: true, slug, title: stories.find(item => item.slug === slug)?.title,
        tts_bucket: 'audio-en', tts_key: `${slug}.mp3`, duration_seconds: 100,
        bed_bucket: 'audio-en', bed_key: 'bed.mp3'}));
};

let instance;
let target;
async function waitFor(predicate) {
    for (let attempt = 0; attempt < 100; attempt++) {
        flushSync();
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.fail(`Condition did not become true. UI: ${target?.textContent}`);
}
async function open(search, completed = {}) {
    requested = [];
    window.localStorage.clear();
    window.localStorage.setItem('ts_docuseries_history_v1', JSON.stringify(completed));
    docuseriesHistoryStore.set({});
    target = window.document.createElement('div');
    window.document.body.append(target);
    instance = mount(Player, {target, props: {search}});
    await waitFor(() => target.querySelector('.controls button') && !target.querySelector('.controls button').disabled);
    return target.querySelector('audio');
}
function button(label) {flushSync(); return [...target.querySelectorAll('button')].find(item => item.textContent.includes(label));}
function heard(audio, seconds) {state(audio).time = seconds; state(audio).ranges = [[0, seconds]]; audio.dispatchEvent(new window.Event('timeupdate')); flushSync();}
async function close() {if (instance) await unmount(instance); target?.remove(); instance = null;}

test('group intro plays once, then all stories in order and stops; skipped audio is not marked complete', async () => {
    try {
        const audio = await open('?type=music_docuseries&collection=history_eras&language=en&group=all');
        button('Start Group').click();
        await waitFor(() => audio.src.includes('/group-intros/en/history_eras.mp3'));
        heard(audio, 100);
        assert.deepEqual(JSON.parse(window.localStorage.getItem('ts_docuseries_history_v1')), {}, 'The intro is not a completed story');
        audio.dispatchEvent(new window.Event('ended'));
        await waitFor(() => audio.src.endsWith('/story_1.mp3'));
        heard(audio, 20);
        button('Next Story').click();
        await waitFor(() => audio.src.endsWith('/story_2.mp3'));
        assert.deepEqual(JSON.parse(window.localStorage.getItem('ts_docuseries_history_v1')), {});
        heard(audio, 90);
        audio.dispatchEvent(new window.Event('ended'));
        await waitFor(() => audio.src.endsWith('/story_3.mp3'));
        const history = JSON.parse(window.localStorage.getItem('ts_docuseries_history_v1'));
        assert.ok(history.story_2);
        assert.equal(history.story_3, undefined, 'Previous story ranges must not mark the next story complete');
        heard(audio, 100);
        audio.dispatchEvent(new window.Event('ended'));
        await waitFor(() => target.textContent.includes('Group finished'));
        assert.equal(audio.getAttribute('src'), null);
        assert.equal(audio.paused, true);
    } finally {await close();}
});

test('Play Unheard respects shared history in Spanish and never plays an introduction', async () => {
    try {
        const audio = await open('?type=music_docuseries&collection=history_eras&language=es&group=unheard', {story_1: 123, story_3: 456});
        const start = [...target.querySelectorAll('button')].find(item => item.textContent.includes('Iniciar grupo'));
        start.click();
        await waitFor(() => audio.src.endsWith('/story_2.mp3'));
        assert.equal(requested.filter(url => url.pathname.endsWith('/play')).every(url => url.searchParams.get('language') === 'es'), true);
        heard(audio, 100);
        audio.dispatchEvent(new window.Event('ended'));
        await waitFor(() => target.textContent.includes('Grupo finalizado'));
    } finally {await close();}
});

test('Pause resumes this session, Stop restarts at zero, and navigating away releases narration and bed', async () => {
    try {
        const audio = await open('?type=music_docuseries&slug=story_1&language=en');
        button('Play Story').click();
        await waitFor(() => audio.src.endsWith('/story_1.mp3'));
        heard(audio, 45);
        button('Pause').click();
        assert.equal(audio.paused, true);
        button('Resume').click();
        await waitFor(() => !audio.paused);
        assert.equal(audio.currentTime, 45);
        button('Stop').click();
        await waitFor(() => audio.getAttribute('src') === null);
        button('Play Story').click();
        await waitFor(() => audio.src.endsWith('/story_1.mp3'));
        assert.equal(audio.currentTime, 0);
        const bed = target.querySelectorAll('audio')[1];
        await close();
        assert.equal(audio.paused, true);
        assert.equal(bed.paused, true);
        assert.equal(audio.getAttribute('src'), null);
    } finally {await close();}
});

test('missing intro continues with story 1 and a seek near the end does not complete it', async () => {
    try {
        const audio = await open('?type=music_docuseries&collection=history_eras&language=en&group=all');
        button('Start Group').click();
        await waitFor(() => audio.src.includes('/group-intros/'));
        audio.dispatchEvent(new window.Event('error'));
        await waitFor(() => audio.src.endsWith('/story_1.mp3'));
        state(audio).time = 99;
        state(audio).ranges = [[0, 5], [98, 99]];
        audio.dispatchEvent(new window.Event('timeupdate'));
        flushSync();
        assert.deepEqual(JSON.parse(window.localStorage.getItem('ts_docuseries_history_v1')), {});
    } finally {await close();}
});
