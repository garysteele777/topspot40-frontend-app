// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {register} from 'node:module';
register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);
const {buildExperienceDestination, PROGRAM_DESTINATIONS} = await import('../src/lib/journey/experienceMode.ts');

const page = readFileSync(new URL('../src/routes/journey-prototype/choose/+page.svelte', import.meta.url), 'utf8');
const families = ['nostalgia', 'collections', 'artist', 'docuseries'];

test('chooser uses one desktop family/mode model', () => {
    assert.match(page, /min-width: 1200px/);
    assert.match(page, /on:click=\{\(\) => setProgram\(choice\)\}/);
    assert.match(page, /\{#if selectedProgram\}[\s\S]*modeCopy\[language\]\.program/);
    assert.match(page, /\{#if selectedProgram !== 'docuseries'\}[\s\S]*modeCopy\[language\]\.radio/);
    assert.doesNotMatch(page, /chooseProgram|selectionContinue|createSingleChoiceContinue|continueJourney/);
    assert.doesNotMatch(page, /on:dblclick/);
    assert.match(page, /class:active=\{selectedProgram === choice\}/);
    assert.match(page, /aria-pressed=\{selectedProgram === choice\}/);
    assert.equal((page.match(/class="mode-button program-mode"/g) ?? []).length, 1);
    assert.equal((page.match(/class="mode-button radio-mode"/g) ?? []).length, 1);
    assert.match(page, /\.mode-button:hover, \.mode-button:focus-visible/);
});

test('desktop mode controls localize and hide Radio Mode for Music Docuseries', () => {
    assert.match(page, /Elige una experiencia y luego elige cómo quieres escuchar\./);
    assert.match(page, /Escolha uma experiência e depois escolha como deseja ouvir\./);
    assert.match(page, /es: \{program: 'Modo Programa', radio: 'Modo Radio'\}/);
    assert.match(page, /ptbr: \{program: 'Modo Programa', radio: 'Modo Rádio'\}/);
    assert.match(page, /selectedProgram !== 'docuseries'/);
});

test('all family destinations preserve program and radio contracts', () => {
    for (const family of families) {
        assert.equal(buildExperienceDestination(family, 'program'), PROGRAM_DESTINATIONS[family]);
        assert.equal(buildExperienceDestination(family, 'radio'), `/journey-prototype/radio?experienceFamily=${family}&experienceMode=radio`);
    }
});

test('mobile cards remain direct Program journeys and contain no Radio Mode button', () => {
    const mobileStart = page.indexOf('{:else}');
    const mobile = page.slice(mobileStart, page.indexOf('</main>', mobileStart));
    assert.match(mobile, /goto\(buildExperienceDestination\(choice, 'program'\)\)/);
    assert.doesNotMatch(mobile, /Program Mode|Radio Mode|startExperience\('radio'\)|mode-button/);
});
