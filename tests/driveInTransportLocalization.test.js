// @ts-nocheck -- verifies the focused Drive-In transport localization contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const driveInPanel = await readFile(
    new URL('../src/lib/components/car/DriveInPlayerPanel.svelte', import.meta.url),
    'utf8'
);

const expectedCopy = {
    en: {
        previous: 'Previous', previousAria: 'Previous track',
        guided: 'Guided Play', guidedAria: 'Start Guided Playback',
        guidedPauseAria: 'Pause Guided Playback',
        auto: 'Auto Play', autoAria: 'Start Auto Play', autoPauseAria: 'Pause Auto Play',
        pause: 'Pause', next: 'Next', nextAria: 'Next track'
    },
    es: {
        previous: 'Anterior', previousAria: 'Pista anterior',
        guided: 'Guiada', guidedAria: 'Iniciar reproducción guiada',
        guidedPauseAria: 'Pausar reproducción guiada',
        auto: 'Automática', autoAria: 'Iniciar reproducción automática', autoPauseAria: 'Pausar reproducción automática',
        pause: 'Pausa', next: 'Siguiente', nextAria: 'Pista siguiente'
    },
    ptbr: {
        previous: 'Anterior', previousAria: 'Faixa anterior',
        guided: 'Guiada', guidedAria: 'Iniciar reprodução guiada',
        guidedPauseAria: 'Pausar reprodução guiada',
        auto: 'Automática', autoAria: 'Iniciar reprodução automática', autoPauseAria: 'Pausar reprodução automática',
        pause: 'Pausar', next: 'Próxima', nextAria: 'Próxima faixa'
    }
};

test('Drive-In transport visible and accessibility copy is localized for EN, ES, and PT-BR', () => {
    assert.match(driveInPanel, /export let language: Language = 'en';/);
    assert.match(driveInPanel, /const driveInTransportCopy: Record<Language, DriveInTransportCopy>/);
    assert.match(driveInPanel, /transportCopy = driveInTransportCopy\[language\]/);

    for (const [locale, labels] of Object.entries(expectedCopy)) {
        const localeBlock = driveInPanel.match(
            new RegExp(`${locale}: \\{([\\s\\S]*?)\\n        \\}`, 'm')
        )?.[1] ?? '';

        for (const [key, value] of Object.entries(labels)) {
            assert.match(localeBlock, new RegExp(`${key}: '${value}'`));
        }
    }
});

test('Drive-In Guided Play switches visible and aria labels to Pause only during Guided Playback', () => {
    assert.match(
        driveInPanel,
        /aria-label=\{\s*isPlaying && activePlayMode === 'guided'\s*\? transportCopy\.guidedPauseAria\s*:\s*transportCopy\.guidedAria\s*\}/
    );
    assert.match(
        driveInPanel,
        /\{isPlaying && activePlayMode === 'guided' \? transportCopy\.pause : transportCopy\.guided\}/
    );
});

test('Drive-In Auto Play switches visible and aria labels to Pause only during Auto Play', () => {
    assert.match(
        driveInPanel,
        /aria-label=\{\s*isPlaying && activePlayMode === 'auto'\s*\? transportCopy\.autoPauseAria\s*:\s*transportCopy\.autoAria\s*\}/
    );
    assert.match(
        driveInPanel,
        /\{isPlaying && activePlayMode === 'auto' \? transportCopy\.pause : transportCopy\.auto\}/
    );
});

test('Drive-In transport handlers and icons remain unchanged', () => {
    assert.match(driveInPanel, /on:click=\{onPrev\}/);
    assert.match(driveInPanel, /on:click=\{onPlayPause\}/);
    assert.match(driveInPanel, /on:click=\{onAutoPlay\}/);
    assert.match(driveInPanel, /on:click=\{onNext\}/);
    assert.match(driveInPanel, /isPlaying && activePlayMode === 'guided' \? 'Ⅱ' : '▶'/);
    assert.match(driveInPanel, /isPlaying && activePlayMode === 'auto' \? 'Ⅱ' : '▶'/);
});
