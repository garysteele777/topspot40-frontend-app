// @ts-nocheck -- Node test runner with Vite compiling the Svelte component.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('Spotlight exposes Short/Long bio controls with Short selected by default', async () => {
    const server = await createServer({server: {middlewareMode: true}, appType: 'custom'});
    try {
        const {default: Header} = await server.ssrLoadModule('/src/lib/components/car/CarModeHeader.svelte');
        const {render} = await server.ssrLoadModule('svelte/server');
        const props = {mode: 'artist_spotlight', programType: 'PROGRAM_ARTIST', language: 'en', onDetailLengthChange() {}, onArtistStoriesChange() {}, onNameThatTuneChange() {}};
        const initial = render(Header, {props}).body;
        assert.match(initial, /Artist bio:/);
        assert.match(initial, /aria-pressed="true"[^>]*>Short<\/button>/);
        assert.match(initial, /aria-pressed="false"[^>]*>Long<\/button>/);
        assert.match(initial, /Name That Tune:/);
        assert.doesNotMatch(initial, /Narration options/);
        const changed = render(Header, {props: {...props, detailLength: 'off', artistBioLength: 'long'}}).body;
        assert.match(changed, /aria-pressed="true"[^>]*>Long<\/button>/);
        assert.match(changed, /aria-pressed="true"[^>]*>Off<\/button>/);
        const spanish = render(Header, {props: {...props, language: 'es'}}).body;
        assert.match(spanish, /Biografía del artista:/);
        assert.match(spanish, /Breve/);
    } finally {
        await server.close();
    }
});

test('browser playback starts with the Spotlight bio, including when details are off', async () => {
    const server = await createServer({server: {middlewareMode: true}, appType: 'custom'});
    try {
        const {withSpotlightBio, spotlightStoryUrl} = await server.ssrLoadModule('/src/lib/carmode/spotlightNarration.ts');
        const {createCarModeNarration} = await server.ssrLoadModule('/src/lib/carmode/CarModeNarration.ts');
        let track = {rank: 1, spotifyTrackId: 'song'};
        let playedBio = false;
        let details = [{phase: 'detail', url: 'short-detail.mp3'}];
        let bioUrl = 'short-bio.mp3';
        const played = [];
        let phase = 'idle';
        const noop = () => {};
        const narration = createCarModeNarration({
            getCurrentTrack: () => track,
            getNarrations: () => withSpotlightBio(details, bioUrl, playedBio),
            getBedUrl: () => 'bed.mp3', unlockBed: async () => {}, startBed: async () => {},
            stopBed: noop, resetBed: noop, stopNarration: noop,
            playNarration: async url => { played.push(url); },
            updateTiming: noop, resetTiming: noop,
            getPlaybackPhase: () => phase, setPlaybackPhase: value => { phase = value; },
            setIsPlaying: noop, resetGuidedReadyState: noop, setGuidedReady: noop,
            onNarrationStart: value => { if (value === 'artist') playedBio = true; }
        });
        assert.equal(await narration.start(track), true);
        assert.deepEqual(played, ['short-bio.mp3', 'short-detail.mp3']);
        played.length = 0;
        track = {rank: 2, spotifyTrackId: 'next-song'};
        details = [{phase: 'detail', url: 'next-short-detail.mp3'}];
        await narration.start(track);
        assert.deepEqual(played, ['next-short-detail.mp3']);
        played.length = 0;
        bioUrl = 'long-bio.mp3';
        await narration.start(track);
        assert.deepEqual(played, ['next-short-detail.mp3']);
        played.length = 0;
        playedBio = false; // A fresh program allows the selected bio once.
        details = [];
        bioUrl = spotlightStoryUrl({has_story: true, tts_bucket: 'audio-es', tts_key: 'audio-es/artist-story/long bio.mp3'});
        await narration.start(track);
        assert.deepEqual(played, ['https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public/audio-es/artist-story/long%20bio.mp3']);
        assert.equal(spotlightStoryUrl({has_story: false}), null);
        assert.deepEqual(withSpotlightBio([], null, false), []);
    } finally {
        await server.close();
    }
});
