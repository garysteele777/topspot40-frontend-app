// @ts-nocheck -- Node test globals and deliberately partial Car Mode fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import {requestedTrackFromId} from '../src/lib/carmode/requestedTrack.ts';
import {addRequest, takeNextRequest} from '../src/lib/carmode/requestsQueue.js';

const regularOne = {id: 101, rank: 1, rankingId: null, trackName: 'Spotlight One'};
const heyJude = {id: 808, rank: 8, rankingId: null, trackName: 'Hey Jude'};
const regularTwo = {id: 102, rank: 2, rankingId: null, trackName: 'Spotlight Two'};

test('launches Hey Jude as the displayed current track and first request without changing Artist Spotlight order', () => {
    const tracks = [regularOne, heyJude, regularTwo];
    const requested = requestedTrackFromId(tracks, '808');

    assert.equal(requested, heyJude);
    assert.deepEqual(tracks, [regularOne, heyJude, regularTwo]);
    assert.equal(takeNextRequest(addRequest([], requested)).track, heyJude);
});

test('ignores malformed and unavailable requested track IDs', () => {
    assert.equal(requestedTrackFromId([regularOne], 'bad'), null);
    assert.equal(requestedTrackFromId([regularOne], '808'), null);
});
