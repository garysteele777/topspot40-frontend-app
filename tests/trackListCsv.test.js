// @ts-nocheck -- Node's test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrackListCsv, escapeCsv} from '../src/lib/program/trackListCsv.js';

test('creates the existing fully quoted CSV format for ordinary values and rank order', () => {
    const csv = createTrackListCsv([
        {rank: 2, trackName: 'Second', artistName: 'Artist B', albumName: 'Album B', spotifyTrackId: 'id-b'},
        {rank: 1, trackName: 'First', artistName: 'Artist A', albumName: 'Album A', spotifyTrackId: 'id-a'}
    ]);

    assert.equal(
        csv,
        '"title","artist","album","spotify_id"\r\n"First","Artist A","Album A","id-a"\r\n"Second","Artist B","Album B","id-b"'
    );
});

test('preserves commas, quotes, line breaks, and Unicode values exactly', () => {
    const csv = createTrackListCsv([{
        rank: 1,
        trackName: 'Beyonc\u00e9, "Renaissance"\nAct II',
        artistName: 'Sigur R\u00f3s & \u5b87\u591a\u7530\u30d2\u30ab\u30eb',
        albumName: 'A, "B"',
        spotifyTrackId: 'id\r\n2'
    }]);

    assert.equal(
        csv,
        '"title","artist","album","spotify_id"\r\n"Beyonc\u00e9, ""Renaissance""\nAct II","Sigur R\u00f3s & \u5b87\u591a\u7530\u30d2\u30ab\u30eb","A, ""B""","id\r\n2"'
    );
});

test('handles empty and null-like values as the existing exports do', () => {
    assert.equal(escapeCsv(null), '""');
    assert.equal(escapeCsv(undefined), '""');
    assert.equal(escapeCsv(''), '""');
    assert.equal(escapeCsv(0), '"0"');

    assert.equal(
        createTrackListCsv([{
            rank: 1,
            trackName: null,
            artistName: undefined,
            albumName: null,
            spotifyTrackId: undefined
        }]),
        '"title","artist","album","spotify_id"\r\n"","","",""'
    );
});

test('keeps the two export paths equivalent apart from their local filenames', () => {
    const tracks = [{rank: 2, trackName: 'Two', artistName: 'B'}, {rank: 1, trackName: 'One', artistName: 'A'}];

    const carModeCsv = createTrackListCsv(tracks);
    const jukeboxCsv = createTrackListCsv([...tracks].sort((a, b) => a.rank - b.rank));

    assert.equal(carModeCsv, jukeboxCsv);
});
