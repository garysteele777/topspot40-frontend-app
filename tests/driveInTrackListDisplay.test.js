// @ts-nocheck -- Node's test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    displayTrackListArtist,
    displayTrackListTitle
} = await import('../src/lib/carmode/trackListDisplay.js');

test('formats first-page and later-page Drive-In entries for display only', () => {
    assert.equal(displayTrackListTitle('#1 walk this way', 1), 'Walk This Way');
    assert.equal(displayTrackListArtist('aerosmith', 1), 'Aerosmith');

    assert.equal(displayTrackListTitle('#26 living on a prayer', 26), 'Living On A Prayer');
    assert.equal(displayTrackListArtist('bon jovi', 26), 'Bon Jovi');
});

test('only removes a leading rank when it belongs to that row', () => {
    assert.equal(displayTrackListTitle('#2 two of us', 2), 'Two Of Us');
    assert.equal(displayTrackListTitle('#2 two of us', 1), '#2 Two Of Us');
});

test('retains intentional mixed case, acronyms, and punctuation', () => {
    assert.equal(displayTrackListTitle('AC/DC: back in black', 1), 'AC/DC: Back In Black');
    assert.equal(displayTrackListArtist('P!nk & iPhone', 1), 'P!nk & iPhone');
});
