// @ts-nocheck -- verifies Svelte component source with Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const miniPlayer = await readFile(
    new URL('../src/lib/components/MiniPlayer.svelte', import.meta.url),
    'utf8'
);

const carModePlayerPanel = await readFile(
    new URL('../src/lib/components/car/CarModePlayerPanel.svelte', import.meta.url),
    'utf8'
);

const carModeNarration = await readFile(
    new URL('../src/lib/components/car/CarModeNarration.svelte', import.meta.url),
    'utf8'
);

const expectedCopy = {
    en: {
        previous: 'Previous', previousAria: 'Play previous track',
        guided: 'Guided', guidedAria: 'Start Guided Playback',
        pause: 'Pause', pauseAria: 'Pause Guided Playback',
        next: 'Next', nextAria: 'Play next track'
    },
    es: {
        previous: 'Anterior', previousAria: 'Reproducir la canción anterior',
        guided: 'Guiada', guidedAria: 'Iniciar reproducción guiada',
        pause: 'Pausa', pauseAria: 'Pausar reproducción guiada',
        next: 'Siguiente', nextAria: 'Reproducir la siguiente canción'
    },
    ptbr: {
        previous: 'Anterior', previousAria: 'Tocar a faixa anterior',
        guided: 'Guiada', guidedAria: 'Iniciar reprodução guiada',
        pause: 'Pausar', pauseAria: 'Pausar reprodução guiada',
        next: 'Próxima', nextAria: 'Tocar a próxima faixa'
    }
};

test('classic Car Mode transport copy is localized for EN, ES, and PT-BR', () => {
    assert.match(miniPlayer, /import type \{Language\} from '\$lib\/stores\/selection';/);
    assert.match(miniPlayer, /const controlCopy: Record<Language, ControlCopy>/);
    assert.match(miniPlayer, /export let language: Language = 'en';/);

    for (const [locale, labels] of Object.entries(expectedCopy)) {
        const localeBlock = miniPlayer.match(new RegExp(`${locale}: \\{([\\s\\S]*?)\\n        \\}`, 'm'))?.[1] ?? '';
        for (const [key, value] of Object.entries(labels)) {
            assert.match(localeBlock, new RegExp(`${key}: '${value}'`));
        }
    }

    assert.match(carModePlayerPanel, /language=\{\$currentSelection\?\.language \?\? 'en'\}/);
});

test('center transport label and aria label transition from Guided to Pause only during Guided Playback', () => {
    assert.match(
        miniPlayer,
        /aria-label=\{isPlaying && activePlayMode === 'guided'\s*\? controlCopy\[language\]\.pauseAria\s*:\s*controlCopy\[language\]\.guidedAria\}/
    );
    assert.match(
        miniPlayer,
        /\{isPlaying && activePlayMode === 'guided'\s*\? controlCopy\[language\]\.pause\s*:\s*controlCopy\[language\]\.guided\}/
    );
});

test('transport handlers and diagnostic behavior remain wired as before', () => {
    assert.match(miniPlayer, /on:click=\{onPrev\}/);
    assert.match(miniPlayer, /on:click=\{handlePlayClick\}/);
    assert.match(miniPlayer, /on:click=\{onNext\}/);
    assert.match(miniPlayer, /event: 'MiniPlayer play button tapped'/);
    assert.match(miniPlayer, /onPlayPause\(\);/);
    assert.doesNotMatch(miniPlayer, /disabled=/);
});

test('classic Car Mode progress and supporting actions are localized for EN, ES, and PT-BR', () => {
    const expectedProgress = {
        en: {completed: 'Completed', of: 'of', remaining: 'Remaining'},
        es: {completed: 'Completadas', of: 'de', remaining: 'Restantes'},
        ptbr: {completed: 'Concluídas', of: 'de', remaining: 'Restantes'}
    };
    const expectedActions = {
        en: {moreInfo: 'More Info', trackList: 'Track List', changeMusic: 'Change Music'},
        es: {moreInfo: 'Más información', trackList: 'Lista de canciones', changeMusic: 'Cambiar música'},
        ptbr: {moreInfo: 'Mais informações', trackList: 'Lista de faixas', changeMusic: 'Mudar música'}
    };

    assert.match(carModePlayerPanel, /const progressCopy: Record<Language, ProgressCopy>/);
    assert.match(carModePlayerPanel, /localizedProgressCopy = progressCopy\[\$currentSelection\?\.language \?\? 'en'\]/);
    assert.match(carModePlayerPanel, /\{localizedProgressCopy\.completed\} \{completed\} \{localizedProgressCopy\.of\} \{programTotal\} \(\{Math\.round\(percent\)\}%\)/);
    assert.match(carModePlayerPanel, /\{localizedProgressCopy\.remaining\} \{remaining\}/);
    assert.match(carModePlayerPanel, /<CarModeNarration[\s\S]*?language=\{\$currentSelection\?\.language \?\? 'en'\}/);
    assert.match(carModeNarration, /export let language: Language = 'en';/);
    assert.match(carModeNarration, /const actionCopy: Record<Language, NarrationActionCopy>/);

    for (const [locale, labels] of Object.entries(expectedProgress)) {
        const localeBlock = carModePlayerPanel.match(new RegExp(`${locale}: \\{([\\s\\S]*?)\\n        \\}`, 'm'))?.[1] ?? '';
        for (const [key, value] of Object.entries(labels)) {
            assert.match(localeBlock, new RegExp(`${key}: '${value}'`));
        }
    }

    for (const [locale, labels] of Object.entries(expectedActions)) {
        const localeBlock = carModeNarration.match(new RegExp(`${locale}: \\{([\\s\\S]*?)\\n        \\}`, 'm'))?.[1] ?? '';
        for (const [key, value] of Object.entries(labels)) {
            assert.match(localeBlock, new RegExp(`${key}: '${value}'`));
        }
    }
});

test('classic Car Mode action handlers remain unchanged', () => {
    assert.match(carModeNarration, /class="more-btn" on:click=\{onOpenModal\}/);
    assert.match(carModeNarration, /class="track-list-btn" on:click=\{onOpenTrackList\}/);
    assert.match(carModeNarration, /class="back-btn" on:click=\{onBackToOptions\}/);
});
