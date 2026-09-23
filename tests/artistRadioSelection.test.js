// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';
import {createServer} from 'vite';
register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const artistGenres = await import('../src/lib/journey/artistRadioGenres.ts');
const {buildSelectionFromUrl} = await import('../src/lib/helpers/car/selectionFromUrl.ts');
const {normalizePlaybackContext} = await import('../src/lib/utils/normalizePlaybackContext.ts');
const {buildFallbackPlaybackTrack} = await import('../src/lib/utils/buildPlaybackTrack.ts');

test('Artist Radio has exactly the seven supported stable genre slugs', () => {
    assert.deepEqual(artistGenres.ARTIST_RADIO_GENRES, ['country', 'pop', 'rock', 'rnb_soul', 'latin_global', 'blues_jazz', 'folk_acoustic']);
    assert.equal(artistGenres.ARTIST_RADIO_GENRES.includes('tv_themes'), false);
    assert.deepEqual(artistGenres.normalizeArtistRadioGenres(['rock', 'country', 'rock', 'tv_themes']), ['country', 'rock']);
});

test('Artist Radio URL retains genres and normalized narration choices for Car Mode', () => {
    const selection = buildSelectionFromUrl(new URL('https://topspot.test/car-page?mode=artist_radio&genres=rock&genres=country&artistDetailLength=long&artistBioLength=long'));
    assert.equal(selection.programType, 'RADIO_ARTIST');
    assert.equal(selection.context.artistRadioGenres, 'country,rock');
    assert.equal(selection.context.artistDetailLength, 'long');
    assert.equal(selection.context.artistBioLength, 'long');
});

test('Artist Radio selector exposes the seven-card multi-select without narration controls', async () => {
    const source = await readFile(new URL('../src/lib/components/options-v2/ArtistRadioSelection.svelte', import.meta.url), 'utf8');
    assert.match(source, /ARTIST_RADIO_GENRES/);
    assert.match(source, /08-ai-genre-road\.png/);
    assert.match(source, /hotspot-layer/);
    assert.match(source, /genre-button genre-\{genre\}/);
    assert.match(source, /checkmark/);
    assert.match(source, /Select All Genres/);
    assert.match(source, /Clear All Genres/);
    assert.match(source, /\{count\} \/ \{ARTIST_RADIO_GENRES\.length\} \{text\.selected\}/);
    assert.match(source, /export let language: Language \| 'pt-BR' = 'en'/);
    assert.match(source, /Selecciona todos los géneros/);
    assert.match(source, /Selecione todos os gêneros/);
    assert.match(source, /disabled=\{count === 0\}/);
    assert.doesNotMatch(source, /Track Details/);
    assert.doesNotMatch(source, /Artist Bios/);
    assert.doesNotMatch(source, /tracks-per-artist/i);
});

test('Car Mode carries Artist Radio configuration and uses backend radio completion', async () => {
    const [page, header] = await Promise.all([
        readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/components/car/CarModeHeader.svelte', import.meta.url), 'utf8')
    ]);
    assert.match(page, /artistDetailLength/);
    assert.match(page, /artistBioLength/);
    assert.match(page, /RADIO_ARTIST/);
    assert.match(page, /signalTrackFinishedApi/);
    assert.doesNotMatch(header, /cm-radio-config/);
    assert.match(header, /<span>Details:<\/span>/);
    assert.match(header, /<span>Artist bios:<\/span>/);
    assert.match(header, /onDetailLengthChange/);
    assert.match(header, /onArtistBioLengthChange/);
});

