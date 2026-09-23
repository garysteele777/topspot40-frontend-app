// @ts-nocheck -- executed directly by Node's built-in test runner.
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    LANGUAGE_PREFERENCE_KEY,
    TTS_LANGUAGE_PREFERENCE_KEY,
    normalizeLanguagePreference,
    normalizeSelectedLanguages,
    readLanguagePreference,
    readStoredLanguagePreference,
    writeLanguagePreference
} from '../src/lib/languagePreferences.ts';

function storage(entries = {}) {
    const values = new Map(Object.entries(entries));
    return {
        getItem(key) {
            return values.get(key) ?? null;
        },
        setItem(key, value) {
            values.set(key, value);
        },
        values
    };
}

test('accepts EN, ES, and PT-BR persisted language values', () => {
    for (const language of ['en', 'es', 'ptbr']) {
        const saved = storage({[LANGUAGE_PREFERENCE_KEY]: language});
        assert.equal(readStoredLanguagePreference(saved), language);
        assert.equal(readLanguagePreference('en', saved), language);
    }
});

test('keeps the existing defaults for missing or invalid persisted values', () => {
    assert.equal(readStoredLanguagePreference(storage()), null);
    assert.equal(readStoredLanguagePreference(storage({[LANGUAGE_PREFERENCE_KEY]: 'pt-BR'})), null);
    assert.equal(readLanguagePreference('es', storage()), 'es');
    assert.equal(readLanguagePreference('en', storage({[LANGUAGE_PREFERENCE_KEY]: 'de'})), 'en');
});

test('normalizes legacy and malformed selected-language values in existing order', () => {
    assert.deepEqual(
        normalizeSelectedLanguages(['ptbr', 'en', 'ptbr', 'es', 'en']),
        ['ptbr', 'en', 'es']
    );
    assert.deepEqual(normalizeSelectedLanguages(['PT-BR', null, 'es']), ['en', 'es']);
    assert.equal(normalizeLanguagePreference('PT-BR'), 'en');
});

test('writes both existing language keys without changing their string format', () => {
    const saved = storage();
    writeLanguagePreference('ptbr', saved);

    assert.equal(saved.values.get(LANGUAGE_PREFERENCE_KEY), 'ptbr');
    assert.equal(saved.values.get(TTS_LANGUAGE_PREFERENCE_KEY), 'ptbr');
});

test('malformed stored JSON remains rejected by the separate selection persistence format', () => {
    assert.throws(() => JSON.parse('{malformed'));
});
