// @ts-nocheck -- direct Node coverage for Guided narration startup ordering.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {createCarModeNarration} = await import('../src/lib/carmode/CarModeNarration.ts');
const {createCarModeNavigation} = await import('../src/lib/carmode/CarModeNavigation.ts');

const track = {rankingId: 44, spotifyTrackId: 'sweet-dreams', rank: 44};

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((resolvePromise, rejectPromise) => {
        resolve = resolvePromise;
        reject = rejectPromise;
    });
    return {promise, resolve, reject};
}

function createNarrationHarness({unlockBed, startBed, playNarration, resetBed = () => {}}) {
    const playing = [];
    const narration = createCarModeNarration({
        getCurrentTrack: () => track,
        getNarrations: () => [{phase: 'intro', url: 'intro.mp3'}],
        getBedUrl: () => 'bed.mp3',
        unlockBed,
        startBed,
        stopBed: () => {},
        resetBed,
        playNarration,
        stopNarration: () => {},
        updateTiming: () => {},
        resetTiming: () => {},
        getPlaybackPhase: () => 'intro',
        setPlaybackPhase: () => {},
        setIsPlaying: value => playing.push(value),
        resetGuidedReadyState: () => {},
        setGuidedReady: () => {}
    });
    return {narration, playing};
}

test('Guided narration play is invoked without waiting for a pending bed unlock', async () => {
    const narrationDone = deferred();
    let narrationCalls = 0;
    const {narration} = createNarrationHarness({
        unlockBed: () => new Promise(() => {}),
        startBed: async () => {},
        playNarration: () => {
            narrationCalls += 1;
            return narrationDone.promise;
        }
    });

    const running = narration.start(track);
    assert.equal(narrationCalls, 1);

    narrationDone.resolve();
    assert.equal(await running, true);
});

test('a failed bed never stops Guided narration', async () => {
    const narrationDone = deferred();
    let narrationCalls = 0;
    const {narration} = createNarrationHarness({
        unlockBed: async () => {},
        startBed: async () => { throw new Error('bed unavailable'); },
        playNarration: (_url, _fallback, _timing, onPlaybackStarted) => {
            narrationCalls += 1;
            onPlaybackStarted();
            return narrationDone.promise;
        }
    });

    const running = narration.start(track);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(narrationCalls, 1);

    narrationDone.resolve();
    assert.equal(await running, true);
});

test('Spotify handoff resets the bed and invalidates a delayed bed start', async () => {
    const unlock = deferred();
    let startedBeds = 0;
    let resetBeds = 0;
    const {narration} = createNarrationHarness({
        unlockBed: () => unlock.promise,
        startBed: async () => { startedBeds += 1; },
        resetBed: () => { resetBeds += 1; },
        playNarration: async () => {}
    });

    await narration.start(track);
    narration.finishForSpotifyHandoff();
    unlock.resolve();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(resetBeds, 1);
    assert.equal(startedBeds, 0);
});

test('Guided shows Pause only after narration confirms playback', async () => {
    const narrationDone = deferred();
    let confirmPlayback;
    const {narration, playing} = createNarrationHarness({
        unlockBed: async () => {},
        startBed: async () => {},
        playNarration: (_url, _fallback, _timing, onPlaybackStarted) => {
            confirmPlayback = onPlaybackStarted;
            return narrationDone.promise;
        }
    });

    const running = narration.start(track);
    assert.deepEqual(playing, [false]);

    confirmPlayback();
    assert.deepEqual(playing, [false, true]);

    narrationDone.resolve();
    await running;
    assert.equal(playing.at(-1), false);
});

test('failed narration never shows Pause', async () => {
    const {narration, playing} = createNarrationHarness({
        unlockBed: async () => {},
        startBed: async () => {},
        playNarration: async () => { throw new Error('NotAllowedError'); }
    });

    await assert.rejects(narration.start(track), /NotAllowedError/);
    assert.deepEqual(playing, [false, false]);
});

test('Next releases its lock after a failed narration path and Previous remains usable', async () => {
    const tracks = [
        {rankingId: 1, rank: 1},
        {rankingId: 2, rank: 2}
    ];
    let current = tracks[0];
    let playAttempts = 0;
    const navigation = createCarModeNavigation({
        getCurrentTrack: () => current,
        getTracks: () => tracks,
        getSelection: () => null,
        getPlaybackSettings: () => ({playbackOrder: 'up', skipPlayed: false}),
        setCurrentTrack: value => { current = value; },
        setCurrentRank: () => {},
        stopNarrationAudio: () => {},
        stopCurrentNarrationPhase: () => {},
        stopBed: () => {},
        stopPlayback: async () => {},
        markUserStartedPlayback: () => {},
        setUserStartedPlayback: () => {},
        playTrack: async () => {
            playAttempts += 1;
            if (playAttempts === 1) throw new Error('narration failed');
        },
        startAutoPlay: async () => {}
    });

    await assert.rejects(navigation.next(), /narration failed/);
    await new Promise(resolve => setTimeout(resolve, 550));
    await navigation.next();
    await navigation.previous();

    assert.equal(playAttempts, 3);
});
