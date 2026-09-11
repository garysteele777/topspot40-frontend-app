// @ts-nocheck -- Node test modules are runtime-only project test dependencies.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {artistStoryIdentity, shouldPlayArtistStory} from '../src/lib/carmode/ArtistStories.ts';

const track = (overrides = {}) => ({
    artistName: 'Primary Artist', spotifyArtistId: 'artist-123', artistKey: 'artist-key', ...overrides
});

test('Artist stories defaults off and only plays an available bio when enabled', () => {
    const played = new Set();
    assert.equal(shouldPlayArtistStory(false, played, track(), true), false);
    assert.equal(shouldPlayArtistStory(true, played, track(), false), false);
    assert.equal(shouldPlayArtistStory(true, played, track(), true), true);
});

test('Artist stories prefer Spotify artist ID and play each primary artist once per session', () => {
    const first = track();
    const repeated = track({artistName: 'A differently displayed name'});
    const different = track({spotifyArtistId: 'artist-456'});
    const played = new Set([artistStoryIdentity(first)]);
    assert.equal(artistStoryIdentity(first), 'spotify:artist-123');
    assert.equal(shouldPlayArtistStory(true, played, repeated, true), false);
    assert.equal(shouldPlayArtistStory(true, played, different, true), true);
    assert.equal(shouldPlayArtistStory(true, played, repeated, true), false);
});

