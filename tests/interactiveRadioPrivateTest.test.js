// @ts-nocheck -- source-contract tests keep this private recovery isolated from public experiences.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';
import {register} from 'node:module';

const routePath = new URL('../src/routes/interactive-radio-test/+page.svelte', import.meta.url);
const panelPath = new URL('../src/lib/components/options-v2/InteractiveRadioPanel.svelte', import.meta.url);
const carPagePath = new URL('../src/routes/car-page/+page.svelte', import.meta.url);
const driveInPath = new URL('../src/lib/components/car/DriveInPlayerPanel.svelte', import.meta.url);
const loaderPath = new URL('../src/lib/carmode/CarMode.loader.ts', import.meta.url);
const pollerPath = new URL('../src/lib/carmode/CarMode.poller.ts', import.meta.url);
const playbackTrackPath = new URL('../src/lib/utils/buildPlaybackTrack.ts', import.meta.url);
const playbackContextPath = new URL('../src/lib/utils/normalizePlaybackContext.ts', import.meta.url);
const playbackApiPath = new URL('../src/lib/api/playbackApi.ts', import.meta.url);
const backendBasePath = new URL('../src/lib/api/backendBase.ts', import.meta.url);
const timingPath = new URL('../src/lib/utils/calculatePlaybackTiming.ts', import.meta.url);

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);
const {buildSelectionFromUrl} = await import('../src/lib/helpers/car/selectionFromUrl.ts');
const {normalizePlaybackContext} = await import('../src/lib/utils/normalizePlaybackContext.ts');
const {buildFallbackPlaybackTrack} = await import('../src/lib/utils/buildPlaybackTrack.ts');
const {calculatePlaybackTiming} = await import('../src/lib/utils/calculatePlaybackTiming.ts');
const playbackApi = await import('../src/lib/api/playbackApi.ts');
const {resolveBackendApiBase} = await import('../src/lib/api/backendBase.ts');

async function sourceFiles(directory) {
    const entries = await readdir(new URL(directory, import.meta.url), {withFileTypes: true});
    return (await Promise.all(entries.map(entry => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory() ? sourceFiles(path) : [path];
    }))).flat();
}

