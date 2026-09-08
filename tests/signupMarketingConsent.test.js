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
    assert.match(page, /Envíame novedades ocasionales de TopSpot40 y ofertas para miembros fundadores\./);
    assert.match(page, /Optional\. You can unsubscribe at any time\./);
    assert.match(page, /Opcional\. Puedes dejar de recibir estos mensajes en cualquier momento\./);
    assert.doesNotMatch(page, /miembros iniciales|cancelar la suscripción/);
    assert.match(page, /readLanguagePreference/);
    assert.match(page, /Quero receber novidades ocasionais do TopSpot40 e ofertas para membros fundadores\./);
    assert.match(page, /Opcional\. Você pode deixar de receber essas mensagens a qualquer momento\./);
    assert.match(page, /'pt-BR': \{[\s\S]*?back: 'Voltar'[\s\S]*?title: 'Criar uma conta'[\s\S]*?send: 'Enviar código de cadastro'/);
    assert.match(page, /display_name: displayName\.trim\(\)/);
    assert.match(page, /preferred_language: language/);
    assert.match(page, /savedLanguage === 'es' \? 'es' : savedLanguage === 'ptbr' \? 'pt-BR' : 'en'/);
    assert.match(page, /language === 'en' \? error\.message : copy\[language\]\.completeError/);
    assert.match(page, /\.marketing-opt-in \{[\s\S]*?min-height: 44px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\] \{[\s\S]*?width: 20px;[\s\S]*?height: 20px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\]:focus-visible \{[\s\S]*?outline:/);
    assert.match(page, /body: JSON\.stringify\(\{[\s\S]*?access_token: supabaseAccessToken,[\s\S]*?marketing_opt_in: marketingOptIn[\s\S]*?\}\)/);
    assert.match(page, /await goto\('\/create-account'\);/);
    assert.doesNotMatch(page, /marketingOptIn\s*\?\s*.*create-account/);
});

test('completed signup is recorded without sending the email to PostHog', async () => {
    const page = await readFile(
        new URL('../src/routes/signup-official/+page.svelte', import.meta.url),
        'utf8'
    );

    assert.match(page, /import \{ identifyPostHogUser \} from '\$lib\/analytics\/posthog';/);
    assert.match(page, /result\?\.created === true/);
    assert.match(page, /typeof result\?\.user_id === 'string'/);
    assert.match(page, /identifyPostHogUser\(posthog, \{ id: result\.user_id \}\);/);
    assert.match(page, /posthog\.capture\('signup_completed', \{ language \}\);/);
    assert.doesNotMatch(page, /posthog\.capture\('signup_completed',\s*\{[^}]*\bemail\b[^}]*\}\);/);

    const responseCheck = page.indexOf('if (!response.ok)');
    const capture = page.indexOf("posthog.capture('signup_completed'");
    const navigation = page.indexOf("await goto('/create-account')");

    assert.ok(responseCheck < capture);
    assert.ok(capture < navigation);
});

test('successful logout resets the PostHog identity', async () => {
    const header = await readFile(
        new URL('../src/lib/components/Header.svelte', import.meta.url),
        'utf8'
    );

    assert.match(header, /import \{ resetPostHog \} from '\$lib\/analytics\/posthog';/);
    assert.match(header, /resetPostHog\(posthog\);/);

    const failureCheck = header.indexOf('if (backendError || supabaseError)');
    const reset = header.indexOf('resetPostHog(posthog)');
    const navigation = header.indexOf("await goto('/signin'");

    assert.ok(failureCheck < reset);
    assert.ok(reset < navigation);
});
