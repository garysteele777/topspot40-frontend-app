// @ts-nocheck -- exercises the small client integration with a PostHog test double.
import test from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';
import { readFile } from 'node:fs/promises';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    captureExperienceSelected,
    captureLanguageSelected,
    captureProgramSelected,
    captureProgramStarted,
    captureSpotifyOpen,
    identifyPostHogUser,
    resetPostHog,
    syncPostHogIdentity
} = await import('../src/lib/analytics/posthog.ts');
const { createCarModeSpotify } = await import('../src/lib/carmode/CarModeSpotify.ts');

function client(previousUserId) {
    const calls = [];
    return {
        calls,
        init: (...args) => calls.push(['init', ...args]),
        identify: (...args) => calls.push(['identify', ...args]),
        capture: (...args) => calls.push(['capture', ...args]),
        get_property: () => previousUserId,
        reset: () => calls.push(['reset'])
    };
}

test('newly authenticated users and normal sign-ins identify with the backend UUID', () => {
    for (const userId of ['new-user-uuid', 'returning-user-uuid']) {
        const posthog = client();
        assert.equal(identifyPostHogUser(posthog, { id: userId }), true);
        assert.deepEqual(posthog.calls, [['identify', userId, undefined]]);
    }
});

test('the normal sign-in path identifies from its successful backend session response before navigation', async () => {
    const page = await readFile(new URL('../src/routes/signin/+page.svelte', import.meta.url), 'utf8');
    const responseCheck = page.indexOf('if (!response.ok)');
    const identify = page.indexOf('identifyPostHogUser(posthog, { id: result?.user_id })');
    const dashboardNavigation = page.indexOf("await goto('/dashboard')");
    const completionNavigation = page.indexOf("await goto('/complete-profile')");

    assert.ok(responseCheck < identify);
    assert.ok(identify < dashboardNavigation);
    assert.ok(identify < completionNavigation);
});

test('restored authenticated sessions identify from /api/auth/me and may set its returned email', async () => {
    const posthog = client();
    const calls = [];
    const identified = await syncPostHogIdentity(posthog, async (url, options) => {
        calls.push([url, options]);
        return { ok: true, json: async () => ({ id: 'restored-user-uuid', email: 'member@example.com' }) };
    }, 'https://api.example.test');

    assert.equal(identified, true);
    assert.deepEqual(calls, [['https://api.example.test/api/auth/me', { credentials: 'include' }]]);
    assert.deepEqual(posthog.calls, [['identify', 'restored-user-uuid', { email: 'member@example.com' }]]);
});

test('anonymous sessions stay anonymous when /api/auth/me is unauthenticated', async () => {
    const posthog = client();
    assert.equal(await syncPostHogIdentity(posthog, async () => ({ ok: false }), 'https://api.example.test'), false);
    assert.deepEqual(posthog.calls, []);
});

test('switching accounts resets the prior identified user and logout resets identity', () => {
    const posthog = client('first-user-uuid');
    assert.equal(identifyPostHogUser(posthog, { id: 'second-user-uuid' }), true);
    resetPostHog(posthog);
    assert.deepEqual(posthog.calls, [
        ['reset'],
        ['identify', 'second-user-uuid', undefined],
        ['reset']
    ]);
});

test('Spotify captures use an immediate beacon before Android navigation', () => {
    const posthog = client();
    captureSpotifyOpen(posthog, { action_source: 'guided_play', track_rank: 4 });
    assert.deepEqual(posthog.calls, [[
        'capture',
        'spotify_opened',
        { action_source: 'guided_play', track_rank: 4 },
        { send_instantly: true, transport: 'sendBeacon' }
    ]]);

    const originalWindow = globalThis.window;
    const originalNavigator = globalThis.navigator;
    const originalLocalStorage = globalThis.localStorage;
    const sequence = [];
    const location = {};
    Object.defineProperty(location, 'href', { set: () => sequence.push('navigate') });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location } });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { userAgent: 'Android' } });
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: () => {} } });

    try {
        const spotify = createCarModeSpotify({
            getGuidedReady: () => true,
            setStatus: () => {},
            captureSpotifyOpen: () => sequence.push('capture')
        });
        spotify.open({ spotifyTrackId: 'spotify-track', rankingId: 4, rank: 4, trackName: 'Track', artistName: 'Artist' });
        assert.deepEqual(sequence, ['capture', 'navigate']);
    } finally {
        Object.defineProperty(globalThis, 'window', { configurable: true, value: originalWindow });
        Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
        Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalLocalStorage });
    }
});

test('Spotify open analytics preserves stable program and Radio selection context', async () => {
    const source = await readFile(
        new URL('../src/routes/car-page/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(source, /program_type:\s*selection\?\.programType\s*\?\?\s*null/);
    assert.match(source, /radio_genres:\s*context\?\.radioGenres\s*\?\?\s*null/);
    assert.match(source, /radio_collection_groups:\s*context\?\.radioCollectionGroups\s*\?\?\s*null/);
    assert.match(source, /artist_radio_genres:\s*context\?\.artistRadioGenres\s*\?\?\s*null/);
});
test('program started capture sends only the provided non-sensitive program properties', () => {
    const posthog = client();

    captureProgramStarted(posthog, {
        program_type: 'PROGRAM_DG',
        playback_method: 'guided',
        language: 'en',
        decade: '1980s',
        genre: 'pop'
    });

    assert.deepEqual(posthog.calls, [[
        'capture',
        'program_started',
        {
            program_type: 'PROGRAM_DG',
            playback_method: 'guided',
            language: 'en',
            decade: '1980s',
            genre: 'pop'
        }
    ]]);
});

test('language selected capture sends only the chosen language', () => {
    const posthog = client();

    captureLanguageSelected(posthog, 'es');

    assert.deepEqual(posthog.calls, [[
        'capture',
        'language_selected',
        { language: 'es' }
    ]]);
});

test('experience selected capture sends only the stable experience type', () => {
    const posthog = client();

    captureExperienceSelected(posthog, 'collections');

    assert.deepEqual(posthog.calls, [[
        'capture',
        'experience_selected',
        { experience_type: 'collections' }
    ]]);
});

test('Interactive Radio launch paths record stable program_selected analytics', async () => {
    const source = await readFile(
        new URL('../src/lib/components/options-v2/InteractiveRadioPanel.svelte', import.meta.url),
        'utf8'
    );

    assert.match(source, /captureProgramSelected\(posthog,\s*\{[\s\S]*?program_type:\s*'radio_nostalgia'/);
    assert.match(source, /captureProgramSelected\(posthog,\s*\{[\s\S]*?program_type:\s*'radio_collections'/);
    assert.match(source, /captureProgramSelected\(posthog,\s*\{[\s\S]*?program_type:\s*'radio_artist'/);
});
test('program selected capture sends only the provided stable program properties', () => {
    const posthog = client();

    captureProgramSelected(posthog, {
        program_type: 'collections',
        collection_group_slug: 'decades',
        collection_slug: 'best-of-1980s'
    });

    assert.deepEqual(posthog.calls, [[
        'capture',
        'program_selected',
        {
            program_type: 'collections',
            collection_group_slug: 'decades',
            collection_slug: 'best-of-1980s'
        }
    ]]);
});
