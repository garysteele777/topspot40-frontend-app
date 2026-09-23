// @ts-nocheck -- Node source-contract test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('sign-in never creates Supabase users and can route missing profiles to completion', async () => {
  const page = await readFile(new URL('../src/routes/signin/+page.svelte', import.meta.url), 'utf8');
  assert.match(page, /shouldCreateUser: false/);
  assert.match(page, /profile_completion_required/);
  assert.match(page, /'pt-BR'/);
});

test('signup sends the required name and canonical preferred language', async () => {
  const page = await readFile(new URL('../src/routes/signup-official/+page.svelte', import.meta.url), 'utf8');
  assert.match(page, /display_name: displayName\.trim\(\)/);
  assert.match(page, /preferred_language: language/);
  assert.match(page, /savedLanguage === 'ptbr' \? 'pt-BR'/);
});
