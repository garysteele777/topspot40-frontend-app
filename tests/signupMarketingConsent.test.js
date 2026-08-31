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
    assert.match(page, /ptbr: \{[\s\S]*?back: 'Voltar'[\s\S]*?title: 'Criar uma conta'[\s\S]*?intro: 'Crie sua conta TopSpot40 com seu endereço de e-mail\.'[\s\S]*?email: 'Endereço de e-mail'[\s\S]*?send: 'Enviar código de cadastro'[\s\S]*?account: 'Já tem uma conta TopSpot40\?'[\s\S]*?signIn: 'Entrar'/);
    assert.match(page, /savedLanguage === 'es' \|\| savedLanguage === 'ptbr' \? savedLanguage : 'en'/);
    assert.match(page, /language === 'en' \? error\.message : copy\[language\]\.completeError/);
    assert.match(page, /\.marketing-opt-in \{[\s\S]*?min-height: 44px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\] \{[\s\S]*?width: 20px;[\s\S]*?height: 20px;/);
    assert.match(page, /\.marketing-opt-in input\[type="checkbox"\]:focus-visible \{[\s\S]*?outline:/);
    assert.match(page, /body: JSON\.stringify\(\{[\s\S]*?access_token: supabaseAccessToken,[\s\S]*?marketing_opt_in: marketingOptIn[\s\S]*?\}\)/);
    assert.match(page, /await goto\('\/create-account'\);/);
    assert.doesNotMatch(page, /marketingOptIn\s*\?\s*.*create-account/);
});
