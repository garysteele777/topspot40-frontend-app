// @ts-nocheck -- source-level coverage verifies the shared responsive header contract.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = () => readFile(
    new URL('../src/lib/components/journey/PublicJourneyHeader.svelte', import.meta.url),
    'utf8'
);

test('the journey header provides a bounded mobile menu below 600px', async () => {
    const header = await source();

    assert.match(header, /class="mobile-menu-trigger"/);
    assert.match(header, /aria-controls="mobile-journey-navigation"/);
    assert.match(header, /aria-expanded=\{mobileMenuOpen\}/);
    assert.match(header, /@media \(max-width: 600px\)[\s\S]*?\.desktop-nav\s*\{\s*display: none;/);
    assert.match(header, /width: min\(320px, calc\(100vw - 28px\)\);/);
    assert.match(header, /box-sizing: border-box;/);
});

test('the mobile journey menu uses one-column vertical primary actions at 320px and 360px', async () => {
    const header = await source();

    assert.match(header, /<summary>\{text\[language\]\.about\}<\/summary>/);
    assert.match(header, /<summary>\{text\[language\]\.myTopSpot40\}<\/summary>/);
    assert.match(header, /href="\/signin"/);
    assert.match(header, /href="\/signup-official"/);
    assert.match(header, /\.mobile-menu-panel a:focus-visible/);
    assert.match(header, /class="mobile-primary-actions"/);
    assert.match(header, /\.mobile-menu-panel\s*\{\s*display: flex;\s*flex-direction: column;\s*align-items: stretch;\s*gap: 0;/s);
    assert.match(header, /\.mobile-primary-actions,[\s\S]*?\.mobile-account-actions\s*\{\s*display: flex;\s*flex-direction: column;\s*align-items: stretch;/s);
    assert.doesNotMatch(header, /\.mobile-account-actions\s*\{[\s\S]*?display: grid;/s);
    assert.match(header, /\.mobile-menu-panel summary,[\s\S]*?max-width: 100%;[\s\S]*?box-sizing: border-box;[\s\S]*?white-space: normal;[\s\S]*?overflow-wrap: anywhere;/);
    assert.match(header, /signUp: 'Registrarse'/);
    assert.match(header, /signUp: 'Cadastrar'/);
    assert.match(header, /preferences: 'Preferências de reprodução'/);
});

test('Escape closes the mobile menu and returns focus to its trigger', async () => {
    const header = await source();

    assert.match(header, /event\.key !== 'Escape' \|\| !mobileMenuOpen/);
    assert.match(header, /mobileMenuOpen = false;\s*await tick\(\);\s*mobileMenuTrigger\?\.focus\(\);/s);
    assert.match(header, /document\.addEventListener\('keydown', handleDocumentKeydown\)/);
});

test('the shared header preserves accessible desktop dropdown controls and close behavior', async () => {
    const header = await source();

    assert.match(header, /\{text\[language\]\.about\}\s*<span aria-hidden="true">/);
    assert.match(header, /\{text\[language\]\.myTopSpot40\}\s*<span aria-hidden="true">/);
    assert.match(header, /aria-haspopup="menu"\s*aria-expanded=\{aboutMenuOpen\}\s*on:click\|stopPropagation=\{toggleAboutMenu\}/s);
    assert.match(header, /aria-haspopup="menu"\s*aria-expanded=\{myMenuOpen\}\s*on:click\|stopPropagation=\{toggleMyMenu\}/s);
    assert.match(header, /function toggleAboutMenu\(\) \{\s*aboutMenuOpen = !aboutMenuOpen;\s*myMenuOpen = false;/s);
    assert.match(header, /function toggleMyMenu\(\) \{\s*myMenuOpen = !myMenuOpen;\s*aboutMenuOpen = false;/s);
    assert.match(header, /if \(aboutMenu && !aboutMenu\.contains\(target\)\) \{\s*aboutMenuOpen = false;/s);
    assert.match(header, /if \(myMenu && !myMenu\.contains\(target\)\) \{\s*myMenuOpen = false;/s);
    assert.match(header, /document\.addEventListener\('click', handleDocumentClick\)/);
    assert.match(header, /document\.removeEventListener\('click', handleDocumentClick\)/);
    assert.match(header, /\{#if aboutMenuOpen\}\s*<div class="my-menu-panel" role="menu">/s);
    assert.match(header, /\{#if myMenuOpen\}\s*<div class="my-menu-panel" role="menu">/s);
    assert.match(header, /role="menuitem"/);
});

test('the global journey header respects language selection when sending the logo home', async () => {
    const header = await source();

    assert.match(header, /import \{readStoredLanguagePreference\} from '\$lib\/languagePreferences';/);
    assert.match(header, /function getHomeHref\(\): string \{\s*return readStoredLanguagePreference\(\)\s*\? '\/journey-prototype\/choose'\s*:\ '\/journey-prototype';\s*\}/s);
    assert.match(header, /<a class="brand" href=\{getHomeHref\(\)\} aria-label=\{text\[language\]\.home\}>/);
});

test('the logo remains on the Experience Selection Page when a language is selected', async () => {
    const [header, choosePage] = await Promise.all([
        source(),
        readFile(
            new URL('../src/routes/journey-prototype/choose/+page.svelte', import.meta.url),
            'utf8'
        )
    ]);

    assert.match(header, /\? '\/journey-prototype\/choose'/);
    assert.match(choosePage, /<PublicJourneyHeader \{language\}\/>/);
});

test('the logo without a selected language returns to language selection', async () => {
    const [header, languageSelectionPage] = await Promise.all([
        source(),
        readFile(
            new URL('../src/routes/journey-prototype/+page.svelte', import.meta.url),
            'utf8'
        )
    ]);

    assert.match(header, /readStoredLanguagePreference\(\)\s*\? '\/journey-prototype\/choose'\s*:\ '\/journey-prototype'/s);
    assert.match(languageSelectionPage, /instruction: 'Select a language to begin\.'/);
});

test('the global journey header sends Discover TopSpot40 to welcome', async () => {
    const header = await source();

    assert.match(header, /<a role="menuitem" href="\/welcome">\s*\{text\[language\]\.discover\}/);
    assert.match(header, /<a href="\/welcome">\{text\[language\]\.discover\}<\/a>/);
    assert.doesNotMatch(header, /href="\/catalog\/index\.html"/);
    assert.doesNotMatch(header, /href="\/welcome2"/);
});

test('welcome and both journey selection pages use the shared responsive header', async () => {
    for (const path of [
        '../src/routes/welcome/+page.svelte',
        '../src/routes/journey-prototype/+page.svelte',
        '../src/routes/journey-prototype/choose/+page.svelte'
    ]) {
        const page = await readFile(new URL(path, import.meta.url), 'utf8');
        assert.match(page, /<PublicJourneyHeader \{language\}\/>/);
    }
});
