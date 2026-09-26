// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route = readFileSync('src/routes/car-page/+page.svelte', 'utf8');
const navigation = readFileSync('src/lib/carmode/CarModeNavigation.ts', 'utf8');

test('Guided and Auto transitions share the queued-request advancement path', () => {
    assert.match(route, /await advanceRequestOrRegular\(true\);/);
    assert.match(route, /await advanceRequestOrRegular\(\);/);
    assert.match(route, /preserveSpotifyWindow: autoWindowReady === true/);
    assert.match(route, /currentTrack\.set\(nextRequest\);[\s\S]*await autoPlay\.playSelectedTrack\(nextRequest/);
    assert.match(route, /await navigation\.jumpTo\(nextRequest\);/);
});

test('a completed request is removed only on the following transition and regular play resumes', () => {
    assert.match(route, /if \(activeRequestIdentity\) \{/);
    assert.match(route, /requests = requests\.filter/);
    assert.match(route, /if \(regularResumeTrack\) \{/);
    assert.match(route, /await nextTrack\(auto\);/);
    assert.match(navigation, /isTrackExcludedFromRegularProgression/);
});

test('a searched request already displayed as current is not resumed and played twice', () => {
    assert.match(
        route,
        /requestTrackIdentity\(current\) !== requestTrackIdentity\(nextRequest\)[\s\S]*regularResumeTrack = current/
    );
    assert.match(
        route,
        /currentTrack\.set\(requestedTrack\);[\s\S]*currentRank\.set\(requestedTrack\.rank\);[\s\S]*addTrackRequest\(requestedTrack\)/
    );
});
