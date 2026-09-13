// @ts-nocheck -- exercises the browser-independent Guided coordinator directly.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFile} from 'node:fs/promises';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {createCarModeNarration} = await import('../src/lib/carmode/CarModeNarration.ts');
const {createCarModeNavigation} = await import('../src/lib/carmode/CarModeNavigation.ts');
const {playNarrationUrlAndWait} = await import('../src/lib/audio/narrationPlayer.ts');

const track = {
    rankingId: 1,
    rank: 1,
    spotifyTrackId: 'one',
    trackName: 'One',
    artistName: 'Artist'
};

function coordinator({playNarration, startBed = async () => {}} = {}) {
    let current = track;
    let phase = 'idle';
    let playing = false;
    let ready = false;
    let failures = 0;
    const events = [];

    const instance = createCarModeNarration({
        getCurrentTrack: () => current,
        getNarrations: () => [{phase: 'intro', url: 'intro.mp3'}],
        getBedUrl: () => 'bed.mp3',
        unlockBed: async () => events.push('unlock'),
        startBed: async () => {
            events.push('bed');
            return startBed();
        },
        stopBed: () => events.push('stop-bed'),
        playNarration: playNarration ?? (async (_url, _fallback, _timing, onStarted) => {
            onStarted();
            return 'ended';
        }),
        stopNarration: () => events.push('stop-narration'),
        updateTiming: () => {},
        resetTiming: () => events.push('reset-timing'),
        getPlaybackPhase: () => phase,
        setPlaybackPhase: value => { phase = value; },
        setIsPlaying: value => { playing = value; },
        resetGuidedReadyState: () => { ready = false; },
        setGuidedReady: value => { ready = value; },
        onPlaybackFailure: () => { failures += 1; }
    });

    return {
        instance,
        state: () => ({current, phase, playing, ready, failures, events})
    };
}

test('Guided shows Pause only after narration media confirms playback', async () => {
    let acknowledgeStart;
    let finish;
    const subject = coordinator({
        playNarration: (_url, _fallback, _timing, onStarted) => new Promise(resolve => {
            acknowledgeStart = onStarted;
            finish = () => resolve('ended');
        })
    });

    const run = subject.instance.start(track);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(subject.state().playing, false);

    acknowledgeStart();
    assert.equal(subject.state().playing, true);
    finish();
    assert.equal(await run, true);
    assert.deepEqual(
        (({current, phase, playing, ready, failures}) => ({current, phase, playing, ready, failures}))(subject.state()),
        {current: track, phase: 'track', playing: false, ready: true, failures: 0}
    );
    assert.ok(subject.state().events.includes('unlock'));
    assert.ok(subject.state().events.includes('bed'));
});

test('Guided rolls back after rejected bed or narration playback', async () => {
    const bedRejected = coordinator({startBed: async () => { throw new Error('blocked'); }});
    assert.equal(await bedRejected.instance.start(track), false);
    assert.deepEqual(
        (({phase, playing, ready, failures}) => ({phase, playing, ready, failures}))(bedRejected.state()),
        {phase: 'idle', playing: false, ready: false, failures: 1}
    );

    const narrationRejected = coordinator({playNarration: async () => 'error'});
    assert.equal(await narrationRejected.instance.start(track), false);
    assert.deepEqual(
        (({phase, playing, ready, failures}) => ({phase, playing, ready, failures}))(narrationRejected.state()),
        {phase: 'idle', playing: false, ready: false, failures: 1}
    );
});

test('Guided cancellation invalidates a stale narration run before a track change', async () => {
    let finish;
    const subject = coordinator({
        playNarration: (_url, _fallback, _timing, onStarted) => new Promise(resolve => {
            onStarted();
            finish = () => resolve('ended');
        })
    });

    const run = subject.instance.start(track);
    await new Promise(resolve => setImmediate(resolve));
    subject.instance.abandon();
    finish();
    assert.equal(await run, false);
    assert.deepEqual(
        (({phase, playing, ready}) => ({phase, playing, ready}))(subject.state()),
        {phase: 'idle', playing: false, ready: false}
    );
});

test('a stalled HTMLMediaElement.play promise times out and returns an error result', async () => {
    const previousAudio = globalThis.Audio;
    const previousWindow = globalThis.window;

    class StalledAudio {
        duration = 0;
        currentTime = 0;
        volume = 1;
        preload = '';
        src = '';
        addEventListener() {}
        pause() {}
        play() { return new Promise(() => {}); }
    }

    globalThis.Audio = StalledAudio;
    globalThis.window = globalThis;
    try {
        assert.equal(
            await playNarrationUrlAndWait('stalled.mp3', undefined, undefined, undefined, 5),
            'error'
        );
    } finally {
        globalThis.Audio = previousAudio;
        globalThis.window = previousWindow;
    }
});

test('Next always releases its lock and all navigation paths cancel Guided narration first', async () => {
    const tracks = [track, {...track, rankingId: 2, rank: 2, spotifyTrackId: 'two'}];
    let current = tracks[0];
    let starts = 0;
    const events = [];
    const navigation = createCarModeNavigation({
        getCurrentTrack: () => current,
        getTracks: () => tracks,
        getSelection: () => ({mode: 'decade_genre', programType: 'PROGRAM_DG'}),
        getPlaybackSettings: () => ({playbackOrder: 'up', skipPlayed: false}),
        setCurrentTrack: value => { current = value; events.push(`track:${value.rank}`); },
        setCurrentRank: () => {},
        stopNarrationAudio: () => events.push('stop-audio'),
        cancelGuidedNarration: () => events.push('cancel-guided'),
        stopBed: () => events.push('stop-bed'),
        stopPlayback: async () => events.push('stop-playback'),
        markUserStartedPlayback: () => {},
        setUserStartedPlayback: () => {},
        playTrack: async () => {
            starts += 1;
            if (starts === 1) throw new Error('play failed');
        },
        startAutoPlay: async () => {}
    });

    await assert.rejects(navigation.next(), /play failed/);
    await navigation.next();
    await navigation.jumpTo(tracks[0]);
    await navigation.previous();

    assert.equal(starts, 4);
    assert.ok(events.filter(event => event === 'cancel-guided').length >= 4);
});

test('every Guided entry path is routed through the cancellable coordinator', async () => {
    const page = await readFile(
        new URL('../src/routes/car-page/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(page, /async function startGuidedTrack[\s\S]*return narration\.start\(trackObj, startPhase\)/);
    assert.match(page, /async function handleGuidedPlay[\s\S]*await handlePlayPause\(\)/);
    assert.match(page, /continueGuidedPlayback[\s\S]*await nextTrack\(\)/);
    assert.match(page, /handleJumpToTrack[\s\S]*await navigation\.jumpTo\(track\)/);
    assert.match(page, /cancelGuidedNarration: narration\.abandon/);
    assert.match(page, /addEventListener\('pageshow', handleGuidedPageShow\)/);
});
