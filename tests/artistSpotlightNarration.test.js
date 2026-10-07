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
