// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {createCarModeAutoPlay} = await import(
    '../src/lib/carmode/CarModeAutoPlay.ts'
);
const {createCarModeSpotify} = await import(
    '../src/lib/carmode/CarModeSpotify.ts'
);

const firstTrack = {
    rankingId: 1,
    rank: 1,
    spotifyTrackId: 'first',
    trackName: 'First song',
    durationSeconds: 0.01
};
const nextTrack = {
    rankingId: 2,
    rank: 2,
    spotifyTrackId: 'next',
    trackName: 'Next song',
    durationSeconds: 1
};

function createHarness({
    phase = 'intro',
    playing = true,
    pausedNarrationPhase = null,
    closeSpotify = () => true,
    track = firstTrack,
    bufferSeconds = 0,
    onContinue = null,
    openSpotify = null,
    onSpotifyOpenFailed = null,
    onLocalNextTrack = null,
    onSpotifyHandoff = null,
    stopNarrationBedAtSpotifyHandoff = null,
    nameThatTuneEnabled = false
} = {}) {
    let currentTrack = track;
    let activeMode = 'auto';
    let playbackPhase = phase;
    let isPlaying = playing;
    let queued = 0;
    let opened = 0;
    let paused = 0;
    let starts = [];
    let status = [];
    let continued = 0;
    let pausedPhase = pausedNarrationPhase;
    let preparedWindows = 0;
    let closedWindows = 0;
    let events = [];

    const auto = createCarModeAutoPlay({
        getActivePlayMode: () => activeMode,
        setActivePlayMode: value => { activeMode = value; },
        getCurrentTrack: () => currentTrack,
        getIsPlaying: () => isPlaying,
        setIsPlaying: value => { isPlaying = value; },
        getPlaybackPhase: () => playbackPhase,
        setPlaybackPhase: value => { playbackPhase = value; },
        pauseNarration: () => { paused += 1; },
        takePausedNarrationPhase: () => {
            const phaseToResume = pausedPhase;
            pausedPhase = null;
            return phaseToResume;
        },
        abandonNarration: () => { pausedPhase = null; },
        startNarration: async track => {
            events.push(`narration:${track.spotifyTrackId}`);
            starts.push(track);
            return true;
        },
        isNameThatTuneEnabled: () => nameThatTuneEnabled,
        prepareSpotifyWindow: () => { preparedWindows += 1; },
        isMobile: () => true,
        openSpotify: () => {
            events.push(`song:${currentTrack.spotifyTrackId}`);
            opened += 1;
            return openSpotify ? openSpotify() : true;
        },
        closeSpotify: () => {
            closedWindows += 1;
            return closeSpotify();
        },
        queueNextTrack: async () => {
            queued += 1;
            currentTrack = nextTrack;
        },
        setStatus: message => { status.push(message); },
        onSpotifyOpenFailed,
        onSpotifyHandoff,
        stopNarrationBedAtSpotifyHandoff,
        continueAutoPlayback: async () => {
            events.push('advance');
            continued += 1;
            if (onContinue) await onContinue({
                auto,
                setPhase: value => { playbackPhase = value; },
                setTrack: value => { currentTrack = value; }
            });
        },
        nextTrack: async () => { onLocalNextTrack?.(); },
        previousTrack: async () => {},
        startPreviousAutoPlayback: async () => {}
    }, bufferSeconds);

    return {
        auto,
        setCurrentTrack: value => { currentTrack = value; },
        setPhase: value => { playbackPhase = value; },
        spotifyWindowActions: () => ({preparedWindows, closedWindows}),
        state: () => ({
            activeMode,
            playbackPhase,
            isPlaying,
            currentTrack,
            queued,
            opened,
            paused,
            starts,
            status,
            continued,
            ...(nameThatTuneEnabled ? {events} : {})
        })
    };
}

