// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {addRequest, clearRequests, moveRequest, removeRequest, takeNextRequest} from '../src/lib/carmode/requestsQueue.js';

const one = {rank: 1, rankingId: 1, trackName: 'One'};
const two = {rank: 2, rankingId: 2, trackName: 'Two'};
const three = {rank: 3, rankingId: 3, trackName: 'Three'};

test('adds requests once, reorders, and removes them without duplicates', () => {
    let queue = addRequest([], one);
    queue = addRequest(queue, two);
    queue = addRequest(queue, one);
    assert.deepEqual(queue.map(track => track.rank), [1, 2]);
    queue = moveRequest(queue, 1, -1);
    assert.deepEqual(queue.map(track => track.rank), [2, 1]);
    assert.deepEqual(removeRequest(queue, 0).map(track => track.rank), [1]);
});

test('consumes requests in order before regular playback resumes', () => {
    const queue = [one, two, three];
    const first = takeNextRequest(queue);
    const second = takeNextRequest(first.queue);
    assert.equal(first.track, one);
    assert.equal(second.track, two);
    assert.deepEqual(second.queue.map(track => track.rank), [3]);
});

test('requires confirmation before clearing requests', () => {
    const queue = [one, two];
    assert.equal(clearRequests(queue, false), queue);
    assert.deepEqual(clearRequests(queue, true), []);
});
