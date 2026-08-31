// @ts-nocheck -- source-level route coverage is sufficient for this focused navigation change.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('a new language selection continues through welcome, while a remembered language opens experience selection', async () => {
    const languagePage = await source('../src/routes/journey-prototype/+page.svelte');

    assert.match(languagePage, /function performContinueJourney\(\)\s*\{\s*goto\('\/welcome'\);/s);
    assert.match(languagePage, /if \(savedLanguage\)[\s\S]*?goto\('\/journey-prototype\/choose',\s*\{\s*replaceState: true/s);
});

test('welcome requires a stored language and its primary action opens experience selection', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    assert.match(welcomePage, /readStoredLanguagePreference/);
    assert.match(welcomePage, /if \(!savedLanguage\)[\s\S]*?goto\('\/journey-prototype', \{replaceState: true\}\)/s);
    assert.match(welcomePage, /function startExploring\(\)\s*\{\s*goto\('\/journey-prototype\/choose'\);/s);
    assert.match(welcomePage, /<PublicJourneyHeader \{language\}\/>/);
});

test('welcome keeps the localized rediscovery headlines and internal information-page links', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    assert.match(welcomePage, /Rediscover the music that shaped your life\./);
    assert.match(welcomePage, /Redescubre la música que marcó tu vida\./);
    assert.match(welcomePage, /Redescubra a música que marcou a sua vida\./);
    assert.match(welcomePage, /href="\/discovery-guide">\{copy\[language\]\.guide\}<\/a>/);
    assert.match(welcomePage, /href="\/garys-story">\{copy\[language\]\.story\}<\/a>/);
    assert.doesNotMatch(welcomePage, /target="_blank"/);
    assert.doesNotMatch(welcomePage, /\/catalog\/(index|about_topspot40)\.html/);
});

test('welcome repeats the no-account-or-credit-card access message in each language', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    for (const message of [
        'Explore TopSpot40 free through December 31, 2026. No account or credit card required.',
        'Explora TopSpot40 gratis hasta el 31 de diciembre de 2026. No se requiere una cuenta ni tarjeta de crédito.',
        'Explore o TopSpot40 gratuitamente até 31 de dezembro de 2026. Não é necessário ter uma conta nem cartão de crédito.'
    ]) {
        assert.equal(welcomePage.split(message).length - 1, 2);
    }
});

test('welcome separates TopSpot40 access from Spotify playback in each language', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    for (const message of [
        'TopSpot40 requires no account or credit card. A separate Spotify account is required for song playback. Spotify Free or Premium may be used.',
        'TopSpot40 no requiere una cuenta ni tarjeta de crédito. Se requiere una cuenta independiente de Spotify para reproducir las canciones. Puedes usar Spotify Free o Premium.',
        'O TopSpot40 não exige conta nem cartão de crédito. É necessária uma conta separada do Spotify para reproduzir as músicas. Você pode usar o Spotify Free ou Premium.',
        'TopSpot40 guides the experience; Spotify provides music playback. Ads, playback behavior, and song availability depend on your Spotify plan, device, and location.',
        'TopSpot40 guía la experiencia; Spotify proporciona la reproducción musical. Los anuncios, el funcionamiento de la reproducción y la disponibilidad de las canciones dependen de tu plan de Spotify, dispositivo y ubicación.',
        'O TopSpot40 guia a experiência; o Spotify fornece a reprodução das músicas. Anúncios, funcionamento da reprodução e disponibilidade das músicas dependem do seu plano do Spotify, dispositivo e localização.'
    ]) {
        assert.match(welcomePage, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.match(welcomePage, /class="primary-action"[\s\S]*?<\/button>\s*<p class="hero-spotify-note">\{copy\[language\]\.heroSpotifyNote\}<\/p>/);
});

test('welcome embeds the approved localized Phil videos with privacy-preserving playback', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    for (const [language, id, title] of [
        ['en', 'yipWQbKHiME', 'Meet Phil — Your Guide to TopSpot40'],
        ['es', 'WmatRTwhi84', 'Conoce a Phil — Tu Guía de TopSpot40'],
        ['ptbr', 'RHie47DcfKY', 'Conheça o Phil — Seu Guia do TopSpot40']
    ]) {
        assert.match(welcomePage, new RegExp(`${language}: \\{id: '${id}', title: '${title}'\\}`));
    }

    assert.match(welcomePage, /src=\{`https:\/\/www\.youtube-nocookie\.com\/embed\/\$\{philVideos\[language\]\.id\}`\}/);
    assert.match(welcomePage, /title=\{philVideos\[language\]\.title\}/);
    assert.match(welcomePage, /loading="lazy"/);
    assert.match(welcomePage, /allow="encrypted-media; picture-in-picture"/);
    assert.match(welcomePage, /allowfullscreen/);
    assert.doesNotMatch(welcomePage, /autoplay/i);
});