test('paused Detail resumes into active Spotify playback with Pause state', async () => {
    const harness = createHarness({
        phase: 'paused',
        playing: false,
        pausedNarrationPhase: 'detail'
    });

    await harness.auto.handlePlay();

    assert.deepEqual(harness.state(), {
        activeMode: 'auto',
        playbackPhase: 'track',
        isPlaying: true,
        currentTrack: firstTrack,
        queued: 0,
        opened: 1,
        paused: 0,
        starts: [],
        status: [],
        continued: 0
    });
    harness.auto.cancel();
});

test('pausing Spotify closes it, cancels its timer, and queues the next track', async () => {
    const harness = createHarness({phase: 'paused', playing: false, pausedNarrationPhase: 'detail'});
    await harness.auto.handlePlay();
    await harness.auto.handlePlay();
    await new Promise(resolve => setTimeout(resolve, 25));

    assert.deepEqual(harness.state(), {
        activeMode: 'auto',
        playbackPhase: 'paused',
        isPlaying: false,
        currentTrack: nextTrack,
        queued: 1,
        opened: 1,
        paused: 0,
        starts: [],
        status: [],
        continued: 0
    });
});

test('resuming after a Spotify pause begins the queued track Intro', async () => {
    const harness = createHarness({phase: 'paused', playing: false, pausedNarrationPhase: 'detail'});
    await harness.auto.handlePlay();
    await harness.auto.handlePlay();
    await harness.auto.handlePlay();

    assert.deepEqual(harness.state().starts, [nextTrack]);
    harness.auto.cancel();
});

test('Spotify close failure still queues the next track and asks for manual close', async () => {
    const harness = createHarness({
        phase: 'paused',
        playing: false,
        pausedNarrationPhase: 'detail',
        closeSpotify: () => false
    });
    await harness.auto.handlePlay();
    await harness.auto.handlePlay();

    assert.equal(harness.state().currentTrack, nextTrack);
    assert.equal(harness.state().playbackPhase, 'paused');
    assert.equal(harness.state().isPlaying, false);
    assert.deepEqual(harness.state().status, ['Please close Spotify manually.']);
});

test('Intro narration pause behavior remains unchanged', async () => {
    const harness = createHarness({phase: 'intro', playing: true});

    await harness.auto.handlePlay();

    assert.equal(harness.state().paused, 1);
    assert.equal(harness.state().playbackPhase, 'paused');
    assert.equal(harness.state().isPlaying, true);
    assert.equal(harness.state().queued, 0);
});

test('a known track duration arms one Auto Play timer and continues once', async () => {
    const radioTrack = {
        ...firstTrack,
        spotifyTrackId: 'country-known-duration',
        durationSeconds: undefined,
        durationMs: 1000
    };
    const harness = createHarness({
        phase: 'paused',
        playing: false,
        pausedNarrationPhase: 'detail',
        track: radioTrack
    });

    await harness.auto.handlePlay();
    await new Promise(resolve => setTimeout(resolve, 1100));

    assert.equal(harness.state().continued, 1);
    assert.equal(harness.state().opened, 1);
    harness.auto.cancel();
});

test('Name That Tune Auto Play hands off the song, then narration, then advances', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: {...firstTrack, durationSeconds: 2},
        nameThatTuneEnabled: true
    });

    await harness.auto.handlePlay();
    t.mock.timers.tick(2000);
    await Promise.resolve();
    await Promise.resolve();

    assert.deepEqual(harness.state().events, ['song:first', 'narration:first', 'advance']);
    harness.auto.cancel();
});

test('Name That Tune does not remain falsely playing when Spotify duration is missing', async () => {
    const missingDuration = {...firstTrack, spotifyTrackId: 'jed-clampett', durationSeconds: null, durationMs: null};
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: missingDuration,
        nameThatTuneEnabled: true
    });

    await harness.auto.handlePlay();

    assert.equal(harness.state().playbackPhase, 'paused');
    assert.equal(harness.state().isPlaying, false);
    assert.deepEqual(harness.state().status, [
        'Spotify duration is unavailable. After the song ends, press Auto Play for its narration.'
    ]);

    await harness.auto.handlePlay();

    assert.deepEqual(harness.state().events, [
        'song:jed-clampett', 'narration:jed-clampett', 'advance'
    ]);
    harness.auto.cancel();
});

