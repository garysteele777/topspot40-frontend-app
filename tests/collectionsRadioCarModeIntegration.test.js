// @ts-nocheck
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';
import test from 'node:test';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const launch = await import('../src/lib/carmode/playbackLaunch.ts');
const statusTrack = await import('../src/lib/carmode/CarMode.statusTrack.ts');
const {
    buildFallbackPlaybackTrack,
    buildEnrichedPlaybackTrack
} = await import('../src/lib/utils/buildPlaybackTrack.ts');
const {calculatePlaybackTiming} = await import('../src/lib/utils/calculatePlaybackTiming.ts');
const {createCarModeAutoPlay} = await import('../src/lib/carmode/CarModeAutoPlay.ts');

const selection = {
    mode: 'collection',
    programType: 'RADIO_COL',
    language: 'en',
    context: {collection_group_slug: 'music_legends'}
};

function settings(detailLength) {
    return {
        playbackOrder: 'shuffle',
        voices: detailLength === 'off' ? ['intro'] : ['intro', 'detail'],
        voicePlayMode: 'before',
        pauseMode: 'continuous',
        detailLength
    };
}

test('Collections Radio serializes the normalized selected detailLength in /playback/play-track', async () => {
    const requests = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        requests.push({url: String(url), body: JSON.parse(String(init.body))});
        return new Response(null, {status: 200});
    };

    try {
        for (const detailLength of ['short', 'long', 'off']) {
            await fetch('/playback/play-track', launch.playbackTrackRequestInit({
                track: {rank: 0},
                selection: launch.buildPlaybackSelection(selection, settings(detailLength)),
                context: {type: 'collection_radio'}
            }));
        }
    } finally {
        globalThis.fetch = originalFetch;
    }

    assert.deepEqual(requests.map(request => request.url), [
        '/playback/play-track', '/playback/play-track', '/playback/play-track'
    ]);
    assert.equal(requests[0].body.selection.detailLength, 'short');
    assert.equal(requests[1].body.selection.detailLength, 'long');
    assert.equal(requests[2].body.selection.detailLength, 'off');
});

test('a serialized Collections status track is a single playable Spotify handoff', async () => {
    const status = JSON.parse(JSON.stringify({
        phase: 'track',
        current_rank: 10,
        track_name: 'Blue (Da Ba Dee)',
        artist_name: 'Eiffel 65',
        context: {
            ranking_id: 415,
            spotify_track_id: '4sscDOZCkbLSlDqcCgUJnX',
            collection_group_slug: 'music_legends'
        }
    }));
    const identity = statusTrack.playbackStatusTrackIdentity(status);
    const track = buildFallbackPlaybackTrack({
        spotifyId: identity.spotifyId,
        rankingId: identity.rankingId,
        currentRank: identity.currentRank,
        trackName: status.track_name,
        artistName: status.artist_name,
        normalizedCtx: {}
    });

    assert.deepEqual(identity, {
        phase: 'track',
        spotifyId: '4sscDOZCkbLSlDqcCgUJnX',
        currentRank: 10,
        rankingId: 415
    });
    assert.equal(track.rank, 10);
    assert.equal(track.rankingId, 415);

    let lastSpotifyId = null;
    let spotifyOpenCalls = 0;
    for (const frame of [status, status]) {
        const frameIdentity = statusTrack.playbackStatusTrackIdentity(frame);
        if (statusTrack.shouldDispatchSpotifyTrack(
            frameIdentity.phase,
            frameIdentity.spotifyId,
            true,
            lastSpotifyId
        )) {
            lastSpotifyId = frameIdentity.spotifyId;
            spotifyOpenCalls += 1;
        }
    }
    assert.equal(spotifyOpenCalls, 1);
});

test('Collections applies the live public durationMs track frame to the final Auto Play handoff track', () => {
    // This is the exact `/playback/status` shape emitted by the backend route:
    // `durationMs` is top-level milliseconds; the existing radio context has
    // collection metadata but no usable duration of its own.
    const narrationStatus = {
        isPlaying: true,
        isPaused: false,
        stopped: false,
        phase: 'intro',
        playbackSessionId: 'collection-session-1',
        track_name: 'Blue (Da Ba Dee)',
        artist_name: 'Eiffel 65',
        current_rank: 10,
        elapsedMs: 0,
        durationMs: 0,
        progress: 0,
        context: {
            mode: 'collections_radio',
            ranking_id: 415,
            spotify_track_id: '4sscDOZCkbLSlDqcCgUJnX',
            duration_ms: null
        }
    };
    const status = {
        ...narrationStatus,
        phase: 'track',
        elapsedMs: 225_000,
        durationMs: 225_000,
        trackStartedAtMs: 1_700_000_000_000,
        progress: 1,
        context: {
            ...narrationStatus.context,
            mode: 'spotify',
            // Regression: an existing context with null duration must not
            // overwrite the valid top-level playback-status duration.
            duration_ms: null
        }
    };
    const identity = statusTrack.playbackStatusTrackIdentity(narrationStatus);
    const narrationTrack = buildFallbackPlaybackTrack({
        spotifyId: identity.spotifyId,
        rankingId: identity.rankingId,
        currentRank: identity.currentRank,
        trackName: narrationStatus.track_name,
        artistName: narrationStatus.artist_name,
        normalizedCtx: {durationMs: null},
        statusDurationMs: calculatePlaybackTiming(narrationStatus).durationMs
    });
    const finalTrack = buildEnrichedPlaybackTrack({
        baseTrack: narrationTrack,
        normalizedCtx: {durationMs: null},
        statusDurationMs: calculatePlaybackTiming(status).durationMs
    });

    assert.equal(narrationTrack.durationMs, 0);
    assert.equal(calculatePlaybackTiming(status).durationMs, 225_000);
    assert.equal(finalTrack.durationMs, 225_000, 'handoff receives milliseconds, not seconds');

    let handedOffTrack = null;
    const auto = createCarModeAutoPlay({
        getActivePlayMode: () => 'auto',
        setActivePlayMode: () => {},
        getCurrentTrack: () => finalTrack,
        getIsPlaying: () => false,
        setIsPlaying: () => {},
        getPlaybackPhase: () => 'track',
        setPlaybackPhase: () => {},
        pauseNarration: () => {},
        takePausedNarrationPhase: () => null,
        abandonNarration: () => {},
        startNarration: async () => true,
        prepareSpotifyWindow: () => {},
        isMobile: () => true,
        openSpotify: () => true,
        closeSpotify: () => true,
        queueNextTrack: async () => {},
        setStatus: () => {},
        continueAutoPlayback: async () => {},
        nextTrack: async () => {},
        previousTrack: async () => {},
        startPreviousAutoPlayback: async () => {},
        onSpotifyHandoff: track => { handedOffTrack = track; }
    }, 5);
    assert.equal(auto.handoffCurrentTrack(finalTrack), true);
    assert.equal(handedOffTrack.durationMs, 225_000);
    auto.cancel();
});

