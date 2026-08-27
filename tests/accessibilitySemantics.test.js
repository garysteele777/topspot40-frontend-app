// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const readComponent = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('profile dropdown uses a native button trigger', async () => {
    const source = await readComponent('../src/lib/components/Header.svelte');

    assert.match(source, /<button\s+type="button"\s+class="profile-toggle"/);
    assert.match(source, /aria-haspopup="menu"/);
    assert.match(source, /aria-expanded=\{showDropdown\}/);
});

test('narration modal remains a focusable dialog', async () => {
    const source = await readComponent('../src/lib/components/car/CarModeNarrationModal.svelte');

    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /aria-labelledby="narration-modal-title"/);
    assert.match(source, /tabindex="-1"/);
});

test('narration modal Escape closes before restoring focus to its trigger', async () => {
    const source = await readComponent('../src/lib/components/car/CarModeNarrationModal.svelte');

    assert.match(source, /event\.key === 'Escape'/);
    assert.match(source, /event\.stopPropagation\(\);\s*onClose\(\);/s);
    assert.match(source, /previouslyFocusedElement\s*=\s*[\s\S]*document\.activeElement/);
    assert.match(source, /await tick\(\);\s*if \(!open && previouslyFocusedElement\?\.isConnected\)/s);
    assert.match(source, /previouslyFocusedElement\.focus\(\);/);
    assert.match(source, /event\.key === 'Tab'.*trapFocus\(event\)/s);
});

test('informational landing feature cards are not tabbable', async () => {
    const source = await readComponent('../src/routes/landing-classic/+page.svelte');

    assert.equal((source.match(/class="feature-card" tabindex="0"/g) ?? []).length, 0);
    assert.equal((source.match(/class="feature-card"/g) ?? []).length, 6);
});