test('Auto Play starts the next queued request after the current request timer ends', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const requestFourteen = {...firstTrack, rank: 14, rankingId: 14, spotifyTrackId: 'request-14', durationSeconds: 2};
    const requestFifteen = {...nextTrack, rank: 15, rankingId: 15, spotifyTrackId: 'request-15', durationSeconds: 2};
    const queued = [requestFourteen, requestFifteen];

    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: requestFourteen,
        bufferSeconds: 0,
        onContinue: async ({auto, setTrack}) => {
            queued.shift();
            const nextRequest = queued[0];
            setTrack(nextRequest);
            await auto.playSelectedTrack(nextRequest, {preserveSpotifyWindow: true});
        }
    });

    harness.auto.handoffCurrentTrack(requestFourteen);
    t.mock.timers.tick(2000);
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(harness.state().continued, 1);
    assert.equal(harness.state().activeMode, 'auto');
    assert.equal(harness.state().currentTrack, requestFifteen);
    assert.equal(harness.state().playbackPhase, 'track');
    assert.equal(harness.state().isPlaying, true);
    assert.deepEqual(harness.state().starts, [requestFifteen]);
    assert.equal(harness.state().opened, 2);
    assert.deepEqual(harness.spotifyWindowActions(), {
        preparedWindows: 0,
        closedWindows: 0
    });
    harness.auto.cancel();
    t.mock.timers.reset();
});

test('Auto Play resets the bed at ordinary and queued-request Spotify handoffs', async () => {
    let bedResets = 0;
    const requestTrack = {...nextTrack, rank: 15, rankingId: 15, spotifyTrackId: 'queued-request'};
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        stopNarrationBedAtSpotifyHandoff: () => { bedResets += 1; }
    });

    harness.auto.handoffCurrentTrack(firstTrack);
    await harness.auto.playSelectedTrack(requestTrack, {preserveSpotifyWindow: true});

    assert.equal(bedResets, 2);
    assert.deepEqual(harness.state().starts, [requestTrack]);
    assert.equal(harness.state().playbackPhase, 'track');
    harness.auto.cancel();
});

test('radio track handoff schedules one guarded completion after duration plus five seconds', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const radioTrack = {...firstTrack, spotifyTrackId: 'radio-track-1', durationSeconds: 2};
    const trackTwo = {...nextTrack, spotifyTrackId: 'radio-track-2'};
    let trackFinishedSignals = 0;
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: radioTrack,
        bufferSeconds: 5,
        onContinue: ({setPhase, setTrack}) => {
            // The completion callback delegates to the backend-owned flow;
            // its next status frame is Track 2 Intro, not nextTrack().
            trackFinishedSignals += 1;
            setTrack(trackTwo);
            setPhase('intro');
        }
    });

    harness.auto.handoffCurrentTrack(radioTrack);
    t.mock.timers.tick(6999);
    await Promise.resolve();
    assert.equal(harness.state().continued, 0);

    t.mock.timers.tick(1);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(harness.state().continued, 1);
    assert.equal(trackFinishedSignals, 1);
    assert.equal(harness.state().currentTrack, trackTwo);
    assert.equal(harness.state().playbackPhase, 'intro');

    t.mock.timers.tick(60_000);
    await Promise.resolve();
    assert.equal(harness.state().continued, 1);
    assert.equal(trackFinishedSignals, 1);
    t.mock.timers.reset();
});

