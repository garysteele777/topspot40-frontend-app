import assert from 'node:assert/strict';
import test from 'node:test';
import { selectFavoriteEntries } from '../src/lib/favorites/playback.ts';

test('12 and 10 decade favorites produce 22 entries, retaining both source intros', () => {
    const data = {
        DG: {
            '1950s|country': Array.from({ length: 12 }, (_, i) => i + 1),
            '1960s|country': Array.from({ length: 10 }, (_, i) => i + 1),
            '1960s|rock': [30]
        },
        COL: { 'johnny_cash|music_legends': [1] }
    };
    const before = structuredClone(data);
    const entries = selectFavoriteEntries(data, { program: 'DG', genre: 'country' });
    assert.equal(entries.length, 22);
    assert.deepEqual(entries.filter(entry => entry.rankingId === 1), [
        { program: 'DG', group: '1950s|country', rankingId: 1, decade: '1950s', genre: 'country' },
        { program: 'DG', group: '1960s|country', rankingId: 1, decade: '1960s', genre: 'country' }
    ]);
    assert.equal(selectFavoriteEntries(data, { program: 'DG' }).length, 23);
    assert.deepEqual(data, before);
});

test('collections stay separate and filter by collection group', () => {
    const data = {
        DG: { '1950s|country': [1] },
        COL: {
            'johnny_cash|music_legends': [1, 2],
            'elvis|music_legends': [3],
            'country_classics|american_heritage_favorites': [1]
        }
    };
    const entries = selectFavoriteEntries(data, {
        program: 'COL', collectionGroup: 'music_legends'
    });
    assert.deepEqual(entries.map(entry => [entry.group, entry.rankingId]), [
        ['johnny_cash|music_legends', 1],
        ['johnny_cash|music_legends', 2],
        ['elvis|music_legends', 3]
    ]);
    assert.equal(entries[0].collectionSlug, 'johnny_cash');
    assert.equal(entries[0].collectionGroup, 'music_legends');
    assert.equal(selectFavoriteEntries(data, { program: 'COL' }).length, 4);
});

test('empty selections and invalid source keys cannot create playback entries', () => {
    const data = { DG: { invalid: [1], '|country': [2], '1950s|': [3] }, COL: {} };
    assert.deepEqual(selectFavoriteEntries(data, { program: 'DG' }), []);
    assert.deepEqual(selectFavoriteEntries(data, { program: 'COL' }), []);
    assert.deepEqual(selectFavoriteEntries(
        { DG: { '1950s|country': [1] }, COL: {} },
        { program: 'DG', genre: 'jazz' }
    ), []);
});

const {loadFavoriteQueue} = await import('../src/lib/favorites/queue.ts');
const {favoritesPlaybackUrl} = await import('../src/lib/favorites/launch.ts');
const {buildSelectionFromUrl} = await import('../src/lib/helpers/car/selectionFromUrl.ts');
const {resolveSequenceNarrationUrls} = await import('../src/lib/audio/sequenceNarration.ts');

