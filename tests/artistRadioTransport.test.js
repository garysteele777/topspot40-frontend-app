// @ts-nocheck -- focused transport contracts span Svelte route wiring and Auto Play.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const pagePath = new URL('../src/routes/car-page/+page.svelte', import.meta.url);
const panelPath = new URL('../src/lib/components/car/DriveInPlayerPanel.svelte', import.meta.url);
const pollerPath = new URL('../src/lib/carmode/CarMode.poller.ts', import.meta.url);
const {createCarModeAutoPlay} = await import('../src/lib/carmode/CarModeAutoPlay.ts');

const radioTrack = {
    rankingId: 41,
    rank: 1,
    spotifyTrackId: 'artist-country-track-1',
    trackName: 'Country track',
    durationSeconds: 180
};

test('manual Auto Next coalesces repeated clicks into one backend-owned continuation', async () => {
    let continuations = 0;
    let activeMode = 'auto';
    let playing = true;
    let phase = 'track';

    const auto = createCarModeAutoPlay({
        getActivePlayMode: () => activeMode,
        setActivePlayMode: value => { activeMode = value; },
        getCurrentTrack: () => radioTrack,
        getIsPlaying: () => playing,
        setIsPlaying: value => { playing = value; },
        getPlaybackPhase: () => phase,
        setPlaybackPhase: value => { phase = value; },
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
        continueAutoPlayback: async () => {
            continuations += 1;
            // The backend publishes the following narration frame; it owns
            // the next Artist Radio track rather than the browser re-handing
            // off the current one.
            phase = 'intro';
        },
        nextTrack: async () => { throw new Error('backend radio must not use local nextTrack'); },
        previousTrack: async () => {},
        startPreviousAutoPlayback: async () => {}
    }, 5);

    auto.handleNext();
    auto.handleNext();
    await new Promise(resolve => setTimeout(resolve, 125));

    assert.equal(continuations, 1);
    assert.equal(playing, false);
    auto.cancel();
});

test('radio Next is enabled only for an installed playable track and is guarded while loading', async () => {
    const panel = await readFile(panelPath, 'utf8');
    const page = await readFile(pagePath, 'utf8');

    assert.match(panel, /disabled=\{radioAutoOnly && \(radioLoadPending \|\| phase !== 'track'\)\}/);
    assert.match(page, /radioLoadPending=\{radioStartPending \|\| radioAdvancePending\}/);

    const nextHandler = page.match(/async function handleDriveInNext\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(nextHandler, /isBackendRadioAutoHandoffSelection\(\)/);
    assert.match(nextHandler, /get\(playbackPhase\) !== 'track'/);
    assert.match(nextHandler, /radioAdvancePending/);
    assert.match(nextHandler, /autoPlay\.cancel\(\)/);
    assert.match(nextHandler, /await advancePrivateRadioTrack\(track\)/);
    assert.match(nextHandler, /autoPlay\.handleNext\(\)/);
});

test('Artist Radio Next waits for an accepted backend completion and the next status-track installation', async () => {
    const [page, poller] = await Promise.all([readFile(pagePath, 'utf8'), readFile(pollerPath, 'utf8')]);
    const continuation = page.match(/async function continueAutoPlayback\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const advance = page.match(/async function advancePrivateRadioTrack\(trackOverride\?: CarModeTrack\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(continuation, /isBackendRadioAutoHandoffSelection\(\)/);
    assert.match(continuation, /await advancePrivateRadioTrack\(\)/);
    assert.match(advance, /radioAdvancePending/);
    assert.match(advance, /radioCompletionSpotifyTrackId === track\.spotifyTrackId/);
    assert.match(advance, /signalTrackFinishedApi/);
    assert.match(advance, /radioAdvancePending = true/);
    assert.match(advance, /const result = await response\.json\(\)/);
    assert.match(advance, /result\?\.ignored/);
    assert.match(advance, /radioAdvancePending = false/);
    assert.match(poller, /onBackendRadioTrackInstalled\?: \(spotifyTrackId: string \| null\) => void/);
    assert.match(poller, /options\.onBackendRadioTrackInstalled\?\.\(contextTrackId\)/);
    assert.match(page, /onBackendRadioTrackInstalled: completeBackendRadioAdvance/);
});

test('an ignored backend completion cannot leave Artist Radio paused on its unchanged track', async () => {
    const page = await readFile(pagePath, 'utf8');
    const nextHandler = page.match(/async function handleDriveInNext\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(nextHandler, /const advanced = await advancePrivateRadioTrack\(track\)/);
    assert.match(nextHandler, /if \(!advanced\) \{/);
    assert.match(nextHandler, /autoPlay\.handoffCurrentTrack\(track\)/);
    assert.doesNotMatch(nextHandler, /setExternalRadioSpotifyHandoffReady\(false\)/);
});

test('Artist Radio pauses and resumes through the guarded interruption path without replacing its track', async () => {
    const page = await readFile(pagePath, 'utf8');
    const autoHandler = page.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(autoHandler, /if \(isArtistRadioSelection\(\)\)/);
    assert.match(autoHandler, /if \(!hasInstalledPrivateRadioTrack\(\)\)/);
    assert.match(autoHandler, /isInterruptibleBackendRadioSelection\(\)/);
    assert.match(autoHandler, /autoPlay\.interruptSpotifyTrack\(\)/);
    assert.match(autoHandler, /interruptedRadioTrack = interrupted/);
    assert.match(autoHandler, /if \(isArtistRadioSelection\(\)\) \{[\s\S]*?autoPlay\.handoffCurrentTrack\(interruptedRadioTrack\)/);
    const artistResume = autoHandler.match(/if \(interruptedRadioTrack\) \{[\s\S]*?if \(isArtistRadioSelection\(\) \{([\s\S]*?)\n                \}/)?.[1] ?? '';
    assert.doesNotMatch(artistResume, /advancePrivateRadioTrack/);
    assert.match(autoHandler, /await startInitialArtistRadioSet\(\);\s*return;/);
});

test('Previous stays visibly and accessibly unavailable for backend radio, while Nostalgia and Collections share Next support', async () => {
    const [panel, page] = await Promise.all([readFile(panelPath, 'utf8'), readFile(pagePath, 'utf8')]);

    assert.match(panel, /class:transport-unavailable=\{radioAutoOnly\}/);
    assert.match(panel, /disabled=\{radioAutoOnly\}/);
    assert.match(panel, /previousUnavailable/);
    assert.match(panel, /\.transport-unavailable:disabled/);
    assert.match(page, /programType === PROGRAM_TYPES\.RADIO_DG \|\|[\s\S]*programType === PROGRAM_TYPES\.RADIO_COL \|\|[\s\S]*programType === PROGRAM_TYPES\.RADIO_ARTIST/);
});
