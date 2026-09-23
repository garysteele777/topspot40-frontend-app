// @ts-nocheck -- Node source-contract test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('sign-in exposes an accessible, high-contrast localized sign-up link', async () => {
	const page = await read('../src/routes/signin/+page.svelte');

	assert.match(page, /href="\/signup-official"/);
	assert.match(page, /color: #7ee29c/);
	assert.match(page, /:focus-visible/);
	assert.match(page, /en: \{[^}]*signup: 'Sign Up'/);
	assert.match(page, /es: \{[^}]*signup: 'Crear cuenta'/);
	assert.match(page, /'pt-BR': \{[^}]*signup: 'Criar conta'/);
});

test('signed-in profile menu retains only implemented actions in all supported languages', async () => {
	const menu = await read('../src/lib/components/DropdownMenu.svelte');
	const header = await read('../src/lib/components/Header.svelte');
	const publicHeader = await read('../src/lib/components/LandingHeader.svelte');

	assert.match(menu, /readLanguagePreference/);
	assert.match(menu, /manageAccount: 'Manage Account \/ Subscription'/);
	assert.match(menu, /manageAccount: 'Administrar cuenta \/ suscripción'/);
	assert.match(menu, /manageAccount: 'Gerenciar conta \/ assinatura'/);
	assert.doesNotMatch(menu, /Stats & Analytics|Notifications|Contact Us|onContact/);
	assert.doesNotMatch(header, /ContactModal|showContactModal|onContact/);
	assert.match(publicHeader, /Contact Us/);
	assert.match(menu, /onManageAccount/);
	assert.match(menu, /onFeedback/);
	assert.match(menu, /onLogout/);
});
