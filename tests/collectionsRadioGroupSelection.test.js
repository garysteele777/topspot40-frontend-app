// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';

const helpers = await import('../src/lib/journey/collectionsRadioGroups.ts');

const groups = [
    {slug: 'american_heritage_favorites', name: 'American Heritage Favorites', items: [], totalTracks: 225},
    {slug: 'music_legends', name: 'Music Legends', items: [], totalTracks: 354},
    {slug: 'stage_and_screen', name: 'Stage & Screen', items: [], totalTracks: 222}
];

test('Collections Radio defaults and normalization retain catalog order and remove duplicates', () => {
    assert.deepEqual(
        helpers.normalizeCollectionsRadioGroups(['stage_and_screen', ' MUSIC_LEGENDS ', 'stage_and_screen'], groups),
        ['music_legends', 'stage_and_screen']
    );
    assert.deepEqual(helpers.normalizeCollectionsRadioGroups(groups.map(group => group.slug), groups), groups.map(group => group.slug));
    assert.equal(helpers.collectionsRadioStationLabel('', 'ALL', groups), 'ALL');
    assert.equal(helpers.collectionsRadioStationLabel('stage_and_screen,music_legends', 'ALL', groups), 'CUSTOM');
    assert.equal(helpers.collectionsRadioStationLabel('music_legends', 'ALL', groups), 'Music Legends');
});

test('repeated Collection Group URL parameters become the Car Mode custom selection', async () => {
    const source = await readFile(new URL('../src/lib/helpers/car/selectionFromUrl.ts', import.meta.url), 'utf8');
    assert.match(source, /sp\.getAll\('collection_groups'\)/);
    assert.match(source, /radioCollectionGroups/);
    assert.match(source, /collection_group_slug: group/);
});

test('selector separates selected state from preview and includes required persistence controls', async () => {
    const source = await readFile(new URL('../src/lib/components/options-v2/CollectionsRadioGroupSelection.svelte', import.meta.url), 'utf8');
    assert.match(source, /COLLECTIONS_RADIO_STORAGE_KEY/);
    assert.match(source, /urlValues.length > 0/);
    assert.match(source, /Select All Collection Groups/);
    assert.match(source, /Clear All Collection Groups/);
    assert.match(source, /\{selectedCount\} of \{groups\.length\} Collection Groups selected/);
    assert.match(source, /Continue with \$\{selectedCount\} Collection Groups/);
    assert.match(source, /class:selected=/);
    assert.match(source, /class:preview=/);
    assert.match(source, /previewGroup\.items/);
});

test('Collections Radio uses compatibility URLs, payload arrays, route rendering, and a Change Music return URL', async () => {
    const panel = await readFile(new URL('../src/lib/components/options-v2/InteractiveRadioPanel.svelte', import.meta.url), 'utf8');
    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const route = await readFile(new URL('../src/routes/journey-prototype/radio/+page.svelte', import.meta.url), 'utf8');
    assert.match(panel, /common\.append\('collection_groups', slug\)/);
    assert.match(panel, /collection_group', group/);
    assert.match(panel, /window\.location\.pathname\}\$\{window\.location\.search\}/);
    assert.match(carPage, /collection_group_slugs: sel\.context\.radioCollectionGroups\.split\(','\)/);
    assert.match(carPage, /selectedCollectionGroupAllowed/);
    assert.match(carPage, /COLLECTIONS RADIO/);
    assert.match(route, /journeyFamily="collections"/);
});

test('Collections Radio establishes its guest session before startup playback resets', async () => {
    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    // The production startup first establishes the protected guest session in
    // its own try/catch, then loads the catalog.  Slice by stable boundaries
    // instead of treating the catalog try as the first try after selection.
    const start = carPage.indexOf('currentSelection.set(sel);');
    const end = carPage.indexOf('const normalized = await loadCatalogOnce();', start);
    const startup = start >= 0 && end >= 0 ? carPage.slice(start, end) : '';

    assert.match(startup, /sel\.programType === PROGRAM_TYPES\.RADIO_COL/);
    assert.match(startup, /await startGuestPlaybackSession\(\)/);
    assert.match(startup, /await resetPlaybackApi\(\)/);
    assert.ok(
        startup.indexOf('await startGuestPlaybackSession()') < startup.indexOf('await resetPlaybackApi()'),
        'Collections Radio must establish its guest session before resetting protected playback'
    );
    assert.ok(
        carPage.indexOf('await startGuestPlaybackSession()', carPage.indexOf('const mountedSettings = get(playbackSettingsStore);')) <
        carPage.indexOf('await loadForSelection(sel, initialRank);'),
        'the guest session must also precede the loader reset'
    );
});

test('Car Mode identifies only multi-group Collections Radio selections as custom', async () => {
    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');

    assert.match(carPage, /if \(selected\.length > 1\) return 'CUSTOM';/);
    assert.match(carPage, /collectionRadioLabel === 'CUSTOM'/);
    assert.match(carPage, /`\$\{uiDecade\} • \$\{collectionRadioLabel\}`/);
});

test('Auto Play starts Collections Radio from PAUSED Track 0 of 1 instead of resuming its placeholder', async () => {
    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const autoPlayHandler = carPage.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const initialStart = carPage.match(/async function startInitialCollectionsRadioSet\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(carPage, /selection\?\.programType === PROGRAM_TYPES\.RADIO_COL &&\s*\(!track \|\| track\.rank <= 0 \|\| !track\.spotifyTrackId\)/);
    assert.match(autoPlayHandler, /if \(needsInitialCollectionsRadioStart\(\)\) \{[\s\S]*?reserveBackendRadioSpotifyWindow\(\)[\s\S]*?await startInitialCollectionsRadioSet\(\);\s*return;/);
    assert.ok(
        autoPlayHandler.indexOf('needsInitialCollectionsRadioStart()') < autoPlayHandler.indexOf('if (!$currentTrack) return;'),
        'the rank-0 or missing-current-track state must start a set before generic resume handling'
    );
    assert.match(initialStart, /await playTrack\(collectionsRadioStartupTrack\(\)\)/);
    assert.match(initialStart, /acceptRadioContext: selectedCollectionGroupAllowed/);
    assert.match(carPage, /collection_group_slugs: sel\.context\.radioCollectionGroups\.split\(','\)/);
    assert.match(carPage, /fetch\(`\$\{API_BASE\}\/playback\/play-track`/);
});