test('queue keeps repeated recordings, unique positions, and authoritative intro keys', async () => {
    const entries = selectFavoriteEntries({DG: {'1950s|country': [51, 52], '1960s|country': [61]}, COL: {}}, {program: 'DG'});
    const selection = buildSelectionFromUrl(new URL('http://localhost/car-page?programType=FAVORITES_DG&decade=ALL&genre=country'));
    const sources = [];
    const queue = await loadFavoriteQueue(entries, selection, async source => {
        sources.push(source);
        return source.context.decade === '1950s' ? [
            {rankingId: 51, rank: 7, trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash', spotifyTrackId: 'same-recording', introKey: {bucket: 'audio-en', key: 'intro/1950s-country_07.mp3'}},
            {rankingId: 52, rank: 12, trackName: 'Another song', artistName: 'Other artist'}
        ] : [
            {rankingId: 61, rank: 3, trackName: 'Folsom Prison Blues', artistName: 'Johnny Cash', spotifyTrackId: 'same-recording', introKey: {bucket: 'audio-en', key: 'intro/1960s-country_03.mp3'}}
        ];
    });
    assert.equal(sources.length, 2);
    assert.ok(sources.every(source => source.programType === 'PROGRAM_DG' && source.endRank === 9999));
    assert.deepEqual(queue.map(track => track.rank), [1, 2, 3]);
    assert.deepEqual(queue.map(track => track.sourceRank), [7, 12, 3]);
    assert.equal(queue.filter(track => track.spotifyTrackId === 'same-recording').length, 2);
    assert.match(resolveSequenceNarrationUrls(queue[0], 'en', 'short').intro, /1950s-country_07\.mp3$/);
    assert.match(resolveSequenceNarrationUrls(queue[2], 'en', 'short').intro, /1960s-country_03\.mp3$/);
    assert.equal(queue[2].favoriteGroup, '1960s|country');
});

test('fallback intros use the source rank for both categories and languages', async () => {
    const entries = selectFavoriteEntries({DG: {}, COL: {'country_duets|specialty_mixes': [90]}}, {program: 'COL'});
    const selection = buildSelectionFromUrl(new URL('http://localhost/car-page?programType=FAVORITES_COL&collection_group=ALL'));
    const queue = await loadFavoriteQueue(entries, selection, async source => {
        assert.equal(source.context.collection_slug, 'country_duets');
        assert.equal(source.context.collection_group_slug, 'specialty_mixes');
        return [{rankingId: 90, rank: 14, trackName: 'Duet', artistName: 'Singers'}];
    });
    assert.equal(queue[0].rank, 1);
    assert.match(resolveSequenceNarrationUrls(queue[0], 'ptbr', 'off').intro, /audio-ptbr\/collections-intros\/country_duets_14\.mp3$/);
    assert.match(resolveSequenceNarrationUrls({rank: 1, sourceRank: 7, decadeSlug: '1950s', genreSlug: 'country'}, 'es', 'off').intro, /audio-es\/intro\/1950s-country_07\.mp3$/);
});

test('missing rankings cannot substitute a different recording or mutate source lists', async () => {
    const entries = [{program: 'DG', group: '1950s|country', decade: '1950s', genre: 'country', rankingId: 8}];
    const sourceTracks = [{rankingId: 9, rank: 8, trackName: 'Wrong song', artistName: 'Wrong artist'}];
    const before = structuredClone(sourceTracks);
    assert.deepEqual(await loadFavoriteQueue(entries, buildSelectionFromUrl(new URL('http://localhost/car-page')), async () => sourceTracks), []);
    assert.deepEqual(sourceTracks, before);
});

test('launch URLs retain Favorites mode, filters, settings, and return destination', () => {
    const settings = {voices: ['intro', 'detail'], playbackOrder: 'down', voicePlayMode: 'before', pauseMode: 'continuous'};
    for (const scope of [{program: 'DG', genre: 'country'}, {program: 'DG'}, {program: 'COL', collectionGroup: 'music_legends'}, {program: 'COL'}]) {
        const url = new URL(favoritesPlaybackUrl(scope, 'es', settings), 'http://localhost');
        const selection = buildSelectionFromUrl(url);
        assert.equal(selection.programType, scope.program === 'DG' ? 'FAVORITES_DG' : 'FAVORITES_COL');
        assert.equal(selection.mode, scope.program === 'DG' ? 'decade_genre' : 'collection');
        assert.equal(selection.language, 'es');
        assert.equal(selection.playbackOrder, 'down');
        assert.deepEqual(selection.voices, ['intro', 'detail']);
        assert.equal(selection.skipPlayed, false);
        assert.equal(selection.context.genre ?? selection.context.collection_group_slug, scope.genre ?? scope.collectionGroup ?? 'ALL');
        assert.match(url.searchParams.get('returnTo'), /browse=(nostalgia|collections)$/);
    }
    assert.equal(buildSelectionFromUrl(new URL('http://localhost/car-page?decade=ALL&genre=country')).programType, 'PROGRAM_DG');
    assert.equal(buildSelectionFromUrl(new URL('http://localhost/car-page?mode=radio_collections&collection_group=ALL')).programType, 'RADIO_COL');
});
