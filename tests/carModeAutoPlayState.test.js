// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {createCarModeAutoPlay} = await import(
    '../src/lib/carmode/CarModeAutoPlay.ts'
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
    closeSpotify = () => true
} = {}) {
    let currentTrack = firstTrack;
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
            starts.push(track);
            return true;
        },
        prepareSpotifyWindow: () => {},
        isMobile: () => true,
        openSpotify: () => {
            opened += 1;
            return true;
        },
        closeSpotify,
        queueNextTrack: async () => {
            queued += 1;
            currentTrack = nextTrack;
        },
        setStatus: message => { status.push(message); },
        continueAutoPlayback: async () => { continued += 1; },
        nextTrack: async () => {},
        previousTrack: async () => {},
        startPreviousAutoPlayback: async () => {}
    }, 0);

    return {
        auto,
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
            continued
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
