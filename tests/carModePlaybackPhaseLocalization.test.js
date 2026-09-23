// @ts-nocheck -- exercises the small Car Mode phase-copy resolver directly.
import test from 'node:test';
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFile} from 'node:fs/promises';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);

const {getCarModePlaybackPhaseCopy} = await import(
    '../src/lib/carmode/playbackPhaseCopy.ts'
);

const expected = {
    en: {
        loading: ['', 'Getting music ready…'],
        prelude: ['Program introduction', 'Program introduction'],
        set_intro: ['Program introduction', 'Program introduction'],
        collection_intro: ['Collection introduction', 'Collection introduction'],
        liner: ['TopSpot40 message', 'TopSpot40 message'],
        intro: ['Song introduction', 'Song introduction'],
        detail: ['About this song', 'About this song'],
        artist: ['About the artist', 'About the artist'],
        track: ['', 'Now playing'],
        paused: ['Paused', 'Paused'],
        ended: ['', 'This program has ended'],
        music: ['', 'Now playing']
    },
    es: {
        loading: ['', 'Preparando la música…'],
        prelude: ['Introducción al programa', 'Introducción al programa'],
        set_intro: ['Introducción del programa', 'Introducción del programa'],
        collection_intro: ['Introducción de la colección', 'Introducción de la colección'],
        liner: ['Mensaje de TopSpot40', 'Mensaje de TopSpot40'],
        intro: ['Introducción de la canción', 'Introducción de la canción'],
        detail: ['Sobre esta canción', 'Sobre esta canción'],
        artist: ['Sobre el artista', 'Sobre el artista'],
        track: ['', 'Reproduciendo ahora'],
        paused: ['En pausa', 'En pausa'],
        ended: ['', 'Este programa ha terminado'],
        music: ['', 'Reproduciendo ahora']
    },
    ptbr: {
        loading: ['', 'Preparando a música…'],
        prelude: ['Introdução do programa', 'Introdução do programa'],
        set_intro: ['Introdução do programa', 'Introdução do programa'],
        collection_intro: ['Introdução da coleção', 'Introdução da coleção'],
        liner: ['Mensagem do TopSpot40', 'Mensagem do TopSpot40'],
        intro: ['Introdução da música', 'Introdução da música'],
        detail: ['Sobre esta música', 'Sobre esta música'],
        artist: ['Sobre o artista', 'Sobre o artista'],
        track: ['', 'Tocando agora'],
        paused: ['Pausado', 'Pausado'],
        ended: ['', 'Este programa terminou'],
        music: ['', 'Tocando agora']
    }
};

for (const [language, phases] of Object.entries(expected)) {
    test(`Car Mode playback phases have approved ${language} copy`, () => {
        for (const [phase, [, meta]] of Object.entries(phases)) {
            assert.deepEqual(
                getCarModePlaybackPhaseCopy(phase, language),
                {meta},
                phase
            );
        }
    });
}

test('non-listener playback phases and unknown values return blank copy', () => {
    for (const phase of ['idle', 'done', 'stopped', 'new_backend_phase', null]) {
        assert.deepEqual(
            getCarModePlaybackPhaseCopy(phase, 'en'),
            {meta: ''},
            String(phase)
        );
    }
});

test('classic Car View has no ticker and keeps localized stationary phase labels', async () => {
    const [panel, meta] = await Promise.all([
        readFile(new URL('../src/lib/components/car/CarModePlayerPanel.svelte', import.meta.url), 'utf8'),
        readFile(new URL('../src/lib/components/car/CarModeTrackMeta.svelte', import.meta.url), 'utf8')
    ]);

    assert.doesNotMatch(panel, /CarModeTicker|favoriteTickerText|ticker/i);
    assert.match(meta, /getCarModePlaybackPhaseCopy\(phase, language\)\.meta/);
    assert.doesNotMatch(meta, /\{phase\}|phaseLabel\s*=\s*phase/);
    await assert.rejects(
        readFile(new URL('../src/lib/components/car/CarModeTicker.svelte', import.meta.url), 'utf8'),
        {code: 'ENOENT'}
    );
});

test('classic Car View favorite wiring remains intact after ticker removal', async () => {
    const panel = await readFile(
        new URL('../src/lib/components/car/CarModePlayerPanel.svelte', import.meta.url),
        'utf8'
    );

    assert.match(panel, /\$:\s*favoriteRefresh\s*=\s*\$favoritesStore/);
    assert.match(panel, /isFav\s*=\s*!!\(/);
    assert.match(panel, /toggleFavorite\(/);
    assert.match(panel, /class:active=\{isFav\}/);
    assert.match(panel, /aria-label=\{isFav \? 'Remove from favorites' : 'Add to favorites'\}/);
});