test('Collections narration frames never hand off Spotify, while the Car Mode event uses Auto Play for Collections', async () => {
    for (const phase of ['collection_intro', 'intro', 'detail', 'artist']) {
        assert.equal(
            statusTrack.shouldDispatchSpotifyTrack(phase, '4sscDOZCkbLSlDqcCgUJnX', true, null),
            false,
            `${phase} must not open Spotify`
        );
    }

    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const handler = carPage.match(/function handleGuidedTrackReady\(event: Event\): void \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(handler, /isBackendRadioAutoHandoffSelection\(\)/);
    assert.match(handler, /autoPlay\.handoffCurrentTrack\(track\)/);
    assert.match(carPage, /programType === PROGRAM_TYPES\.RADIO_DG[\s\S]*programType === PROGRAM_TYPES\.RADIO_COL/);
});

test('Collections reserves Nostalgia\'s Auto Play helper window before backend narration and reuses its recovery handoff', async () => {
    const carPage = await readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const autoHandler = carPage.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const initialStart = carPage.match(/async function startInitialCollectionsRadioSet\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const retry = carPage.match(/function retryBackendRadioSpotifyHandoff\(\): void \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(autoHandler, /needsInitialCollectionsRadioStart\(\)[\s\S]*reserveBackendRadioSpotifyWindow\(\)[\s\S]*await startInitialCollectionsRadioSet\(\)/);
    assert.ok(
        autoHandler.indexOf('reserveBackendRadioSpotifyWindow()') < autoHandler.indexOf('await startInitialCollectionsRadioSet()'),
        'the helper window must be reserved before asynchronous Collections startup'
    );
    assert.match(initialStart, /startPlaybackPolling\([\s\S]*?markUserStartedPlayback\([\s\S]*?await playTrack/);
    assert.match(autoHandler, /isCollectionsRadioAutoHandoffSelection\(\) && radioSpotifyRetryTrack/);
    assert.match(retry, /reserveBackendRadioSpotifyWindow\(\)/);
    assert.match(retry, /autoPlay\.handoffCurrentTrack\(retryTrack\)/);
    assert.match(carPage, /onSpotifyOpenFailed:[\s\S]*isBackendRadioAutoHandoffSelection\(\)/);
});

test('Collections advances the backend after Track 1, restores the same wait window, and leaves Track 2 narration to the poller', async () => {
    const [carPage, spotify, poller] = await Promise.all([
        readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/carmode/CarModeSpotify.ts', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/carmode/CarMode.poller.ts', import.meta.url), 'utf8')
    ]);
    const continuation = carPage.match(/async function continueAutoPlayback\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const nextHandler = carPage.match(/async function handleAutoNextTrack\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const collectionsStart = carPage.match(/async function startInitialCollectionsRadioSet\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(continuation, /const helperReset = spotify\.returnToWaitingPage\(\)/);
    assert.match(continuation, /isBackendRadioAutoHandoffSelection\(\)/);
    assert.match(continuation, /await advancePrivateRadioTrack\(\)/);
    assert.ok(continuation.indexOf('returnToWaitingPage()') < continuation.indexOf('await advancePrivateRadioTrack()'));
    assert.match(continuation, /radioSpotifyRetryTrack = get\(currentTrack\)/);
    assert.match(nextHandler, /PROGRAM_TYPES\.RADIO_DG[\s\S]*PROGRAM_TYPES\.RADIO_COL/);
    assert.ok(nextHandler.indexOf('return;') < nextHandler.indexOf('await nextTrack()'));
    assert.match(collectionsStart, /externalRadioTrackClock: true/);
    assert.match(spotify, /function returnToWaitingPage\(\): boolean/);
    assert.match(spotify, /spotifyWindow && !spotifyWindow\.closed/);
    assert.match(poller, /externalRadioTrackClock && isBackendRadio && narrationPhase/);
    assert.match(poller, /if \(phase === 'intro'\) \{\s*lastSpotifyId = null;/);
});
