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

// Mount the real access-code form with mocked HTTP responses.
const root = fileURLToPath(new URL('../', import.meta.url));
const window = new Window({url: 'http://localhost:5173'});
for (const name of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement',
    'HTMLMediaElement', 'HTMLAudioElement', 'Text', 'Comment', 'DocumentFragment', 'Event',
    'CustomEvent', 'MutationObserver']) {
    Object.defineProperty(globalThis, name, {value: name === 'window' ? window : window[name], configurable: true});
}
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;

globalThis.localStorage = window.localStorage;
const bundled = await build({
    stdin: {contents: `export {default as Form} from './src/lib/components/profile-components/AccessCodeForm.svelte';
        export {mount, unmount, flushSync} from 'svelte';`, resolveDir: root, sourcefile: 'access-code-test-entry.js'},
    bundle: true, write: false, platform: 'browser', format: 'esm', conditions: ['browser'],
    define: {'import.meta.env': '{}'},
    plugins: [{name: 'svelte-test', setup(builder) {
        builder.onResolve({filter: /^\$lib\//}, args => {
            const path = `${root}src/lib/${args.path.slice(5)}`;
            return {path: existsSync(`${path}.ts`) ? `${path}.ts` : path};
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
const {Form, mount, unmount, flushSync} = await import(pathToFileURL(modulePath).href);
await rm(temporary, {recursive: true});


async function waitFor(predicate) {
    for (let i = 0; i < 100; i++) {
        flushSync(); if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    assert.fail('UI did not settle');
}
async function open(language = 'en') {
    window.localStorage.setItem('topspot_language', language);
    const target = window.document.createElement('div');
    window.document.body.append(target);
    const applied = [];
    const instance = mount(Form, {target, props: {onApplied: value => applied.push(value)}});
    await waitFor(() => target.querySelector('input'));
    return {target, applied, close: async () => {await unmount(instance); target.remove();}};
}
function submit(target, value = ' SQUIRES67 ') {
    const input = target.querySelector('input');
    input.value = value;
    input.dispatchEvent(new window.Event('input', {bubbles: true}));
    target.querySelector('form').dispatchEvent(new window.Event('submit', {bubbles: true, cancelable: true}));
    flushSync();
}
const grant = {result: 'activated', complimentary_access: true, access_expires_at: null, redeemed_at: '2026-11-09T12:00:00Z'};

test('normalizes the code, includes credentials, and confirms unlimited access', async () => {
    const requests = [];
    globalThis.fetch = async (url, options) => {requests.push({url, options}); return Response.json(grant);};
    const ui = await open();
    try {
        submit(ui.target); await waitFor(() => ui.target.querySelector('.confirmation'));
        assert.equal(JSON.parse(requests[0].options.body).code, 'squires67');
        assert.equal(requests[0].options.credentials, 'include');
        assert.equal(requests[0].options.headers['X-TopSpot-Access-Code'], '1');
        assert.match(ui.target.textContent, /no expiration date/);
        assert.equal(ui.applied.length, 1);
        assert.equal(ui.target.querySelector('.continue').getAttribute('href'), '/dashboard');
    } finally {await ui.close();}
});

test('blocks duplicate submissions while waiting', async () => {
    let finish; let requests = 0;
    globalThis.fetch = () => {requests++; return new Promise(resolve => {finish = resolve;});};
    const ui = await open();
    try {
        submit(ui.target); submit(ui.target);
        assert.equal(requests, 1);
        assert.equal(ui.target.querySelector('button').disabled, true);
        finish(Response.json(grant)); await waitFor(() => ui.target.querySelector('.confirmation'));
    } finally {await ui.close();}
});
for (const [outcome, expected] of [
    ['invalid_code', /wasn’t recognized/], ['unavailable_code', /no longer available/],
    ['rate_limited', /15 minutes/], ['sign_in_required', /sign in/],
    ['paid_subscription', /does not cancel existing billing/]
]) test(`handles ${outcome} without granting access`, async () => {
    globalThis.fetch = async () => Response.json({result: outcome}, {status: 400});
    const ui = await open();
    try {
        submit(ui.target); await waitFor(() => ui.target.querySelector('[role="alert"]'));
        assert.match(ui.target.textContent, expected);
        assert.equal(ui.applied.length, 0);
        assert.equal(ui.target.querySelector('.confirmation'), null);
    } finally {await ui.close();}
});
test('shows dated access and does not promise active access for an expired repeat', async () => {
    let result = {...grant, access_expires_at: '2030-12-31T23:59:59Z'};
    globalThis.fetch = async () => Response.json(result);
    const ui = await open();
    try {
        submit(ui.target); await waitFor(() => ui.target.querySelector('.confirmation'));
        assert.match(ui.target.textContent, /2030/);
        assert.doesNotMatch(ui.target.textContent, /no expiration date/);
        result = {...grant, result: 'already_redeemed', access_expires_at: '2020-01-01T00:00:00Z'};
        submit(ui.target); await waitFor(() => ui.target.textContent.includes('already applied'));
        assert.match(ui.target.textContent, /access has ended/);
        assert.doesNotMatch(ui.target.textContent, /access is active/);
    } finally {await ui.close();}
});
for (const [language, title, success] of [
    ['es', '¿Tienes un código de acceso?', /fecha de vencimiento/],
    ['ptbr', 'Tem um código de acesso?', /data de expiração/]
]) test(`localizes redemption in ${language}`, async () => {
    globalThis.fetch = async () => Response.json(grant);
    const ui = await open(language);
    try {
        await waitFor(() => ui.target.textContent.includes(title));
        submit(ui.target); await waitFor(() => ui.target.querySelector('.confirmation'));
        assert.match(ui.target.textContent, success);
    } finally {await ui.close();}
});
test('network and malformed responses allow retry without granting access', async () => {
    const ui = await open();
    try {
        for (const fetcher of [async () => {throw new Error('offline');}, async () => Response.json({result: 'activated'})]) {
            globalThis.fetch = fetcher; submit(ui.target);
            await waitFor(() => ui.target.querySelector('[role="alert"]'));
            assert.equal(ui.applied.length, 0);
        }
    } finally {await ui.close();}
});
