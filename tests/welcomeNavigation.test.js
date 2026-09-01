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
    assert.match(englishCopy, /earlyAnnual: '\$49\.99\/year — best value'/);
    assert.match(englishCopy, /earlyMonthly: '\$4\.99\/month'/);
    assert.match(englishCopy, /regularPricing: 'Regular pricing beginning January 1, 2027, will be \$69\.99\/year or \$6\.99\/month\.'/);
    assert.doesNotMatch(englishCopy, /Early annual:|Early monthly:|Regular annual:|Regular monthly:|email updates/);
    assert.match(welcomePage, /class="early-member-prices"[\s\S]*?earlyAnnual[\s\S]*?earlyMonthly[\s\S]*?<\/div>\s*<p class="early-member-footnote">[\s\S]*?<p class="regular-pricing">/);
    assert.match(englishCopy, /createAccount: 'Create Free Account'/);
    assert.match(welcomePage, /class="create-account-action" href="\/signup-official">\{copy\[language\]\.createAccount\}<\/a>/);
    const spanishCopy = welcomePage.match(/es:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*ptbr:/)?.[1] ?? '';
    assert.match(spanishCopy, /earlyMemberTitle: 'Únete ahora y ahorra'/);
    assert.match(welcomePage, /OFERTA PARA MIEMBROS FUNDADORES/);
    assert.match(spanishCopy, /Crea tu cuenta gratuita antes del 31 de diciembre de 2026 y obtendrás el precio especial para miembros fundadores cuando comiencen las suscripciones\./);
    assert.match(spanishCopy, /El precio especial para miembros fundadores se mantendrá mientras tu suscripción permanezca activa\./);
    assert.match(spanishCopy, /earlyAnnual: '\$49\.99 al año — la mejor opción'/);
    assert.match(spanishCopy, /earlyMonthly: '\$4\.99 al mes'/);
    assert.match(spanishCopy, /A partir del 1 de enero de 2027, el precio regular será de \$69\.99 al año o \$6\.99 al mes\./);
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
    assert.match(portugueseCopy, /earlyAnnual: 'US\$ 49,99 por ano — melhor opção'/);
    assert.match(portugueseCopy, /earlyMonthly: 'US\$ 4,99 por mês'/);
    assert.match(portugueseCopy, /A partir de 1º de janeiro de 2027, o preço regular será de US\$ 69,99 por ano ou US\$ 6,99 por mês\./);
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

test('welcome explains transparent Spotify playback and device behavior in each language', async () => {
    const welcomePage = await source('../src/routes/welcome/+page.svelte');

    const localizedCopy = {
        en: [
            /required only for song playback/, /Spotify Free or Premium may be used/, /Music Docuseries can be watched without Spotify/,
            /All content is available on every device/, /Phones and tablets use Guided Play/, /Auto Play is available only on desktops and laptops/,
            /Spotify Premium is recommended/, /Spotify Free advertisements can cause songs and narration to fall out of sync/
        ],
        es: [
            /Solo se requiere una cuenta independiente de Spotify para reproducir canciones/, /Spotify Free o Premium/, /docuseries musicales pueden verse sin Spotify/i,
            /Todo el contenido est\u00e1 disponible en cada dispositivo/, /tel\u00e9fonos y las tabletas usan Reproducci\u00f3n guiada/, /Reproducci\u00f3n autom\u00e1tica est\u00e1 disponible solo en computadoras de escritorio y port\u00e1tiles/,
            /Se recomienda Spotify Premium/, /anuncios de Spotify Free pueden hacer que las canciones y la narraci\u00f3n se desincronicen/
        ],
        ptbr: [
            /necess\u00e1ria apenas para reproduzir m\u00fasicas/, /Spotify Free ou Premium/, /docuss\u00e9ries musicais podem ser assistidas sem Spotify/i,
            /Todo o conte\u00fado est\u00e1 dispon\u00edvel em todos os dispositivos/, /Telefones e tablets usam Reprodu\u00e7\u00e3o guiada/, /Reprodu\u00e7\u00e3o autom\u00e1tica est\u00e1 dispon\u00edvel apenas em computadores de mesa e notebooks/,
            /Spotify Premium \u00e9 recomendado/, /an\u00fancios do Spotify Free podem deixar as m\u00fasicas e a narra\u00e7\u00e3o fora de sincronia/
        ]
    };
    for (const assertions of Object.values(localizedCopy)) {
        for (const assertion of assertions) assert.match(welcomePage, assertion);
    }

    assert.match(welcomePage, /class="device-notice">\{copy\[language\]\.deviceNotice\}<\/p>\s*<button class="primary-action"/);
    assert.match(welcomePage, /class="content-section listening"[\s\S]*?class="listening-grid"[\s\S]*?\{copy\[language\]\.guidedPlay\}[\s\S]*?\{copy\[language\]\.autoPlay\}[\s\S]*?class="docuseries-playback-note">\{copy\[language\]\.docuseriesPlaybackNote\}/);
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
    const iframeMarkup = welcomePage.match(/<iframe\b[\s\S]*?<\/iframe>/)?.[0] ?? '';
    assert.notEqual(iframeMarkup, '');
    assert.doesNotMatch(iframeMarkup, /\bautoplay\b/i);
});
