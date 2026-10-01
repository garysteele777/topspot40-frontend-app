// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDocuseriesQueue, buildDocuseriesGroupUrl} from '../src/lib/musicDocuseries/groupPlayback.ts';
import {hasListenedEnough, docuseriesProgress, readDocuseriesHistory, DOCUSERIES_HISTORY_KEY,
    docuseriesHistoryStore, markDocuseriesComplete, clearDocuseriesHistory} from '../src/lib/musicDocuseries/history.ts';
import {get} from 'svelte/store';
import {readFileSync} from 'node:fs';

const stories = [{id: 3, slug: 'three', sort_order: 3}, {id: 1, slug: 'one', sort_order: 1},
    {id: 2, slug: 'two', sort_order: 2}];
const ranges = values => ({length: values.length, start: i => values[i][0], end: i => values[i][1]});

test('Play All preserves numbered order; Play Unheard skips completed stories without reordering', () => {
    const before = structuredClone(stories);
    assert.deepEqual(buildDocuseriesQueue(stories, 'all', {two: 123}).map(s => s.slug), ['one', 'two', 'three']);
    assert.deepEqual(buildDocuseriesQueue(stories, 'unheard', {two: 123}).map(s => s.slug), ['one', 'three']);
    assert.deepEqual(buildDocuseriesQueue(stories, 'unheard', {one: 1, two: 2, three: 3}), []);
    assert.deepEqual(stories, before);
});

test('90% of actual unique audio is required, including at the boundary', () => {
    assert.equal(hasListenedEnough(ranges([[0, 89.9]]), 100), false);
    assert.equal(hasListenedEnough(ranges([[0, 90]]), 100), true);
    assert.equal(hasListenedEnough(ranges([[0, 45], [55, 100]]), 100), true);
    assert.equal(hasListenedEnough(ranges([[0, 10], [99, 100]]), 100), false);
    assert.equal(hasListenedEnough(ranges([]), 100), false);
    for (const duration of [0, -1, NaN, Infinity]) assert.equal(hasListenedEnough(ranges([[0, 100]]), duration), false);
});

test('completion survives reload, is shared across languages, and stores no resume timestamp', () => {
    const data = new Map();
    globalThis.window = {localStorage: {getItem: key => data.get(key), setItem: (key, value) => data.set(key, value)}};
    docuseriesHistoryStore.set({});
    try {
        markDocuseriesComplete('two');
        const saved = readDocuseriesHistory();
        assert.ok(saved.two > 0);
        assert.deepEqual(Object.keys(saved), ['two']);
        const es = new URL(buildDocuseriesGroupUrl('history_eras', 'es', 'unheard'), 'https://example.test');
        const en = new URL(buildDocuseriesGroupUrl('history_eras', 'en', 'unheard'), 'https://example.test');
        assert.equal(es.searchParams.get('language'), 'es');
        assert.equal(en.searchParams.get('language'), 'en');
        assert.deepEqual(buildDocuseriesQueue(stories, 'unheard', saved).map(s => s.slug), ['one', 'three']);
        clearDocuseriesHistory(['two']);
        assert.deepEqual(get(docuseriesHistoryStore), {});
        assert.deepEqual(JSON.parse(data.get(DOCUSERIES_HISTORY_KEY)), {});
    } finally { delete globalThis.window; }
});

test('storage failures do not interrupt playback or erase session history', () => {
    globalThis.window = {localStorage: {getItem: () => {throw new Error('disabled');}, setItem: () => {throw new Error('disabled');}}};
    docuseriesHistoryStore.set({});
    try {
        assert.doesNotThrow(() => markDocuseriesComplete('one'));
        assert.ok(get(docuseriesHistoryStore).one);
    } finally { delete globalThis.window; docuseriesHistoryStore.set({}); }
});

test('malformed history is ignored and group completion follows current membership', () => {
    for (const raw of ['not json', 'null', '[]']) assert.deepEqual(readDocuseriesHistory({getItem: () => raw}), {});
    assert.deepEqual(readDocuseriesHistory({getItem: () => '{"valid":1,"invalid":"yes","negative":-1}'}), {valid: 1});
    assert.equal(docuseriesProgress([], {}).complete, false);
    assert.equal(docuseriesProgress(stories, {one: 1, two: 1, three: 1}).complete, true);
    assert.equal(docuseriesProgress([...stories, {slug: 'new'}], {one: 1, two: 1, three: 1}).complete, false);
});

test('Portuguese group launch uses API locale and preserves the return destination', () => {
    const url = new URL(buildDocuseriesGroupUrl('history_eras', 'ptbr', 'all'), 'https://example.test');
    assert.equal(url.searchParams.get('language'), 'pt-BR');
    assert.equal(url.searchParams.get('group'), 'all');
    assert.equal(url.searchParams.get('returnTo'), '/journey-prototype/music-docuseries/history_eras');
});

test('each of the 14 groups has an introduction in all three languages', () => {
    const scripts = JSON.parse(readFileSync(new URL('../scripts/docuseries-group-intros.json', import.meta.url), 'utf8'));
    assert.equal(Object.keys(scripts).length, 14);
    for (const versions of Object.values(scripts)) {
        assert.deepEqual(Object.keys(versions).sort(), ['en', 'es', 'ptbr']);
        for (const script of Object.values(versions)) assert.ok(script.length > 100);
    }
});
