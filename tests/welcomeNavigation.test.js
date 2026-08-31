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

test('welcome adds the approved early-member offer and discovery guide in every language without Portuguese creator content', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    assert.match(welcomePage, /Rediscover the music that shaped your life\./);
    assert.match(welcomePage, /Redescubre la música que marcó tu vida\./);
    assert.match(welcomePage, /Redescubra a música que marcou a sua vida\./);
    assert.doesNotMatch(welcomePage, /class="content-section creator"/);
    assert.doesNotMatch(welcomePage, /created:|createdText:|guide:|story:/);
    const englishCopy = welcomePage.match(/en:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*es:/)?.[1] ?? '';
    assert.doesNotMatch(englishCopy, /Indiana farm/);
    assert.match(englishCopy, /earlyMemberTitle: 'Join early and save'/);
    assert.match(englishCopy, /Create your free account by December 31, 2026, and you will qualify for early-member pricing when subscriptions begin\./);
    assert.match(englishCopy, /Early-member pricing remains available while your subscription remains continuously active\./);
    assert.match(englishCopy, /earlyAnnual: '\$49\/year — best value'/);
    assert.match(englishCopy, /earlyMonthly: '\$4\.99\/month'/);
    assert.match(englishCopy, /regularPricing: 'Regular pricing beginning January 1, 2027, will be \$69\/year or \$6\.99\/month\.'/);
    assert.doesNotMatch(englishCopy, /Early annual:|Early monthly:|Regular annual:|Regular monthly:|email updates/);
    assert.match(welcomePage, /class="early-member-prices"[\s\S]*?earlyAnnual[\s\S]*?earlyMonthly[\s\S]*?<\/div>\s*<p class="early-member-footnote">[\s\S]*?<p class="regular-pricing">/);
    assert.match(englishCopy, /createAccount: 'Create Free Account'/);
    assert.match(welcomePage, /class="create-account-action" href="\/signup-official">\{copy\[language\]\.createAccount\}<\/a>/);
    const spanishCopy = welcomePage.match(/es:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*ptbr:/)?.[1] ?? '';
    assert.match(spanishCopy, /earlyMemberTitle: 'Únete ahora y ahorra'/);
    assert.match(welcomePage, /OFERTA PARA MIEMBROS FUNDADORES/);
    assert.match(spanishCopy, /Crea tu cuenta gratuita antes del 31 de diciembre de 2026 y obtendrás el precio especial para miembros fundadores cuando comiencen las suscripciones\./);
    assert.match(spanishCopy, /El precio especial para miembros fundadores se mantendrá mientras tu suscripción permanezca activa\./);
    assert.match(spanishCopy, /earlyAnnual: '\$49 al año — la mejor opción'/);
    assert.match(spanishCopy, /earlyMonthly: '\$4\.99 al mes'/);
    assert.match(spanishCopy, /A partir del 1 de enero de 2027, el precio regular será de \$69 al año o \$6\.99 al mes\./);
    assert.match(spanishCopy, /createAccount: 'Crear una cuenta gratis'/);
    assert.match(spanishCopy, /howTitle: 'Descubre cómo funciona TopSpot40'/);
    assert.match(spanishCopy, /howText: 'Explora la música, las historias y las cuatro formas de disfrutar TopSpot40\.'/);
    assert.match(spanishCopy, /howAction: 'Explorar la guía'/);
    assert.doesNotMatch(spanishCopy, /miembros iniciales/);
    assert.doesNotMatch(spanishCopy, /created:|guide:|story:/);
    const portugueseCopy = welcomePage.match(/ptbr:\s*\{([\s\S]*?)\r?\n\s*\}\r?\n\s*\}/)?.[1] ?? '';
    assert.match(portugueseCopy, /earlyMemberTitle: 'Entre agora e economize'/);
    assert.match(portugueseCopy, /Crie sua conta gratuita até 31 de dezembro de 2026 e garanta o preço especial para membros fundadores quando as assinaturas começarem\./);
    assert.match(portugueseCopy, /O preço especial para membros fundadores será mantido enquanto sua assinatura permanecer ativa\./);
    assert.match(portugueseCopy, /earlyAnnual: 'US\$ 49 por ano — melhor opção'/);
    assert.match(portugueseCopy, /earlyMonthly: 'US\$ 4,99 por mês'/);
    assert.match(portugueseCopy, /A partir de 1º de janeiro de 2027, o preço regular será de US\$ 69 por ano ou US\$ 6,99 por mês\./);
    assert.match(portugueseCopy, /createAccount: 'Criar conta grátis'/);
    assert.match(portugueseCopy, /howTitle: 'Veja como o TopSpot40 funciona'/);
    assert.match(portugueseCopy, /howText: 'Explore a música, as histórias e as quatro maneiras de aproveitar o TopSpot40\.'/);
    assert.match(portugueseCopy, /howAction: 'Explorar o guia'/);
    assert.match(welcomePage, /\{#if language === 'en' \|\| language === 'es' \|\| language === 'ptbr'\}[\s\S]*?class="content-section early-member-section"[\s\S]*?\{\/if\}[\s\S]*?\{#if language === 'en' \|\| language === 'es' \|\| language === 'ptbr'\}[\s\S]*?class="content-section how-card-section"/);
    assert.match(englishCopy, /howText: 'Explore the music, stories, and four ways to experience TopSpot40\.'/);
    assert.match(welcomePage, /\{#if language === 'en' \|\| language === 'es' \|\| language === 'ptbr'\}[\s\S]*?class="content-section how-card-section"[\s\S]*?href="\/discovery-guide">\{copy\[language\]\.howAction\}<\/a>[\s\S]*?\{\/if\}[\s\S]*?<section class="content-section" aria-labelledby="experiences-title">/);
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