test('Collections keeps its shared timer through duplicate status frames and advances the same helper to Track 2', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const trackOne = {...firstTrack, spotifyTrackId: 'collection-track-1', durationSeconds: 2};
    const trackTwo = {...nextTrack, spotifyTrackId: 'collection-track-2', durationSeconds: 2};
    const helperWindow = {location: {href: 'https://open.spotify.com/track/collection-track-1'}};
    let trackFinishedSignals = 0;
    let localNextTrackCalls = 0;
    let helperResets = 0;
    const narrationPhases = [];
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: trackOne,
        bufferSeconds: 5,
        onLocalNextTrack: () => { localNextTrackCalls += 1; },
        onContinue: ({setPhase, setTrack}) => {
            // This is the page's backend-radio continuation: restore the
            // existing helper, acknowledge exactly once, then let polling
            // publish Track 2 narration. It never calls local next/stop.
            helperWindow.location.href = '/spotify-wait?language=en';
            helperResets += 1;
            trackFinishedSignals += 1;
            setTrack(trackTwo);
            setPhase('intro');
            narrationPhases.push('intro');
        }
    });

    assert.equal(harness.auto.handoffCurrentTrack(trackOne), true);
    // Real polling repeatedly publishes the same phase=track response while
    // Spotify owns the first track. Duplicate guards must be inert: they may
    // not cancel or replace the timer that was already armed.
    assert.equal(harness.auto.handoffCurrentTrack(trackOne), false);
    assert.equal(harness.auto.handoffCurrentTrack(trackOne), false);

    t.mock.timers.tick(7_000);
    await Promise.resolve();
    await Promise.resolve();

    assert.equal(trackFinishedSignals, 1);
    assert.equal(helperResets, 1);
    assert.equal(helperWindow.location.href, '/spotify-wait?language=en');
    assert.equal(localNextTrackCalls, 0);
    assert.equal(harness.state().playbackPhase, 'intro');
    assert.deepEqual(narrationPhases, ['intro'], 'Track 2 starts at intro; collection_intro is not replayed');

    // The next backend frames are handled as normal narration and then the
    // same Auto Play handoff moves the reserved window to Spotify Track 2.
    assert.equal(harness.state().currentTrack.spotifyTrackId, 'collection-track-2');
    harness.setPhase('detail');
    harness.setPhase('track');
    assert.equal(harness.auto.handoffCurrentTrack(trackTwo), true);
    assert.equal(harness.state().opened, 2);
    t.mock.timers.tick(7_000);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(trackFinishedSignals, 2, 'the second real track gets one completion');
    assert.equal(helperResets, 2, 'the same helper is returned to Old Dog again');
    assert.equal(localNextTrackCalls, 0);
    t.mock.timers.reset();
});

test('interrupting Spotify cancels the completion timer and preserves the paused track', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const radioTrack = {...firstTrack, spotifyTrackId: 'interrupted-track-1', durationSeconds: 2};
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: radioTrack,
        bufferSeconds: 5
    });

    harness.auto.handoffCurrentTrack(radioTrack);
    t.mock.timers.tick(2_000);
    const interrupted = harness.auto.interruptSpotifyTrack();
    const frozen = harness.state();

    assert.equal(interrupted, radioTrack);
    assert.equal(frozen.playbackPhase, 'paused');
    assert.equal(frozen.isPlaying, false);
    assert.equal(frozen.continued, 0);
    assert.equal(harness.auto.interruptSpotifyTrack(), null, 'repeat Pause is inert');

    t.mock.timers.tick(60_000);
    await Promise.resolve();
    assert.equal(harness.state().continued, 0, 'the pre-Pause timer cannot fire later');
    assert.equal(harness.auto.getInterruptedSpotifyTrack(), radioTrack);
    t.mock.timers.reset();
});

