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
        /stageTrackBeforePlayback\(requestedTrack\)/
    );
});


test('searched songs are staged without queuing or starting playback', () => {
    const stage = route.match(/function stageTrackBeforePlayback\(track: CarModeTrack\): boolean \{([\s\S]*?)\r?\n    \}/)?.[1] ?? '';
    assert.match(stage, /get\(isPlaying\)/);
    assert.match(stage, /get\(playbackPhase\) !== 'idle'/);
    assert.match(stage, /currentTrack\.set\(track\)/);
    assert.match(stage, /currentRank\.set\(track\.rank\)/);
    assert.match(stage, /stagedTrackChoiceIdentity = requestTrackIdentity\(track\)/);
    assert.doesNotMatch(stage, /addTrackRequest|startGuidedTrack|playSelectedTrack/);
    const add = route.match(/function addTrackRequest\(track: CarModeTrack\): void \{([\s\S]*?)\r?\n    \}/)?.[1] ?? '';
    assert.match(add, /addRequest\(requests, track\)/);
    assert.doesNotMatch(add, /currentTrack\.set|startGuidedTrack|playSelectedTrack/);
});
