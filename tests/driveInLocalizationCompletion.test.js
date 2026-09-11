// @ts-nocheck -- focused source and resolver coverage for Drive-In localization.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {getCarModePlaybackPhaseCopy} = await import(
    '../src/lib/carmode/playbackPhaseCopy.ts'
);

const read = relative => readFile(new URL(relative, import.meta.url), 'utf8');
const [driveIn, jukebox, narration, waitPage, spotify, classicPanel] = await Promise.all([
    read('../src/lib/components/car/DriveInPlayerPanel.svelte'),
    read('../src/lib/components/car/DriveInJukeboxPanel.svelte'),
    read('../src/lib/components/car/CarModeNarrationModal.svelte'),
    read('../src/routes/spotify-wait/+page.svelte'),
    read('../src/lib/carmode/CarModeSpotify.ts'),
    read('../src/lib/components/car/CarModePlayerPanel.svelte')
]);

const phaseCopy = {
    en: ['Track Intro', 'More About the Song', 'Artist Bio', 'Collection Introduction', 'Program Introduction', 'TopSpot40'],
    es: ['Introducción de la canción', 'Más sobre la canción', 'Biografía del artista', 'Introducción de la colección', 'Introducción del programa', 'TopSpot40'],
    ptbr: ['Introdução da música', 'Mais sobre a música', 'Biografia do artista', 'Introdução da coleção', 'Introdução do programa', 'TopSpot40']
};

test('Drive-In phase badge is localized for EN, ES, and PT-BR and reuses approved Car Mode fallback copy', () => {
    assert.match(driveIn, /getCarModePlaybackPhaseCopy\(phase, language\)\.meta/);
    for (const labels of Object.values(phaseCopy)) {
        for (const label of labels) assert.match(driveIn, new RegExp(`'${label}'`));
    }
    assert.equal(getCarModePlaybackPhaseCopy('track', 'es').meta, 'Reproduciendo ahora');
    assert.equal(getCarModePlaybackPhaseCopy('track', 'pt-BR').meta, 'Tocando agora');
});

test('jukebox localizes visible and accessible copy while retaining dynamic track and artist names', () => {
    assert.match(jukebox, /export let language: Language = 'en';/);
    assert.match(jukebox, /aria-label=\{copy\.dialogLabel\}/);
    assert.match(jukebox, /aria-label=\{copy\.close\}/);
    assert.match(jukebox, /\{copy\.exportHint\}/);
    assert.match(jukebox, /\{copy\.page\(pageIndex \+ 1, pageCount\)\}/);
    assert.match(jukebox, /aria-label=\{copy\.selectTrackAria\(track\.rank, track\.trackName, track\.artistName\)\}/);
    assert.match(jukebox, /aria-label=\{copy\.favorite\(track\.trackName\)\}/);
    assert.match(jukebox, /title=\{copy\.alreadyPlayed\}/);
    assert.match(jukebox, /<p class="empty-tracks">\{copy\.empty\}<\/p>/);
    assert.match(jukebox, /downloadCsv\(createTrackListCsv\(sortedTracks\), exportFileName\)/);
    for (const label of ['Elige una canción para reproducir', 'Exportar CSV', 'Reproducir n.º', 'Tocar nº']) {
        assert.match(jukebox, new RegExp(label));
    }
});

test('shared narration modal localizes tabs and fallbacks without changing its report or focus behavior', () => {
    for (const label of ['Introducción', 'Detalles', 'Fechar narração', 'No hay narración disponible para esta canción.', 'Não há narração disponível para esta faixa.']) {
        assert.match(narration, new RegExp(label));
    }
    assert.match(narration, /aria-label=\{copy\.close\}/);
    assert.match(narration, /alt=\{track\?\.artistName \?\? copy\.artistFallback\}/);
    assert.match(narration, /Informar un problema con esta información/);
    assert.match(narration, /Informar um problema com estas informações/);
    assert.match(narration, /event\.key === 'Escape'/);
    assert.match(narration, /trapFocus\(event\)/);
    assert.match(classicPanel, /CarModeNarrationModal/);
});

test('Auto Play popup localizes EN, ES, and PT-BR without changing launch, popup, or waiting wiring', () => {
    for (const label of ['AUTO PLAY', 'REPRODUCCIÓN AUTOMÁTICA', 'REPRODUÇÃO AUTOMÁTICA', 'Spotify comenzará después de la introducción.', 'O Spotify começará após a introdução.']) {
        assert.match(waitPage, new RegExp(label));
    }
    assert.match(waitPage, /requestedLanguage === 'ptbr' \|\| requestedLanguage === 'pt-BR'/);
    assert.match(spotify, /function waitingPageUrl\(\)/);
    assert.match(spotify, /popup=yes,width=\$\{width\},height=\$\{height\}/);
    assert.match(spotify, /'topspot40-guided-spotify'/);
    assert.match(spotify, /setTimeout\(\(\) => \{/);
    assert.match(spotify, /spotifyWindow\.location\.href = spotifyUrl/);
    assert.match(spotify, /spotifyWindow\.location\.href = `\$\{window\.location\.origin\}\$\{waitingPageUrl\(\)\}`/);
});