test('private Interactive Radio test route exists and is labelled', async () => {
    const route = await readFile(routePath, 'utf8');
    assert.match(route, /Interactive Radio — Private Test/);
    assert.match(route, /InteractiveRadioPanel/);
});
test('no public source links to the private radio test route', async () => {
    const files = await sourceFiles('../src');
    for (const file of files) {
        if (file.endsWith('/interactive-radio-test/+page.svelte')) continue;
        const source = await readFile(new URL(file, import.meta.url), 'utf8');
        assert.doesNotMatch(source, /(?:href=|goto\()['"][^'"]*\/interactive-radio-test/, file);
    }
});

test('the journey chooser does not expose the private-test route', async () => {
    const chooser = await readFile(new URL('../src/routes/journey-prototype/choose/+page.svelte', import.meta.url), 'utf8');
    assert.match(chooser, /buildExperienceDestination/);
    assert.doesNotMatch(chooser, /interactive-radio-test/);
});

test('all recovered radio station categories are available', async () => {
    const panel = await readFile(panelPath, 'utf8');
    for (const label of ['Nostalgia', 'Collections', 'Artist Spotlight']) assert.match(panel, new RegExp(`>${label}<`));
    assert.match(panel, /mode === 'nostalgia'/);
    assert.match(panel, /mode === 'collections'/);
    assert.match(panel, /common\.set\('mode', 'artist_radio'\)/);
});

test('private radio is desktop-only Drive-In Auto Play with no Guided Play', async () => {
    const [panel, carPage, driveIn] = await Promise.all([readFile(panelPath, 'utf8'), readFile(carPagePath, 'utf8'), readFile(driveInPath, 'utf8')]);
    assert.match(panel, /matchMedia\('\(min-width: 1200px\)'\)/);
    assert.match(panel, /Interactive Radio testing requires a desktop computer\./);
    assert.match(panel, /interactiveRadioTest: 'true'/);
    assert.match(carPage, /interactiveRadioTest && isSmallScreen/);
    assert.match(carPage, /carDisplayView = 'drive-in'/);
    assert.match(driveIn, /radioAutoOnly/);
    assert.match(driveIn, /\{#if !radioAutoOnly\}/);
    assert.match(driveIn, /on:click=\{onAutoPlay\}/);
});

test('Country and Pop private-radio URLs preserve their genre for the backend set generator', async () => {
    const [loader, carPage, poller] = await Promise.all([
        readFile(loaderPath, 'utf8'), readFile(carPagePath, 'utf8'), readFile(pollerPath, 'utf8')
    ]);
    for (const genre of ['country', 'pop']) {
        const selection = buildSelectionFromUrl(new URL(
            `https://topspot.test/car-page?mode=nostalgia&decade=ALL&genre=${genre}&interactiveRadioTest=true`
        ));
        assert.equal(selection.mode, 'decade_genre');
        assert.equal(selection.context.decade, 'ALL');
        assert.equal(selection.context.genre, genre);
    }
    assert.match(loader, /Radio is backend-owned/);
    assert.match(loader, /sel\.programType = PROGRAM_TYPES\.RADIO_DG/);
    assert.doesNotMatch(loader, /loadTrackSequence\(sel\)[\s\S]{0,200}decade === 'ALL'/);
    assert.match(carPage, /startRadioSequence\(radioParams\)/);
    assert.match(carPage, /loadFirstRadioSet\(\): Promise<boolean>/);
    assert.match(carPage, /play_intro: 'true'/);
    assert.match(carPage, /detail_length: detailLength/);
    assert.match(carPage, /play_detail: String\(detailLength !== 'off'\)/);
    assert.match(carPage, /play_artist_description: String\(artistStoriesEnabled\)/);
    assert.match(poller, /Radio still needs the normal timing\/track-finished path/);
});
test('private radio keeps narration controls active and queues changes for the next set', async () => {
    const [carPage, panel, header, options, driveIn] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(panelPath, 'utf8'),
        readFile(new URL('../src/lib/components/car/CarModeHeader.svelte', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/components/car/NarrationOptions.svelte', import.meta.url), 'utf8'),
        readFile(driveInPath, 'utf8')
    ]);
    const radioMount = carPage.match(/if \(interactiveRadioTest\) \{([\s\S]*?)\n        \} else if/)?.[1] ?? '';
    const firstSetLoader = carPage.match(/async function loadFirstRadioSet\(\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.doesNotMatch(radioMount, /voices:\s*\['intro', 'detail'\]|detailLength:\s*'short'/);
    assert.match(firstSetLoader, /const detailLength = settings\.voices\.includes\('detail'\)/);
    assert.match(firstSetLoader, /detail_length: detailLength/);
    assert.match(firstSetLoader, /play_artist_description: String\(artistStoriesEnabled\)/);
    assert.match(carPage, /radioNarrationPolicyActive = true/);
    assert.match(header, /narrationOptionsLocked/);
    assert.match(options, /disabled=\{narrationOptionsLocked\}/);
    assert.doesNotMatch(carPage, /narrationOptionsLocked=\{interactiveRadioTest && radioNarrationPolicyActive\}/);
    assert.match(carPage, /onDetailLengthChange=\{(?:handleDetailLengthChange|\(value\) => \{ handleDetailLengthChange\(value\);)/);
    assert.match(carPage, /onArtistStoriesChange=\{handleArtistStoriesChange\}/);
    assert.match(carPage, /updateRadioNarrationPolicy\(\{/);
    assert.match(carPage, /radioNarrationPolicyUpdate = radioNarrationPolicyUpdate/);
    assert.match(panel, /const settings = get\(playbackSettingsStore\)/);
    assert.doesNotMatch(panel, /const voices: VoicePart\[\] = \['intro', 'detail'\]/);

    const viewSwitch = driveIn.match(/\{#if !radioAutoOnly\}[\s\S]*?<div class="view-switch"[\s\S]*?<\/div>[\s\S]*?\{\/if\}/)?.[0] ?? '';
    assert.match(viewSwitch, /class="view-switch"/);
    assert.match(viewSwitch, /on:click=\{onUseClassicView\}/);
    assert.match(viewSwitch, /driveInView/);
});

test('a private radio track-finished signal remains with the backend until its set completes', async () => {
    const carPage = await readFile(carPagePath, 'utf8');
    const handler = carPage.match(/async function handleAutoNextTrack\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(handler, /interactiveRadioTest/);
    assert.match(handler, /RADIO_DG/);
    assert.match(handler, /return;/);
    assert.ok(handler.indexOf('return;') < handler.indexOf('await nextTrack()'));
});

test('Auto Play bootstraps, installs a real first track, then begins normal narration', async () => {
    const [carPage, poller, playbackTrack, playbackContext, driveIn, playbackApi] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(pollerPath, 'utf8'),
        readFile(playbackTrackPath, 'utf8'),
        readFile(playbackContextPath, 'utf8'),
        readFile(driveInPath, 'utf8'),
        readFile(playbackApiPath, 'utf8')
    ]);

    const firstSetLoader = carPage.match(/async function loadFirstRadioSet\(\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(firstSetLoader, /startGuestPlaybackSession\(\)/);
    assert.match(firstSetLoader, /startRadioSequence\(params\)/);
    assert.ok(firstSetLoader.indexOf('startGuestPlaybackSession()') < firstSetLoader.indexOf('startRadioSequence(params)'));
    assert.match(playbackApi, /playback\/guest-session/);
    assert.match(playbackApi, /credentials: 'include'/);
    assert.match(firstSetLoader, /guestSession\.ok/);
    assert.match(firstSetLoader, /response\.status === 401/);
    assert.match(firstSetLoader, /result\.status !== 'started'/);
    assert.match(carPage, /async function waitForRadioTrack/);
    assert.match(carPage, /response\.status === 401/);
    assert.match(carPage, /private playback session could not be authorized/);
    assert.match(carPage, /function installRadioTrackStatus/);
    assert.match(carPage, /typeof spotifyTrackId !== 'string'/);
    assert.match(carPage, /generatedGenre !== requestedGenre/);
    assert.match(carPage, /tracks\.set\(\[track\]\)/);
    assert.match(carPage, /currentTrack\.set\(track\)/);
    const autoPlayHandler = carPage.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.ok(autoPlayHandler.indexOf('await loadFirstRadioSet()') < autoPlayHandler.indexOf('await autoPlay.handlePlay()'));
    assert.match(playbackContext, /ctx\.year/);
    assert.match(playbackTrack, /yearReleased: normalizedCtx\.yearReleased/);

    assert.match(carPage, /radioSetNumber=\{interactiveRadioTest \? \$currentTrack\.setNumber/);
    assert.match(driveIn, /class="radio-set-info">Set \{radioSetNumber\}: \{radioSetLabel\}/);
    assert.match(driveIn, /formatDriveInTrackPosition\(radioSetPosition, radioSetSize, language\)/);
    assert.match(driveIn, /<strong>\{programTitle\}<\/strong>/);
    assert.match(driveIn, /class="radio-set-info"/);
    assert.match(carPage, /radioMarqueeTitle/);
    assert.match(carPage, /toUpperCase\(\)\} RADIO/);
    assert.match(carPage, /nostalgiaRadioStationLabel\(/);
    assert.match(carPage, /\$currentTrack\.decadeName.*\$currentTrack\.genreName/s);
});

test('private radio defers its status poller until Auto Play starts the backend sequence', async () => {
    const carPage = await readFile(carPagePath, 'utf8');
    assert.match(carPage, /mountedSettings\.playbackMethod === 'automatic' && !interactiveRadioTest/);
    assert.match(carPage, /playbackPhase\.set\('idle'\)/);
    assert.match(carPage, /isPlaying\.set\(false\)/);
});

test('Track 1 timer hands off through backend Track 2 Intro, Detail acknowledgements, then Spotify', async () => {
    const carPage = await readFile(carPagePath, 'utf8');
    const poller = await readFile(pollerPath, 'utf8');
    const continuation = carPage.match(/async function continueAutoPlayback\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const advance = carPage.match(/async function advancePrivateRadioTrack\(trackOverride\?: CarModeTrack\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const installer = carPage.match(/function installRadioTrackStatus\([\s\S]*?\n    \}/)?.[0] ?? '';

    assert.match(continuation, /isPrivateNostalgiaRadioSelection\(\)/);
    assert.match(continuation, /await advancePrivateRadioTrack\(\)/);
    assert.ok(continuation.indexOf('await advancePrivateRadioTrack()') < continuation.indexOf('await nextTrack(true)'));
    assert.match(advance, /signalTrackFinishedApi/);
    assert.match(advance, /Do not wait for the final track frame/);
    assert.doesNotMatch(advance, /waitForRadioTrack\(track\.spotifyTrackId\)/);
    assert.match(advance, /radioCompletionSpotifyTrackId === track\.spotifyTrackId/);
    assert.match(advance, /radioCompletionSpotifyTrackId = track\.spotifyTrackId/);
    assert.match(installer, /previousSpotifyTrackId && spotifyTrackId === previousSpotifyTrackId/);
    assert.doesNotMatch(installer, /installedTrack\.setNumber !== setNumber/);
    assert.match(carPage, /tracks\.set\(\[track\]\)/);
    assert.match(carPage, /externalRadioTrackClock: true/);
    assert.match(carPage, /autoPlay\.handoffCurrentTrack\(track\)/);
    assert.match(poller, /externalRadioTrackClock/);
    assert.match(poller, /signalNarrationFinished\(playbackSessionId, completedPhase\)/);
});

test('guest radio lifecycle calls share the configured backend origin and halt status polling on authorization failure', async () => {
    const [api, base, carPage, poller, loader] = await Promise.all([
        readFile(playbackApiPath, 'utf8'), readFile(backendBasePath, 'utf8'),
        readFile(carPagePath, 'utf8'), readFile(pollerPath, 'utf8'), readFile(loaderPath, 'utf8')
    ]);

    assert.match(base, /BACKEND_API_BASE.*127\.0\.0\.1:8000/s);
    assert.doesNotMatch(base, /localhost:8000/);
    for (const endpoint of ['guest-session', 'play-sequence', 'status', 'reset', 'client-diagnostic', 'narration-finished', 'track-finished']) {
        assert.match(api, new RegExp(endpoint));
    }
    assert.match(api, /backendUrl\(/);
    assert.match(carPage, /startGuestPlaybackSession\(\)/);
    assert.match(carPage, /startRadioSequence\(params\)/);
    assert.match(loader, /resetPlaybackApi\(\)/);
    assert.match(poller, /sendPlaybackDiagnostic\(/);
    assert.match(poller, /res\.status === 401 \|\| res\.status === 403/);
    assert.match(poller, /stopPlaybackPolling\(\)/);
});

test('guest-protected radio requests always include the cross-origin guest cookie', async () => {
    const requests = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        requests.push([String(url), init]);
        return new Response(null, {status: 200});
    };

    try {
        await playbackApi.startGuestPlaybackSession();
        await playbackApi.startRadioSequence(new URLSearchParams({decade: '1980s', genre: 'pop'}));
        await playbackApi.updateRadioNarrationPolicy({
            detailLength: 'long',
            artistStoriesEnabled: true
        });
        await playbackApi.fetchPlaybackStatus();
        await playbackApi.sendPlaybackDiagnostic({event: 'radio-test'});
        await playbackApi.stopPlaybackApi();
    } finally {
        globalThis.fetch = originalFetch;
    }

    assert.deepEqual(
        requests.map(([url]) => new URL(url).pathname),
        [
            '/playback/guest-session',
            '/supabase/decade-genre/play-sequence',
            '/supabase/decade-genre/radio-narration-policy',
            '/playback/status',
            '/playback/client-diagnostic',
            '/playback/stop'
        ]
    );
    for (const [, init] of requests) assert.equal(init.credentials, 'include');
});

test('local backend URLs use the browser loopback hostname without changing API protocol or port', () => {
    assert.equal(
        resolveBackendApiBase('http://localhost:8000', '127.0.0.1'),
        'http://127.0.0.1:8000'
    );
    assert.equal(
        resolveBackendApiBase('https://127.0.0.1:9443', 'localhost'),
        'https://localhost:9443'
    );
});

test('non-loopback API URLs remain unchanged outside local loopback development', () => {
    const productionUrl = 'https://api.topspot40.com';
    assert.equal(resolveBackendApiBase(productionUrl, '127.0.0.1'), productionUrl);
    assert.equal(resolveBackendApiBase('http://127.0.0.1:8000', 'preview.topspot40.com'), 'http://127.0.0.1:8000');
});

test('Change Music abandons an active radio runtime before returning to its launcher', async () => {
    const [carPage, poller, playbackApi] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(pollerPath, 'utf8'),
        readFile(playbackApiPath, 'utf8')
    ]);
    const cleanup = carPage.match(/async function abandonInteractiveRadioAndReturn\(\): Promise<void> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const back = carPage.match(/function backToOptions\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    for (const required of [
        'cancelAllCarModeAutoPlay()', 'autoPlay.cancel()',
        'stopCurrentNarrationPhase({resolvePhase: false})', 'narration.abandon()',
        'stopNarrationAudio()', 'stopBed()', 'spotify.close()', 'spotify.reset()',
        'stopPlaybackPolling()', 'resetNarrationPhaseState()', 'resetPlaybackProgress()',
        'await stopPlaybackApi(abortController.signal)'
    ]) assert.match(cleanup, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(cleanup, /signalTrackFinishedApi|advancePrivateRadioTrack|nextTrack/);
    assert.ok(cleanup.indexOf('cancelAllCarModeAutoPlay()') < cleanup.indexOf('await stopPlaybackApi'));
    assert.ok(cleanup.indexOf('await stopPlaybackApi') < cleanup.indexOf('window.location.href'));
    assert.match(back, /void abandonInteractiveRadioAndReturn\(\)/);
    assert.match(carPage, /if \(radioChangeMusicInProgress\) return;/);
    assert.match(carPage, /isRadioExperienceDestination\(radioReturnTo\)/);
    assert.match(playbackApi, /fetchPlaybackApi\('\/playback\/stop'/);
    assert.match(playbackApi, /credentials: 'include'/);
    assert.match(playbackApi, /signal/);
    assert.match(poller, /let pollGeneration = 0/);
    assert.match(poller, /activePollGeneration !== pollGeneration/);
    assert.match(poller, /let narrationGeneration = 0/);
    assert.match(poller, /activeNarrationGeneration !== narrationGeneration/);
});

test('Change Music keeps private and journey radio return destinations separate', async () => {
    const carPage = await readFile(carPagePath, 'utf8');
    const destination = carPage.match(/function radioChangeMusicDestination\(\): string \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(destination, /radioReturnTo/);
    assert.match(destination, /isRadioExperienceDestination/);
    assert.match(destination, /'\/interactive-radio-test'/);
});

test('Track 1 completion is guarded once and backend clock data cannot render epoch time', async () => {
    const [carPage, backendStatus, backendSequence] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(new URL('../../topspot-backend-interactive-radio/backend/routers/playback_status.py', import.meta.url), 'utf8'),
        readFile(new URL('../../topspot-backend-interactive-radio/backend/services/all_radio_sequence.py', import.meta.url), 'utf8')
    ]);
    const advance = carPage.match(/async function advancePrivateRadioTrack\(trackOverride\?: CarModeTrack\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(advance, /radioCompletionSpotifyTrackId === track\.spotifyTrackId/);
    assert.match(advance, /radioCompletionSpotifyTrackId = track\.spotifyTrackId/);
    assert.match(advance, /signalTrackFinishedApi/);
    assert.match(backendSequence, /begin_track\(user_id, \(track\.duration_ms or 0\) \/ 1000\.0\)/);
    assert.match(backendSequence, /await track_done_event\(user_id\)\.wait\(\)/);
    assert.match(backendStatus, /trackStartedAtMs/);

    const nearNow = Date.now() - 250;
    const timing = calculatePlaybackTiming({
        elapsedMs: 1_789_496_000_000,
        durationMs: 180_000,
        trackStartedAtMs: nearNow
    });
    assert.ok(timing.elapsedSec >= 0 && timing.elapsedSec < 2);
    assert.equal(timing.durationSec, 180);
});

test('a Set 2 Program Introduction replaces Set 1 Track 3 before its narration and Spotify handoff', async () => {
    const [poller, driveIn, backendSequence, playbackTrack] = await Promise.all([
        readFile(pollerPath, 'utf8'),
        readFile(driveInPath, 'utf8'),
        readFile(new URL('../../topspot-backend-interactive-radio/backend/services/all_radio_sequence.py', import.meta.url), 'utf8'),
        readFile(playbackTrackPath, 'utf8')
    ]);

    assert.match(backendSequence, /await publish_set_intro_phase\(/);
    assert.match(backendSequence, /"set_number": set_number/);
    assert.match(backendSequence, /"block_position": idx/);
    assert.match(backendSequence, /"album_artwork": track\.album_artwork/);
    assert.match(poller, /const radioSetBoundary/);
    assert.match(poller, /incomingSetNumber !== currentRadioSetNumber/);
    assert.match(poller, /const next = radioSetBoundary/);
    assert.match(poller, /tracks\.set\(\[/);
    assert.match(poller, /signalNarrationFinished\(playbackSessionId, completedPhase\)/);
    assert.match(poller, /ts-guided-track-ready/);
    assert.match(playbackTrack, /albumArtwork:\s*normalizedCtx\.album_artwork/s);
    assert.match(playbackTrack, /setNumber:\s*normalizedCtx\.setNumber/s);
    assert.match(driveIn, /radioSetPosition && radioSetSize/);
    assert.match(driveIn, /radio-set-info/);
});

test('a backend radio duration maps into the Auto Play timer track without a fallback duration', async () => {
    const normalized = normalizePlaybackContext({
        duration_ms: 187000,
        set_number: 1,
        block_position: 1,
        block_size: 4
    });
    const track = buildFallbackPlaybackTrack({
        spotifyId: 'country-track-1',
        currentRank: 1,
        trackName: 'Known duration track',
        artistName: 'Country artist',
        normalizedCtx: normalized
    });
    const autoPlay = await readFile(new URL('../src/lib/carmode/CarModeAutoPlay.ts', import.meta.url), 'utf8');

    assert.equal(normalized.durationMs, 187000);
    assert.equal(track.durationMs, 187000);
    assert.match(autoPlay, /track\.durationMs \? Math\.floor\(track\.durationMs \/ 1000\) : 0/);
    assert.doesNotMatch(autoPlay, /durationMs[^\n]{0,120}\?\?\s*\d{2,}/);
});

test('an interrupted radio Spotify track freezes the backend clock and performs one authoritative handoff on Auto Play', async () => {
    const [carPage, poller, autoPlay] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(pollerPath, 'utf8'),
        readFile(new URL('../src/lib/carmode/CarModeAutoPlay.ts', import.meta.url), 'utf8')
    ]);

    assert.match(autoPlay, /let interruptedTrack: CarModeTrack \| null = null/);
    assert.match(autoPlay, /function interruptSpotifyTrack\(\): CarModeTrack \| null/);
    assert.match(autoPlay, /cancelCycle\(\);/);
    assert.match(autoPlay, /function getInterruptedSpotifyTrack\(\): CarModeTrack \| null/);
    assert.match(poller, /let externalRadioTrackPaused = false/);
    assert.match(poller, /let externalRadioSpotifyHandoffReady = false/);
    assert.match(poller, /export function setExternalRadioTrackPaused\(paused: boolean\)/);
    assert.match(poller, /export function setExternalRadioSpotifyHandoffReady\(ready: boolean\)/);
    assert.match(poller, /externalRadioTrackPaused[\s\S]*phase === 'track'/);
    assert.match(poller, /Preserve elapsed\/duration\/progress exactly as captured by/);
    assert.match(carPage, /let interruptedRadioTrack: CarModeTrack \| null = null/);
    assert.match(carPage, /autoPlay\.interruptSpotifyTrack\(\)/);
    assert.match(carPage, /setExternalRadioTrackPaused\(true\)/);
    assert.match(carPage, /await advancePrivateRadioTrack\(interruptedRadioTrack\)/);
    assert.match(carPage, /autoPlay\.clearInterruptedSpotifyTrack\(\)/);
    assert.match(carPage, /radioInterruptedResumePending/);
});

test('Auto Play after radio Pause reserves one wait popup before the async backend handoff and retries a closed popup safely', async () => {
    const [carPage, spotify, autoPlay, poller] = await Promise.all([
        readFile(carPagePath, 'utf8'),
        readFile(new URL('../src/lib/carmode/CarModeSpotify.ts', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/carmode/CarModeAutoPlay.ts', import.meta.url), 'utf8'),
        readFile(pollerPath, 'utf8')
    ]);

    const handler = carPage.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    assert.match(handler, /const reserved = spotify\.prepareAutoWindow\(\)/);
    assert.ok(handler.indexOf('const reserved = spotify.prepareAutoWindow()') < handler.indexOf('await advancePrivateRadioTrack(interruptedRadioTrack)'));
    assert.match(handler, /radioSpotifyRetryTrack/);
    assert.match(handler, /autoPlay\.handoffCurrentTrack\(retryTrack\)/);
    assert.match(spotify, /function prepareAutoWindow\(\): boolean/);
    assert.match(spotify, /if \(spotifyWindow && !spotifyWindow\.closed\) \{\s*return true;/);
    assert.match(spotify, /spotifyWindow\.location\.href = spotifyUrl/);
    assert.match(spotify, /Spotify window is unavailable\. Press Auto Play to try again/);
    assert.match(autoPlay, /Do not arm a duration\/completion cycle for a track whose/);
    assert.match(autoPlay, /dependencies\.onSpotifyHandoff\?\.\(track\)/);
    assert.match(autoPlay, /dependencies\.onSpotifyOpenFailed\?\.\(track\)/);
    assert.match(poller, /phase === 'track'[\s\S]*!externalRadioSpotifyHandoffReady/);
    assert.match(poller, /Do not run a visible clock or/);
    assert.match(carPage, /setExternalRadioSpotifyHandoffReady\(true\)/);
    assert.match(carPage, /setExternalRadioSpotifyHandoffReady\(false\)/);
});
