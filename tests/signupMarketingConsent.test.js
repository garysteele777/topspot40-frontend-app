// @ts-nocheck -- source-level coverage verifies the signup contract without calling external services.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('signup keeps marketing consent optional and sends it separately from account creation', async () => {
    const page = await readFile(
        new URL('../src/routes/signup-official/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(page, /let marketingOptIn = false;/);
    assert.match(page, /type="checkbox"[\s\S]*?bind:checked=\{marketingOptIn\}/);
    assert.match(page, /Send me occasional TopSpot40 updates and early-member offers\./);
    assert.match(page, /Optional\. You can unsubscribe at any time\./);
    assert.match(page, /\.marketing-opt-in \{[\s\S]*?min-height: 44px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\] \{[\s\S]*?width: 20px;[\s\S]*?height: 20px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\]:focus-visible \{[\s\S]*?outline:/);
    assert.match(page, /body: JSON\.stringify\(\{[\s\S]*?access_token: supabaseAccessToken,[\s\S]*?marketing_opt_in: marketingOptIn[\s\S]*?\}\)/);
    assert.match(page, /await goto\('\/create-account'\);/);
    assert.doesNotMatch(page, /marketingOptIn\s*\?\s*.*create-account/);
});