test('Artist stories fall back to existing artist key, then name, without storage persistence', () => {
    assert.equal(artistStoryIdentity(track({spotifyArtistId: null})), 'artist-key:artist-key');
    assert.equal(artistStoryIdentity(track({spotifyArtistId: null, artistKey: null})), 'artist-name:primary artist');
    const route = readFileSync(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    assert.doesNotMatch(route, /artistStories.*localStorage|localStorage.*artistStories/);
});

test('Turning Artist stories off and back on retains the session artist history', () => {
    const played = new Set([artistStoryIdentity(track())]);
    assert.equal(shouldPlayArtistStory(false, played, track(), true), false);
    assert.equal(shouldPlayArtistStory(true, played, track(), true), false);
});

test('Narration options summary is accessible, localized, and placed beneath the Car Mode badge', () => {
    const control = readFileSync(new URL('../src/lib/components/car/NarrationOptions.svelte', import.meta.url), 'utf8');
    const header = readFileSync(new URL('../src/lib/components/car/CarModeHeader.svelte', import.meta.url), 'utf8');
    const driveIn = readFileSync(new URL('../src/lib/components/car/DriveInPlayerPanel.svelte', import.meta.url), 'utf8');
    const mobile = readFileSync(new URL('../src/lib/components/car/CarModePlayerPanel.svelte', import.meta.url), 'utf8');
    for (const copy of ['Details', 'Short', 'Long', 'Artist bios', 'Off', 'On', 'Opciones de narración', 'Detalles', 'Breves', 'Largos', 'Biografías de artistas', 'Desactivadas', 'Activadas', 'Opções de narração', 'Detalhes', 'Curtos', 'Longos', 'Biografias dos artistas', 'Artist bios', 'Hear each available artist bio once during this program.', 'Biografías de artistas', 'Escucha una vez durante este programa cada biografía de artista disponible.', 'Biografias dos artistas', 'Ouça uma vez durante este programa cada biografia de artista disponível.']) assert.match(control, new RegExp(copy));
    assert.match(control, /aria-expanded=\{open\}/);
    assert.match(control, /aria-controls="narration-options-panel"/);
    assert.match(control, /aria-label=\{`\$\{text\.title\}: \$\{summary\}`\}/);
    assert.match(control, /\$: summary = `\$\{text\.detailsLabel\}: \$\{detailValue\} • \$\{text\.biosLabel\}: \$\{biosValue\}`/);
    assert.match(control, /role="dialog"/);
    assert.match(control, /event\.key === 'Escape'/);
    assert.match(control, /trigger\?\.focus\(\)/);
    assert.match(header, /cm-row--title[\s\S]*<NarrationOptions/);
    assert.doesNotMatch(driveIn, /artist-stories-slot|ArtistStoriesSwitch/);
    assert.doesNotMatch(mobile, /artist-stories-mobile|ArtistStoriesSwitch/);
    assert.doesNotMatch(control, /Artist stories|Historias de artistas|Histórias dos artistas/);
});

test('Narration summary represents each Short/Long and Artist bios Off/On combination', () => {
    const control = readFileSync(new URL('../src/lib/components/car/NarrationOptions.svelte', import.meta.url), 'utf8');
    assert.match(control, /detailLength === 'short' \? text\.shortDetails : text\.longDetails/);
    assert.match(control, /artistStoriesEnabled \? text\.storiesOn : text\.storiesOff/);
    for (const summary of [
        ['Details: Short', 'Artist bios: Off'],
        ['Details: Short', 'Artist bios: On'],
        ['Details: Long', 'Artist bios: Off'],
        ['Details: Long', 'Artist bios: On'],
        ['Detalles: Breves', 'Biografías de artistas: Desactivadas'],
        ['Detalles: Breves', 'Biografías de artistas: Activadas'],
        ['Detalles: Largos', 'Biografías de artistas: Desactivadas'],
        ['Detalles: Largos', 'Biografías de artistas: Activadas'],
        ['Detalhes: Curtos', 'Biografias dos artistas: Desativadas'],
        ['Detalhes: Curtos', 'Biografias dos artistas: Ativadas'],
        ['Detalhes: Longos', 'Biografias dos artistas: Desativadas'],
        ['Detalhes: Longos', 'Biografias dos artistas: Ativadas']
    ]) {
        const [detailsLabel, detailValue] = summary[0].split(': ');
        const [biosLabel, biosValue] = summary[1].split(': ');
        assert.match(control, new RegExp(`${detailsLabel}|${detailValue}|${biosLabel}|${biosValue}`));
    }
});

test('Narration summary trigger uses the compact charcoal, gold, hover, pressed, and focus treatment', () => {
    const control = readFileSync(new URL('../src/lib/components/car/NarrationOptions.svelte', import.meta.url), 'utf8');
    assert.match(control, /border:1px solid rgba\(207,184,124,\.52\)/);
    assert.match(control, /background:#22272d/);
    assert.match(control, /box-shadow:0 2px 7px rgba\(0,0,0,\.34\)/);
    assert.match(control, /\.summary:hover \{ border-color:#cfb87c; background:#2c333b; \}/);
    assert.match(control, /\.summary:active \{ box-shadow:0 1px 3px rgba\(0,0,0,\.4\); transform:translateY\(1px\); \}/);
    assert.match(control, /\.summary:focus-visible, \.panel button:focus-visible \{ outline:3px solid #fff/);
    assert.match(control, /class="summary-pair"/);
    assert.match(control, /\.summary-pair \{ display:inline-flex; align-items:baseline; gap:\.25em; white-space:nowrap; \}/);
    assert.match(control, /\.summary-label \{ color:#f1f1f1; \}/);
    assert.match(control, /\.summary-value \{ color:#f4d58a; font-weight:800; \}/);
});

test('Narration options changes the shared detail preference and leaves current narration uninterrupted', () => {
    const route = readFileSync(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const control = readFileSync(new URL('../src/lib/components/car/NarrationOptions.svelte', import.meta.url), 'utf8');
    assert.match(route, /onDetailLengthChange=\{\(detailLength\) => playbackSettingsStore\.update/);
    assert.match(route, /resolveSequenceNarrationUrls\([\s\S]*settings\.detailLength/);
    assert.match(control, /onDetailLengthChange\('short'\)/);
    assert.match(control, /onDetailLengthChange\('long'\)/);
    assert.doesNotMatch(control, /stopNarration|startGuidedTrack|openSpotify/);
});

test('Guided narration inserts Artist Bio at the existing narration boundary and removes Spotify bio buttons', () => {
    const route = readFileSync(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
    const narration = readFileSync(new URL('../src/lib/carmode/CarModeNarration.ts', import.meta.url), 'utf8');
    const panel = readFileSync(new URL('../src/lib/components/car/GuidedPlaybackPanel.svelte', import.meta.url), 'utf8');
    assert.match(route, /shouldPlayArtistStory\([\s\S]*result\.push\(\{phase: 'artist'/);
    assert.match(narration, /onNarrationStart\?\.\(narration\.phase, track\)/);
    assert.match(route, /phase === 'artist'[\s\S]*artistStoriesPlayed = new Set/);
    assert.doesNotMatch(panel, /PLAY .* BIO|artist-bio-button|onPlayArtistBio/);
    assert.match(route, /artistStoriesEnabled = false[\s\S]*artistStoriesPlayed = new Set/);
    assert.doesNotMatch(readFileSync(new URL('../src/lib/carmode/CarModeAutoPlay.ts', import.meta.url), 'utf8'), /ArtistStories|artistStories/);
});
