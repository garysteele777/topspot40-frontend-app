// @ts-nocheck -- verifies the focused classic Car View localization contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const labels = await readFile(
    new URL('../src/lib/carmode/classicViewLabels.ts', import.meta.url),
    'utf8'
);
const header = await readFile(
    new URL('../src/lib/components/car/CarModeHeader.svelte', import.meta.url),
    'utf8'
);
const playerPanel = await readFile(
    new URL('../src/lib/components/car/CarModePlayerPanel.svelte', import.meta.url),
    'utf8'
);
const carPage = await readFile(
    new URL('../src/routes/car-page/+page.svelte', import.meta.url),
    'utf8'
);
const driveInPanel = await readFile(
    new URL('../src/lib/components/car/DriveInPlayerPanel.svelte', import.meta.url),
    'utf8'
);
const narrationActionCopy = await readFile(
    new URL('../src/lib/carmode/narrationActionCopy.ts', import.meta.url),
    'utf8'
);

const expectedCopy = {
    en: {carMode: 'CAR MODE', of: 'of', driveInView: 'Drive-In View'},
    es: {carMode: 'MODO AUTO', of: 'de', driveInView: 'Vista autocine'},
    ptbr: {carMode: 'MODO CARRO', of: 'de', driveInView: 'Vista drive-in'}
};

test('classic Car View labels have approved EN, ES, and PT-BR copy', () => {
    assert.match(labels, /export const classicViewCopy: Record<Language, ClassicViewCopy>/);

    for (const [language, copy] of Object.entries(expectedCopy)) {
        const languageBlock = labels.match(
            new RegExp(`${language}: \\{([\\s\\S]*?)\\n    \\}`, 'm')
        )?.[1] ?? '';

        for (const [key, value] of Object.entries(copy)) {
            assert.match(languageBlock, new RegExp(`${key}: '${value}'`));
        }
    }
});

test('classic-view labels use Car Mode current selection language', () => {
    assert.match(header, /export let language: Language = 'en';/);
    assert.match(header, /classicViewCopy\[language\]\.carMode/);
    assert.doesNotMatch(header, /compact \? 'Car Mode'/);
    assert.match(carPage, /language=\{\$currentSelection\.language\}/);
    assert.match(carPage, /classicViewCopy\[\$currentSelection\?\.language \?\? 'en'\]\.driveInView/);
    assert.match(playerPanel, /formatClassicTrackPosition\([\s\S]*?\$currentSelection\?\.language \?\? 'en'/);
    assert.match(labels, /return `\$\{current\} \$\{classicViewCopy\[language\]\.of\} \$\{total\}`;/);
});

test('Drive-In View uses the active Car Mode language for its stationary labels', () => {
    assert.match(driveInPanel, /<section class="drive-in-shell" aria-label="TopSpot40 Drive-In View">/);
    assert.match(driveInPanel, /export let language: Language = 'en';/);
    assert.match(driveInPanel, /classicViewCopy\[language\]\.nowPlaying/);
    assert.match(driveInPanel, /formatDriveInTrackPosition\(currentTrack\.rank, tracks\.length, language\)/);
    assert.match(driveInPanel, /aria-label=\{classicViewCopy\[language\]\.playbackView\}/);
    assert.match(driveInPanel, /classicViewCopy\[language\]\.carView/);
    assert.match(driveInPanel, /classicViewCopy\[language\]\.driveInView/);
    assert.match(carPage, /<DriveInPlayerPanel[\s\S]*?language=\{\$currentSelection\.language\}/);
});

test('Drive-In View action labels reuse approved Car View copy for EN, ES, and PT-BR', () => {
    const expectedActions = {
        en: {moreInfo: 'More Info', trackList: 'Track List', changeMusic: 'Change Music'},
        es: {moreInfo: 'Más información', trackList: 'Lista de canciones', changeMusic: 'Cambiar música'},
        ptbr: {moreInfo: 'Mais informações', trackList: 'Lista de faixas', changeMusic: 'Mudar música'}
    };

    assert.match(driveInPanel, /import \{narrationActionCopy\} from '\$lib\/carmode\/narrationActionCopy';/);
    assert.match(driveInPanel, /narrationActionCopy\[language\]\.moreInfo/);
    assert.match(driveInPanel, /narrationActionCopy\[language\]\.trackList/);
    assert.match(driveInPanel, /narrationActionCopy\[language\]\.changeMusic/);

    for (const [locale, labels] of Object.entries(expectedActions)) {
        const localeBlock = narrationActionCopy.match(
            new RegExp(`${locale}: \\{([\\s\\S]*?)\\n    \\}`, 'm')
        )?.[1] ?? '';
        for (const [key, value] of Object.entries(labels)) {
            assert.match(localeBlock, new RegExp(`${key}: '${value}'`));
        }
    }
});

test('Drive-In View action handlers remain unchanged', () => {
    assert.match(driveInPanel, /on:click=\{\(\) => setShowNarrationModal\(true\)\}/);
    assert.match(driveInPanel, /on:click=\{\(\) => \(showTrackList = true\)\}/);
    assert.match(driveInPanel, /class="back-button" on:click=\{onBackToOptions\}/);
});
