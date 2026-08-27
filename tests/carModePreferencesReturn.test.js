// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {
    buildCarModePreferencesReturnUrl,
    buildCarModePreferencesUrl,
    findReturnedCarModeTrack,
    getCarModePreferencesReturnUrl,
    isChangedCarModePreferencesReturn,
    isUnchangedCarModePreferencesReturn
} = await import('../src/lib/carmode/CarModePreferencesReturn.ts');
const {createCarModeNarration} = await import('../src/lib/carmode/CarModeNarration.ts');
const {
    cancelAllCarModeAutoPlay,
    createCarModeAutoPlay
} = await import('../src/lib/carmode/CarModeAutoPlay.ts');

const tracks = [
    {rankingId: 22, spotifyTrackId: 'spotify-a', rank: 7},
    {rankingId: 23, spotifyTrackId: 'spotify-b', rank: 8}
];

test('Car Mode preferences return updates EN to ES without changing unrelated selection fields', () => {
    const carUrl = new URL(
        'https://topspot.test/car-page?mode=nostalgia&decade=1980s&genre=pop&language=en&languages=en&playbackOrder=shuffle&view=studio&custom=keep'
    );
    const preferencesPath = buildCarModePreferencesUrl(carUrl, tracks[0]);
    const returnUrl = getCarModePreferencesReturnUrl(
        new URL(preferencesPath, carUrl.origin)
    );

    assert.ok(returnUrl);
    const returned = new URL(
        buildCarModePreferencesReturnUrl(returnUrl, 'es'),
        carUrl.origin
    );

    assert.equal(returned.searchParams.get('language'), 'es');
    assert.equal(returned.searchParams.get('languages'), 'es');
    assert.equal(returned.searchParams.get('custom'), 'keep');
    assert.equal(returned.searchParams.get('view'), 'studio');
    assert.equal(returned.searchParams.get('playbackOrder'), 'shuffle');
    assert.equal(returned.searchParams.get('currentRankingId'), '22');
    assert.equal(returned.searchParams.get('currentSpotifyTrackId'), 'spotify-a');
    assert.equal(returned.searchParams.get('currentRank'), '7');
    assert.equal(isChangedCarModePreferencesReturn(returned), true);
});

test('Car Mode preferences return updates ES to PT-BR and marks no-op language returns', () => {
    const esUrl = new URL(
        'https://topspot.test/car-page?language=es&languages=es&genre=latin&custom=preserve&carModePreferencesReturn=1'
    );
    const ptbrUrl = new URL(
        buildCarModePreferencesReturnUrl(esUrl, 'ptbr'),
        esUrl.origin
    );
    const unchangedUrl = new URL(
        buildCarModePreferencesReturnUrl(esUrl, 'es'),
        esUrl.origin
    );

    assert.equal(ptbrUrl.searchParams.get('language'), 'ptbr');
    assert.equal(ptbrUrl.searchParams.get('languages'), 'ptbr');
    assert.equal(ptbrUrl.searchParams.get('custom'), 'preserve');
    assert.equal(isChangedCarModePreferencesReturn(ptbrUrl), true);
    assert.equal(isUnchangedCarModePreferencesReturn(unchangedUrl), true);
});

test('language-refresh track restoration prefers ranking ID, then Spotify ID, then rank', () => {
    const rankingFirst = new URL(
        'https://topspot.test/car-page?currentRankingId=23&currentSpotifyTrackId=spotify-a&currentRank=7'
    );
    const spotifySecond = new URL(
        'https://topspot.test/car-page?currentRankingId=999&currentSpotifyTrackId=spotify-b&currentRank=7'
    );
    const rankLast = new URL(
        'https://topspot.test/car-page?currentRankingId=999&currentSpotifyTrackId=missing&currentRank=7'
    );

    assert.equal(findReturnedCarModeTrack(tracks, rankingFirst), tracks[1]);
    assert.equal(findReturnedCarModeTrack(tracks, spotifySecond), tracks[1]);
    assert.equal(findReturnedCarModeTrack(tracks, rankLast), tracks[0]);
});

test('Guided narration cancellation invalidates an in-flight narration and never becomes ready', async () => {
    let resolveNarration;
    let ready = false;
    let stopped = 0;
    let bedUrl = null;
    const track = {...tracks[0]};
    let currentTrack = track;

    const narration = createCarModeNarration({
        getCurrentTrack: () => currentTrack,
        getNarrations: () => [{phase: 'intro', url: 'intro.mp3'}],
        getBedUrl: () => 'english-bed.mp3',
        unlockBed: async () => {},
        startBed: async (url) => { bedUrl = url; },
        stopBed: () => { stopped += 1; },
        playNarration: async () => new Promise(resolve => { resolveNarration = resolve; }),
        stopNarration: () => { stopped += 1; },
        updateTiming: () => {},
        resetTiming: () => {},
        getPlaybackPhase: () => 'intro',
        setPlaybackPhase: () => {},
        setIsPlaying: () => {},
        resetGuidedReadyState: () => { ready = false; },
        setGuidedReady: value => { ready = value; }
    });

    const running = narration.start(track);
    await new Promise(resolve => setImmediate(resolve));
    narration.abandon();
    resolveNarration();

    assert.equal(await running, false);
    assert.equal(ready, false);
    assert.ok(stopped >= 2);
    assert.equal(bedUrl, 'english-bed.mp3');
});

test('Auto cancellation invalidates queued advancement before a language-refresh session reset', async () => {
    let advanced = 0;
    const auto = createCarModeAutoPlay({
        getActivePlayMode: () => 'auto',
        setActivePlayMode: () => {},
        getCurrentTrack: () => ({...tracks[0], durationSeconds: 1}),
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
        openSpotify: () => {},
        closeSpotify: () => {},
        continueAutoPlayback: async () => { advanced += 1; },
        nextTrack: async () => {},
        previousTrack: async () => {},
        startPreviousAutoPlayback: async () => {}
    }, 0);

    auto.handleNext();
    cancelAllCarModeAutoPlay();
    await new Promise(resolve => setTimeout(resolve, 130));

    assert.equal(advanced, 0);
});
