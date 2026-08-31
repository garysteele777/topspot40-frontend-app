// @ts-nocheck -- runs the root server load through Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {load} = await import('../src/routes/+page.server.ts');

async function expectRedirect({accessToken, fetch}, location) {
    await assert.rejects(
        () => load({
            cookies: {get: () => accessToken},
            fetch
        }),
        error => error?.status === 302 && error?.location === location
    );
}

test('root without an access token redirects to language selection without calling auth', async () => {
    let fetchCalled = false;

    await expectRedirect({
        accessToken: undefined,
        fetch: async () => {
            fetchCalled = true;
            return {ok: true};
        }
    }, '/journey-prototype');

    assert.equal(fetchCalled, false);
});

test('root sends an authenticated visitor to dashboard', async () => {
    await expectRedirect({
        accessToken: 'valid-token',
        fetch: async (url, options) => {
            assert.match(url, /\/api\/auth\/me$/);
            assert.equal(options.headers.cookie, 'access_token=valid-token');
            return {ok: true};
        }
    }, '/dashboard');
});

test('root sends non-OK authentication responses to language selection', async () => {
    await expectRedirect({
        accessToken: 'expired-token',
        fetch: async () => ({ok: false})
    }, '/journey-prototype');
});

test('root sends authentication fetch failures to language selection', async () => {
    await expectRedirect({
        accessToken: 'unreachable-token',
        fetch: async () => {
            throw new Error('backend unavailable');
        }
    }, '/journey-prototype');
});

test('language selection preserves the first-visit path and skips welcome for a valid remembered language', async () => {
    const languagePage = await readFile(
        new URL('../src/routes/journey-prototype/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(languagePage, /let hasChosenLanguage = false;/);
    assert.match(languagePage, /function setLanguage\(value: LandingLanguage\) \{[\s\S]*?writeLanguagePreference\(value\);/);
    assert.match(languagePage, /function performContinueJourney\(\) \{\s*goto\('\/welcome'\);/s);
    assert.match(languagePage, /if \(savedLanguage\)[\s\S]*?goto\('\/journey-prototype\/choose',\s*\{\s*replaceState: true/s);
    assert.doesNotMatch(languagePage, /goto\('\/'/);
});

test('root fallback is inert and active source contains no legacy catalog caller', async () => {
    const rootPage = await readFile(
        new URL('../src/routes/+page.svelte', import.meta.url),
        'utf8'
    );
    const legacyCatalogPath = '/catalog/' + 'index.html';

    assert.match(rootPage, /Redirecting…/);
    assert.doesNotMatch(rootPage, /<script/);

    async function filesIn(directory) {
        const entries = await readdir(new URL(directory, import.meta.url), {
            withFileTypes: true
        });
        const files = await Promise.all(entries.map(async entry => {
            const child = `${directory}/${entry.name}`;
            return entry.isDirectory() ? filesIn(child) : [child];
        }));
        return files.flat();
    }

    for (const directory of ['../src', '../tests']) {
        for (const file of await filesIn(directory)) {
            const content = await readFile(new URL(file, import.meta.url), 'utf8');
            assert.equal(content.includes(legacyCatalogPath), false, file);
        }
    }
});
