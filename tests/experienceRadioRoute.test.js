// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {register} from 'node:module';

register('./helpers/svelteKitAliasLoader.mjs', import.meta.url);
const {
    buildExperienceDestination,
    isRadioExperienceDestination,
    parseRadioExperience,
    PROGRAM_DESTINATIONS
} = await import('../src/lib/journey/experienceMode.ts');

const route = readFileSync(new URL('../src/routes/journey-prototype/radio/+page.svelte', import.meta.url), 'utf8');
const chooser = readFileSync(new URL('../src/routes/journey-prototype/choose/+page.svelte', import.meta.url), 'utf8');
const launcher = readFileSync(new URL('../src/lib/components/options-v2/InteractiveRadioPanel.svelte', import.meta.url), 'utf8');
const carPage = readFileSync(new URL('../src/routes/car-page/+page.svelte', import.meta.url), 'utf8');
const families = ['nostalgia', 'collections', 'artist', 'docuseries'];

test('validates every shared Radio family and mode', () => {
    for (const family of families) {
        const url = new URL(buildExperienceDestination(family, 'radio'), 'https://topspot.test');
        assert.equal(parseRadioExperience(url.searchParams), family);
    }
    assert.equal(parseRadioExperience(new URLSearchParams()), null);
    assert.equal(parseRadioExperience(new URLSearchParams('experienceFamily=nostalgia&experienceMode=program')), null);
    assert.equal(parseRadioExperience(new URLSearchParams('experienceFamily=invalid&experienceMode=radio')), null);
    assert.equal(isRadioExperienceDestination(buildExperienceDestination('nostalgia', 'radio')), true);
    assert.equal(isRadioExperienceDestination('https://topspot40.invalid/journey-prototype/radio?experienceFamily=nostalgia&experienceMode=radio'), false);
});

test('radio route uses the desktop guard and returns invalid requests safely', () => {
    assert.match(route, /parseRadioExperience/);
    assert.match(route, /goto\('\/journey-prototype\/choose', \{replaceState: true\}\)/);
    assert.match(route, /function backToChoose[\s\S]*goto\('\/journey-prototype\/choose'\)/);
    assert.match(route, /min-width: 1200px/);
    for (const family of families) {
        assert.match(route, new RegExp(`buildExperienceDestination\\(family, 'program'\\)`));
        assert.equal(buildExperienceDestination(family, 'program'), PROGRAM_DESTINATIONS[family]);
    }
});

test('Nostalgia reuses the established Interactive Radio launcher and return contract', () => {
    assert.match(route, /InteractiveRadioPanel journeyLauncher=\{true\}/);
    assert.match(route, /returnTo=\{buildExperienceDestination\('nostalgia', 'radio'\)\}/);
    assert.doesNotMatch(route, /interactive-radio-test/);
    assert.match(launcher, /export let journeyLauncher = false/);
    assert.match(launcher, /radioReturnTo/);
    assert.match(carPage, /isRadioExperienceDestination\(radioReturnTo\)/);
});

test('chooser copy and mobile program navigation remain intact', () => {
    assert.match(chooser, /Choose an experience, then choose how you'd like to listen\./);
    assert.match(chooser, /Program Mode <span\s+aria-hidden="true">/);
    assert.match(chooser, /Radio Mode <span aria-hidden="true">/);
    const mobileStart = chooser.indexOf('{:else}');
    const mobile = chooser.slice(mobileStart, chooser.indexOf('</main>', mobileStart));
    assert.match(mobile, /goto\(buildExperienceDestination\(choice, 'program'\)\)/);
    assert.doesNotMatch(mobile, /Radio Mode|mode-button/);
});
