// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildProgramHistoryKey,
    calculatePlayedPercent,
    calculateProgramProgress,
    findCollectionGroupSlug,
    isProgramRankPlayed,
    playedRankCount
} from '../src/lib/program/history.js';

test('preserves every selection-context program key format byte-for-byte', () => {
    assert.equal(buildProgramHistoryKey({mode: 'decade_genre', context: {decade: '1980s', genre: 'rnb_soul'}}), 'DG|1980s|rnb_soul');
    assert.equal(buildProgramHistoryKey({mode: 'decade_genre', context: {decade: 'ALL', genre: 'ALL'}}), 'DG|ALL|ALL');
    assert.equal(buildProgramHistoryKey({mode: 'collection', context: {collection_slug: 'stage_and_screen', collection_group_slug: 'music_legends'}}), 'COL|stage_and_screen|music_legends');
    assert.equal(buildProgramHistoryKey({mode: 'collection', context: {collection: 'Legacy Collection', collectionCategory: 'Stage & Screen'}}), 'COL|Legacy Collection|Stage & Screen');
    assert.equal(buildProgramHistoryKey({mode: 'collection', context: {collection_slug: 'exact_Value', collection: 'ignored', collection_group_slug: 'Group-Name', collectionCategory: 'ignored'}}), 'COL|exact_Value|Group-Name');
    assert.equal(buildProgramHistoryKey({mode: 'artist_spotlight', context: {artist_id: '12'}}), null);
    assert.equal(buildProgramHistoryKey({mode: 'decade_genre', context: {decade: '', genre: 'rock'}}), null);
    assert.equal(buildProgramHistoryKey({mode: 'collection', context: {collection_slug: 'mix'}}), null);
});

test('catalog number for a collection resolves the same history key as browsing its group', () => {
    const groups = [
        {slug: 'american_heritage_favorites', items: [{slug: 'railroad_train_songs'}]},
        {slug: 'music_legends', items: [{slug: 'legends_country'}]}
    ];
    const group = findCollectionGroupSlug(groups, 'railroad_train_songs');
    assert.equal(group, 'american_heritage_favorites');
    const key = buildProgramHistoryKey({mode: 'collection', context: {
        collection_slug: 'railroad_train_songs', collection_group_slug: group
    }});
    assert.equal(key, 'COL|railroad_train_songs|american_heritage_favorites');
    assert.equal(isProgramRankPlayed([{key, playedRanks: [16, 17]}], key, 17), true);
    assert.equal(findCollectionGroupSlug(groups, 'unknown'), null);
    assert.equal(findCollectionGroupSlug([...groups, {slug: 'duplicate', items: [{slug: 'railroad_train_songs'}]}], 'railroad_train_songs'), null);
});

test('matches persisted keys and ranks with the existing strict played-state rules', () => {
    const history = [
        {key: 'DG|1980s|rock', playedRanks: [1, '2', 2, 2]},
        {key: 'COL|legacy/collection|stage_and_screen', playedRanks: [7]}
    ];

    assert.equal(isProgramRankPlayed(history, 'DG|1980s|rock', 1), true);
    assert.equal(isProgramRankPlayed(history, 'DG|1980s|rock', 2), true);
    assert.equal(isProgramRankPlayed(history, 'DG|1980s|rock', '2'), true);
    assert.equal(isProgramRankPlayed(history, 'DG|1980s|rock', '1'), false);
    assert.equal(isProgramRankPlayed(history, 'COL|legacy/collection|stage_and_screen', 7), true);
    assert.equal(isProgramRankPlayed(history, 'DG|1980s|pop', 1), false);
    assert.equal(isProgramRankPlayed([], 'DG|1980s|rock', 1), false);
    assert.equal(playedRankCount(history[0]), 4);
    assert.equal(playedRankCount(null), 0);
});

test('preserves rounded history percentages and unrounded Car Mode progress', () => {
    assert.equal(calculatePlayedPercent(0, 40), 0);
    assert.equal(calculatePlayedPercent(1, 3), 33);
    assert.equal(calculatePlayedPercent(40, 40), 100);
    assert.equal(calculatePlayedPercent(2, 0), 0);

    const history = [{key: 'DG|1980s|rock', playedRanks: [1, 2]}];
    assert.deepEqual(calculateProgramProgress(history, 'DG|1980s|rock', 4), {completed: 2, total: 4, remaining: 2, percent: 50});
    assert.deepEqual(calculateProgramProgress(history, 'DG|1980s|rock', 0), {completed: 2, total: 0, remaining: 0, percent: 0});
    assert.deepEqual(calculateProgramProgress(history, null, 40), {completed: 0, total: 0, remaining: 0, percent: 0});
});