test('Artist Radio does not publish track introductions before its optional details', async () => {
    const sequence = await readFile(new URL('../../topspot-backend-api/backend/services/artist_radio_sequence.py', import.meta.url), 'utf8');
    assert.doesNotMatch(sequence, /_narrate\(user,'intro'/);
    assert.match(sequence, /if detail_length!='off':\s*[\s\S]*?_narrate\(user,'detail'/);
    assert.match(sequence, /_narrate\(user,'detail'[\s\S]*?update_phase\(user,'track'/);
});

test('Artist Radio metadata renders the active catalog artist, genre, and artist-set track position', async () => {
    const source = await readFile(new URL('../src/lib/components/car/CarModeTrackMeta.svelte', import.meta.url), 'utf8');
    assert.match(source, /artistRadioSetLineReady/);
    assert.match(source, /Set \{currentTrack\?\.setNumber\}: Genre \{artistRadioGenre\} &bull; Artist \{displayArtistName\}/);
    assert.match(source, /Track \{currentTrack\?\.blockPosition \?\? '\?'\} of \{currentTrack\?\.blockSize \?\? '\?'\}/);
    assert.match(source, /displayTrackTitle = isArtistRadio \? currentTrack\?\.trackName/);
    assert.match(source, /displayArtistName = isArtistRadio \? currentTrack\?\.artistName/);
    assert.match(source, /ARTIST_RADIO_GENRE_LABELS/);
});

test('CarModeTrackMeta renders a complete Artist Radio set line between title and track without a duplicate artist', async (t) => {
    const server = await createServer({
        logLevel: 'error',
        server: {middlewareMode: true}
    });
    t.after(async () => server.close());

    const {currentSelection} = await server.ssrLoadModule('/src/lib/carmode/CarMode.store.ts');
    const {default: CarModeTrackMeta} = await server.ssrLoadModule('/src/lib/components/car/CarModeTrackMeta.svelte');
    const {render} = await server.ssrLoadModule('svelte/server');
    currentSelection.set({programType: 'RADIO_ARTIST', mode: 'artist_spotlight', context: {}});

    const complete = render(CarModeTrackMeta, {
        props: {
            currentTrack: {
                trackName: 'Forever and Ever, Amen', artistName: 'Randy Travis',
                setNumber: 1, genreName: 'Country', blockPosition: 1, blockSize: 3
            },
            phase: 'artist'
        }
    }).body;
    const titleAt = complete.indexOf('Forever and Ever, Amen');
    const setAt = complete.indexOf('Set 1: Genre Country • Artist Randy Travis');
    const trackAt = complete.indexOf('Track 1 of 3');
    assert.ok(titleAt >= 0 && titleAt < setAt && setAt < trackAt);
    assert.equal(complete.split('Randy Travis').length - 1, 1);

    const fallback = render(CarModeTrackMeta, {
        props: {
            currentTrack: {
                trackName: 'Forever and Ever, Amen', artistName: 'Randy Travis',
                blockPosition: 1, blockSize: 3
            },
            phase: 'artist'
        }
    }).body;
    assert.doesNotMatch(fallback, /Set \?/);
    assert.equal(fallback.split('Randy Travis').length - 1, 1);
});

test('serialized Artist Radio status keeps the set line through bio, detail, and Spotify-track phases', () => {
    // This is the public `/playback/status` shape: root catalog labels plus
    // snake_case Artist Radio metadata inside `context`.
    const status = (phase, setNumber, artistName, spotifyTrackId) => ({
        isPlaying: true, isPaused: false, stopped: false, phase,
        playbackSessionId: 'artist-radio-session',
        track_name: 'Forever and Ever, Amen', artist_name: artistName,
        current_rank: 1, setNumber, blockPosition: 1, blockSize: 3,
        genreSlug: 'country', genreName: 'Country', elapsedMs: 0, durationMs: 180000,
        context: {
            type: 'artist_radio', mode: 'artist_radio', programType: 'RADIO_ARTIST',
            genre_slug: 'country', genre_name: 'Country', artist_name: artistName,
            set_number: setNumber, block_position: 1, block_size: 3,
            spotify_track_id: spotifyTrackId
        }
    });
    const frames = [
        status('artist', 1, 'Randy Travis', 'spotify-randy-1'),
        status('detail', 1, 'Randy Travis', 'spotify-randy-1'),
        status('track', 1, 'Randy Travis', 'spotify-randy-1'),
        status('artist', 2, 'Alan Jackson', 'spotify-alan-1')
    ];
    const rendered = frames.map(frame => buildFallbackPlaybackTrack({
        spotifyId: frame.context.spotify_track_id,
        currentRank: frame.current_rank,
        trackName: frame.track_name,
        artistName: frame.artist_name,
        statusDurationMs: frame.durationMs,
        normalizedCtx: normalizePlaybackContext(frame.context)
    }));

    assert.deepEqual(
        rendered.slice(0, 3).map(track => [track.setNumber, track.genreName, track.artistName, track.blockPosition, track.blockSize]),
        [[1, 'Country', 'Randy Travis', 1, 3], [1, 'Country', 'Randy Travis', 1, 3], [1, 'Country', 'Randy Travis', 1, 3]]
    );
    assert.deepEqual([rendered[3].setNumber, rendered[3].genreName, rendered[3].artistName], [2, 'Country', 'Alan Jackson']);
    assert.equal(frames.filter(frame => frame.phase === 'artist' && frame.context.set_number === 1).length, 1);
    assert.equal(frames.filter(frame => frame.phase === 'artist' && frame.context.set_number === 2).length, 1);
});

test('Artist Radio starts from a neutral placeholder, polls before launch, and waits for its artist biography', async () => {
    const [loader, page, poller] = await Promise.all([
        readFile(new URL('../src/lib/carmode/CarMode.loader.ts', import.meta.url), 'utf8'),
        readFile(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/carmode/CarMode.poller.ts', import.meta.url), 'utf8')
    ]);
    const artistStartup = page.match(/async function startInitialArtistRadioSet\(\): Promise<boolean> \{([\s\S]*?)\n    \}/)?.[1] ?? '';
    const autoPlay = page.match(/async function handleAutoPlay\(\) \{([\s\S]*?)\n    \}/)?.[1] ?? '';

    assert.match(loader, /trackName: 'Artist Radio'[\s\S]*artistName: 'Press Auto Play to Start'/);
    assert.match(autoPlay, /isArtistRadioSelection\(\)[\s\S]*reserveBackendRadioSpotifyWindow\(\)[\s\S]*startPlaybackPolling\([\s\S]*await startInitialArtistRadioSet\(\)/);
    assert.ok(autoPlay.indexOf('startPlaybackPolling(') < autoPlay.indexOf('await startInitialArtistRadioSet()'));
    assert.match(artistStartup, /artist-spotlight\/play-radio/);
    assert.match(artistStartup, /detail_length: detailLength[\s\S]*bio_length: bioLength/);
    assert.match(poller, /Artist Radio narration decision[\s\S]*accepted: true[\s\S]*duplicateFrame: false/);
});