test('resuming an interrupted radio track can hand off exactly once to backend Track 2 or next Set intro', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const trackOne = {...firstTrack, spotifyTrackId: 'set-1-track-1', durationSeconds: 2};
    const trackTwo = {...nextTrack, spotifyTrackId: 'set-1-track-2'};
    const harness = createHarness({phase: 'idle', playing: false, track: trackOne, bufferSeconds: 5});
    let protectedTrackFinished = 0;
    let resumePending = false;

    harness.auto.handoffCurrentTrack(trackOne);
    harness.auto.interruptSpotifyTrack();

    async function resumeFromPause(nextPhase, nextTrack) {
        if (resumePending || !harness.auto.getInterruptedSpotifyTrack()) return;
        resumePending = true;
        protectedTrackFinished += 1;
        // The real page waits for this backend-owned phase; it never calls nextTrack.
        harness.auto.clearInterruptedSpotifyTrack();
        resumePending = false;
        await Promise.resolve();
        // Simulate the poller's authoritative response.
        harness.setCurrentTrack(nextTrack);
        void nextPhase;
    }

    await Promise.all([
        resumeFromPause('intro', trackTwo),
        resumeFromPause('intro', trackTwo)
    ]);
    assert.equal(protectedTrackFinished, 1);
    assert.equal(harness.auto.getInterruptedSpotifyTrack(), null);

    // A final Track has the same one-shot handoff. The backend, rather than
    // the client, may answer with the next set's Program Introduction.
    harness.auto.handoffCurrentTrack(trackTwo);
    harness.auto.interruptSpotifyTrack();
    await resumeFromPause('set_intro', {...nextTrack, spotifyTrackId: 'set-2-track-1'});
    assert.equal(protectedTrackFinished, 2);
    t.mock.timers.tick(60_000);
    await Promise.resolve();
    assert.equal(harness.state().continued, 0);
    t.mock.timers.reset();
});

test('a reserved Spotify wait popup is reused once and navigated only for the authoritative next track', async () => {
    const originalWindow = globalThis.window;
    const originalNavigator = globalThis.navigator;
    const originalLocalStorage = globalThis.localStorage;
    const popup = {
        closed: false,
        location: {href: ''},
        blur: () => {},
        focus: () => {},
        close() { this.closed = true; }
    };
    let opens = 0;

    Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {userAgent: 'Desktop Test Browser'}
    });
    Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: {
            open: url => {
                opens += 1;
                popup.location.href = url;
                return popup;
            },
            focus: () => {},
            screen: {availWidth: 1920}
        }
    });
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {setItem: () => {}}
    });

    try {
        const spotify = createCarModeSpotify({getGuidedReady: () => false, setStatus: () => {}});
        assert.equal(spotify.prepareAutoWindow(), true);
        assert.match(popup.location.href, /^\/spotify-wait\?language=en$/);
        assert.equal(spotify.prepareAutoWindow(), true);
        assert.equal(opens, 1, 'repeat Auto Play does not create another wait window');
        assert.equal(spotify.open({...nextTrack, spotifyTrackId: 'backend-track-2'}), true);
        assert.equal(popup.location.href, 'https://open.spotify.com/track/backend-track-2');
        assert.equal(opens, 1, 'handoff navigates the reserved handle, not a fresh popup');
        assert.equal(spotify.close(), true, 'Pause closes the active Spotify popup');
        // Let prepareAutoWindow's desktop focus-restoration callback finish
        // while the mocked window is still installed.
        await new Promise(resolve => setTimeout(resolve, 170));
    } finally {
        Object.defineProperty(globalThis, 'navigator', {configurable: true, value: originalNavigator});
        Object.defineProperty(globalThis, 'window', {configurable: true, value: originalWindow});
        Object.defineProperty(globalThis, 'localStorage', {configurable: true, value: originalLocalStorage});
    }
});

test('a blocked Spotify handoff never starts a completion timer and remains retryable', async t => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const radioTrack = {...firstTrack, spotifyTrackId: 'blocked-track', durationSeconds: 2};
    let failures = 0;
    const harness = createHarness({
        phase: 'idle',
        playing: false,
        track: radioTrack,
        bufferSeconds: 5,
        openSpotify: () => false,
        onSpotifyOpenFailed: () => { failures += 1; }
    });

    assert.equal(harness.auto.handoffCurrentTrack(radioTrack), false);
    assert.equal(harness.state().playbackPhase, 'paused');
    assert.equal(harness.state().activeMode, null);
    assert.equal(failures, 1);
    t.mock.timers.tick(60_000);
    await Promise.resolve();
    assert.equal(harness.state().continued, 0, 'a blocked popup cannot falsely complete a track');
    t.mock.timers.reset();
});
