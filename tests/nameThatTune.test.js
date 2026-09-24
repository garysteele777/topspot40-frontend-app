// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const route = readFileSync('src/routes/car-page/+page.svelte', 'utf8');
const options = readFileSync('src/lib/components/car/NarrationOptions.svelte', 'utf8');
const preferences = readFileSync('src/lib/stores/playbackSettings.store.ts', 'utf8');
const queue = readFileSync('src/lib/carmode/requestsQueue.js', 'utf8');

test('Name That Tune is a session-only setting which resets when Car Mode mounts', () => {
    assert.match(route, /let nameThatTuneEnabled = false/);
    assert.match(route, /onMount\(async \(\) => \{[\s\S]*?nameThatTuneEnabled = false/);
    assert.match(options, /Name That Tune:/);
    assert.doesNotMatch(preferences, /nameThatTune/i);
    assert.doesNotMatch(route, /localStorage\.(?:getItem|setItem)\([^\n]*nameThatTune/i);
});

test('Guided Play runs the song before selected narration and only then advances', () => {
    assert.match(route, /if \(nameThatTuneEnabled\) \{\s*startNameThatTuneGuidedSong\(\);/);
    assert.match(route, /if \(nameThatTuneEnabled && !isRadioProgram && track\) \{[\s\S]*?await startGuidedTrack\(track\)[\s\S]*?await advanceRequestOrRegular\(\)/);
});

test('queued requests retain their selected FIFO order and are never shuffled by Name That Tune', () => {
    assert.match(route, /const nextRequest = requests\[0\]/);
    assert.match(route, /currentTrack\.set\(nextRequest\);[\s\S]*?autoPlay\.playSelectedTrack\(nextRequest/);
    assert.match(queue, /return \{track: queue\[0\] \?\? null, queue: queue\.slice\(1\)\}/);
    assert.doesNotMatch(route, /nameThatTuneEnabled[\s\S]{0,200}Math\.random/);
});

test('Off keeps the existing narration-first Guided branch', () => {
    assert.match(route, /if \(nameThatTuneEnabled\) \{[\s\S]*?return;\s*\}\s*await startGuidedTrack\(trackObj\)/);
});
