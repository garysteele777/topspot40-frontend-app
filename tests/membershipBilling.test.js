// @ts-nocheck -- verifies the frontend membership contract without calling Stripe.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');

async function sourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async entry => {
        const path = new URL(entry.name, directory);
        return entry.isDirectory()
            ? sourceFiles(new URL(`${entry.name}/`, directory))
            : [path];
    }));

    return files.flat();
}

test('grace access selects the reserved annual and monthly backend endpoints', async () => {
    const api = await read('../src/lib/api/membership.ts');
    const page = await read('../src/routes/create-account/+page.svelte');

    assert.match(api, /create-2027-promo-checkout-session\?plan=\$\{plan\}/);
    assert.match(api, /credentials: 'include'/);
    assert.match(page, /checkout\('annual'\)/);
    assert.match(page, /checkout\('monthly'\)/);
    assert.match(page, /\$49\.99\/year/);
    assert.match(page, /\$4\.99\/month/);
    assert.match(page, /US\$49\.99\/año/);
    assert.match(page, /US\$4\.99\/mes/);
    assert.match(page, /US\$49,99\/ano/);
    assert.match(page, /US\$4,99\/mês/);
    assert.match(page, /disabled=\{loadingPlan !== null\}/);
});

test('checkout validates Stripe redirects and reports loading and errors accessibly', async () => {
    const api = await read('../src/lib/api/membership.ts');
    const page = await read('../src/routes/create-account/+page.svelte');

    assert.match(api, /url\.protocol === 'https:'/);
    assert.match(api, /checkout\.stripe\.com/);
    assert.match(api, /invalid checkout URL/);
    assert.match(page, /Opening secure checkout/);
    assert.match(page, /role="alert"/);
    assert.match(page, /if \(loadingPlan\) return/);
    assert.match(page, /catch \{\s*errorMessage = text\.error;/);
    assert.doesNotMatch(page, /errorMessage = error\.message/);
});

test('grace dashboard notice links members to the plan choices', async () => {
    const dashboard = await read('../src/routes/dashboard/+layout.svelte');

    assert.match(dashboard, /showGracePromotionNotice[\s\S]*?href="\/create-account"[\s\S]*?\{text\.choosePlan\}/);
    assert.match(dashboard, /choosePlan: 'Choose your plan'/);
    assert.match(dashboard, /choosePlan: 'Elige tu plan'/);
    assert.match(dashboard, /choosePlan: 'Escolha seu plano'/);
    assert.match(dashboard, /\$49\.99\/year \(best value\) or \$4\.99\/month/);
    assert.match(dashboard, /US\$49\.99\/año \(mejor valor\) o US\$4\.99\/mes/);
    assert.match(dashboard, /US\$49,99\/ano \(melhor valor\) ou US\$4,99\/mês/);
});

test('source contains no tester membership state', async () => {
    const files = await sourceFiles(new URL('../src/', import.meta.url));
    const source = await Promise.all(files.map(file => readFile(file, 'utf8')));

    assert.doesNotMatch(source.join('\n'), /tester|is_tester/i);
});

test('free and complimentary access suppress payment controls and show the correct copy', async () => {
    const page = await read('../src/routes/create-account/+page.svelte');
    const modal = await read('../src/lib/components/profile-components/MarketingPreferenceModal.svelte');

    assert.match(page, /accessState === 'free_2026'/);
    assert.match(page, /No payment information is required during 2026/);
    assert.match(page, /accessState === 'complimentary'/);
    assert.match(page, /Complimentary Membership/);
    assert.match(page, /status\.access_expires_at/);
    assert.match(modal, /access_state === 'complimentary'/);
    assert.match(modal, /Current access:[\s\S]*?<strong>\{accessLabel\(subscriptionStatus\)\}<\/strong>/);
    assert.match(modal, /No payment is required/);
    assert.equal((modal.match(/memberText\.complimentary/g) ?? []).length, 1);
    assert.match(modal, /access_state === 'complimentary'[\s\S]*?access_expires_at/);
    assert.match(modal, /access_state === 'paid'[\s\S]*?Manage subscription/);
});

test('routing preserves active member access while grace members can view their offer', async () => {
    const createAccountLayout = await read('../src/routes/create-account/+layout.server.ts');
    const dashboardLayout = await read('../src/routes/dashboard/+layout.server.ts');

    assert.match(createAccountLayout, /accessState === 'free_2026'[\s\S]*?accessState === 'complimentary'[\s\S]*?accessState === 'paid'/);
    assert.doesNotMatch(createAccountLayout, /data\.is_subscribed \|\| accessState === 'grace_2027'/);
    assert.match(dashboardLayout, /accessState === 'grace_2027'/);
    assert.match(dashboardLayout, /accessState === 'complimentary'/);
});

test('customer-facing membership additions have English, Spanish, and Brazilian Portuguese copy', async () => {
    const page = await read('../src/routes/create-account/+page.svelte');
    const success = await read('../src/routes/success/+page.svelte');
    const dashboard = await read('../src/routes/dashboard/+layout.svelte');

    for (const source of [page, success]) {
        assert.match(source, /en: \{/);
        assert.match(source, /es: \{/);
        assert.match(source, /ptbr: \{/);
        assert.match(source, /readLanguagePreference/);
    }

    assert.match(page, /miembros fundadores/);
    assert.match(page, /membros fundadores/);
    assert.match(dashboard, /miembros fundadores/);
    assert.match(dashboard, /membros fundadores/);
});
