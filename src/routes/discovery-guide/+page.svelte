<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let hasLanguage = false;

    const copy = {
        en: {
            title: 'TopSpot40 Discovery Guide', description: 'A guided introduction to TopSpot40 music discovery through the decades.',
            eyebrow: 'Music discovery through the decades', hero: 'TopSpot40 Discovery Guide', intro: 'Discover more than 4,400 songs, 64 nostalgia programs, 52 curated collections, and almost 2,000 artists through music history, featured stories, and guided listening experiences.',
            back: 'Back to Welcome', overview: 'TopSpot40 at a glance', overviewText: 'TopSpot40 brings ranked music programs, stories, artist biographies, music history, curated collections, and guided discovery together. It is designed for discovering music and the context around it—not as a streaming service.',
            figures: ['More than 4,400 songs', '64 nostalgia programs', '52 curated collections', 'Almost 2,000 artists', 'English, Spanish, and Portuguese'],
            how: 'How TopSpot40 works', howText: 'TopSpot40 pairs song details, narrated introductions, artist stories, and historical context with direct Spotify links. Spotify handles music playback, advertisements, availability, account restrictions, and Free or Premium behavior.',
            access: 'Access and playback', accessText: 'TopSpot40 is free through December 31, 2026. No TopSpot40 account or credit card is required. A separate Spotify account is required for song playback; Spotify Free or Premium may be used.',
            experiences: 'Four ways to explore', modes: [
                ['Nostalgia Programs', 'Travel through 64 decade-and-genre programs from the 1950s through the 2020s, organized around country, pop, rock, R&B soul, Latin global, blues jazz, folk acoustic, and TV themes.'],
                ['Collections Programs', 'Browse 52 curated specialty collections, including heritage favorites, railroad songs, patriotic favorites, Motown, Disney, crooners, hymns, legends, classical music, and more.'],
                ['Artist Spotlights', 'Explore featured artists through narrated artist stories, curated track groups, and artist-focused listening experiences.'],
                ['Music Docuseries', 'Follow documentary-style series that bring music history, people, movements, and memorable moments to life.']
            ],
            closing: 'An invitation to discover', closingText: 'TopSpot40 is built around curiosity: another artist to learn about, another story to hear, another culture to appreciate, and another song waiting to become a favorite.', open: 'Read more', close: 'Show less'
        },
        es: {
            title: 'Guía de descubrimiento de TopSpot40', description: 'Una introducción guiada al descubrimiento musical de TopSpot40 a través de las décadas.',
            eyebrow: 'Descubrimiento musical a través de las décadas', hero: 'Guía de descubrimiento de TopSpot40', intro: 'Descubre más de 4,400 canciones, 64 programas de nostalgia, 52 colecciones seleccionadas y casi 2,000 artistas a través de la historia de la música, historias destacadas y experiencias de escucha guiadas.',
            back: 'Volver a Bienvenida', overview: 'TopSpot40 de un vistazo', overviewText: 'TopSpot40 reúne programas musicales clasificados, historias, biografías de artistas, historia de la música, colecciones seleccionadas y descubrimiento guiado. Está diseñado para descubrir música y el contexto que la rodea, no como un servicio de streaming.',
            figures: ['Más de 4,400 canciones', '64 programas de nostalgia', '52 colecciones seleccionadas', 'Casi 2,000 artistas', 'Inglés, español y portugués'],
            how: 'Cómo funciona TopSpot40', howText: 'TopSpot40 combina detalles de canciones, introducciones narradas, historias de artistas y contexto histórico con enlaces directos a Spotify. Spotify gestiona la reproducción musical, los anuncios, la disponibilidad, las restricciones de cuenta y el funcionamiento de Free o Premium.',
            access: 'Acceso y reproducción', accessText: 'TopSpot40 es gratuito hasta el 31 de diciembre de 2026. No se requiere una cuenta de TopSpot40 ni tarjeta de crédito. Se requiere una cuenta independiente de Spotify para reproducir canciones; se puede usar Spotify Free o Premium.',
            experiences: 'Cuatro formas de explorar', modes: [
                ['Programas de nostalgia', 'Viaja por 64 programas de décadas y géneros desde los años 1950 hasta los 2020, organizados en torno a country, pop, rock, R&B soul, latino global, blues jazz, folk acústico y temas de televisión.'],
                ['Programas de colecciones', 'Explora 52 colecciones especiales seleccionadas, entre ellas favoritos de herencia, canciones de ferrocarril, favoritos patrióticos, Motown, Disney, crooners, himnos, leyendas, música clásica y más.'],
                ['Artistas destacados', 'Explora artistas destacados mediante historias narradas, grupos de canciones seleccionados y experiencias de escucha centradas en cada artista.'],
                ['Docuseries musicales', 'Sigue series documentales que dan vida a la historia de la música, sus protagonistas, movimientos y momentos memorables.']
            ],
            libraries: 'Explora y comprende las bibliotecas', libraryText: 'Las bibliotecas ofrecen distintos caminos para descubrir: Artistas destacados para los artistas y sus historias, la Biblioteca de nostalgia para programas clasificados por década y género, y la Biblioteca de colecciones para temas y tradiciones musicales seleccionados.',
            multilingual: 'Descubrimiento musical y narración en tres idiomas', multilingualText: 'TopSpot40 está disponible en inglés, español y portugués para que la historia de la música, las historias de artistas y el descubrimiento guiado se disfruten en el idioma preferido de cada oyente.',
            closing: 'Una invitación a descubrir', closingText: 'TopSpot40 se construye alrededor de la curiosidad: otro artista por conocer, otra historia por escuchar, otra cultura por apreciar y otra canción esperando convertirse en una favorita.', start: 'Comenzar a explorar', open: 'Leer más', close: 'Mostrar menos'
        },
        ptbr: {
            title: 'Guia de descoberta do TopSpot40', description: 'Uma introdução guiada à descoberta musical do TopSpot40 através das décadas.',
            eyebrow: 'Descoberta musical através das décadas', hero: 'Guia de descoberta do TopSpot40', intro: 'Descubra mais de 4.400 músicas, 64 programas de nostalgia, 52 coleções selecionadas e quase 2.000 artistas por meio da história da música, histórias em destaque e experiências de audição guiadas.',
            back: 'Voltar às boas-vindas', overview: 'TopSpot40 em resumo', overviewText: 'O TopSpot40 reúne programas musicais classificados, histórias, biografias de artistas, história da música, coleções selecionadas e descoberta guiada. Ele foi criado para descobrir música e o contexto ao seu redor — não como um serviço de streaming.',
            figures: ['Mais de 4.400 músicas', '64 programas de nostalgia', '52 coleções selecionadas', 'Quase 2.000 artistas', 'Inglês, espanhol e português'],
            how: 'Como o TopSpot40 funciona', howText: 'O TopSpot40 combina detalhes das músicas, introduções narradas, histórias de artistas e contexto histórico com links diretos para o Spotify. O Spotify cuida da reprodução musical, dos anúncios, da disponibilidade, das restrições de conta e do funcionamento do Free ou Premium.',
            access: 'Acesso e reprodução', accessText: 'O TopSpot40 é gratuito até 31 de dezembro de 2026. Não é necessário ter conta do TopSpot40 nem cartão de crédito. É necessária uma conta separada do Spotify para reproduzir músicas; o Spotify Free ou Premium pode ser usado.',
            experiences: 'Quatro maneiras de explorar', modes: [
                ['Programas de nostalgia', 'Viaje por 64 programas de décadas e gêneros, dos anos 1950 aos anos 2020, organizados em torno de country, pop, rock, R&B soul, latino global, blues jazz, folk acústico e temas de TV.'],
                ['Programas de coleções', 'Explore 52 coleções especiais selecionadas, incluindo favoritos de herança, canções ferroviárias, favoritos patrióticos, Motown, Disney, crooners, hinos, lendas, música clássica e muito mais.'],
                ['Destaques de artistas', 'Explore artistas em destaque por meio de histórias narradas, grupos de faixas selecionados e experiências de audição voltadas para cada artista.'],
                ['Docusséries musicais', 'Acompanhe séries documentais que dão vida à história da música, seus protagonistas, movimentos e momentos marcantes.']
            ],
            closing: 'Um convite à descoberta', closingText: 'O TopSpot40 é construído em torno da curiosidade: outro artista para conhecer, outra história para ouvir, outra cultura para apreciar e outra música esperando para se tornar favorita.', start: 'Começar a explorar', open: 'Leia mais', close: 'Mostrar menos'
        }
    } as const;

    onMount(() => {
        const savedLanguage = readStoredLanguagePreference();
        if (!savedLanguage) { void goto('/journey-prototype', {replaceState: true}); return; }
        language = savedLanguage;
        hasLanguage = true;
    });
</script>

<svelte:head><title>{copy[language].title}</title><meta name="description" content={copy[language].description}/></svelte:head>

{#if hasLanguage}
    <div class="info-page">
        <PublicJourneyHeader {language}/>
        <main>
            <a class="back" href="/welcome">← {copy[language].back}</a>
            <section class="hero" aria-labelledby="guide-title"><p class="eyebrow">{copy[language].eyebrow}</p><h1 id="guide-title">{copy[language].hero}</h1><p>{copy[language].intro}</p></section>
            <section class="panel" aria-labelledby="overview-title"><h2 id="overview-title">{copy[language].overview}</h2><p>{copy[language].overviewText}</p><div class="figures" role="list">{#each copy[language].figures as figure}<div role="listitem">{figure}</div>{/each}</div></section>
            <section class="panel" aria-labelledby="how-title"><h2 id="how-title">{copy[language].how}</h2><p>{copy[language].howText}</p><aside><h3>{copy[language].access}</h3><p>{copy[language].accessText}</p></aside></section>
            <section class="panel" aria-labelledby="experiences-title"><h2 id="experiences-title">{copy[language].experiences}</h2><div class="experience-cards">{#each copy[language].modes as mode}<article class="experience-card"><h3>{mode[0]}</h3><p>{mode[1]}</p></article>{/each}</div></section>
            <section class="closing" aria-labelledby="closing-title"><h2 id="closing-title">{copy[language].closing}</h2><p>{copy[language].closingText}</p><div class="closing-actions"><a class="start-action" href="/journey-prototype/choose">{language === 'en' ? 'Start Exploring' : copy[language].start}</a><a class="back bottom secondary" href="/welcome">← {copy[language].back}</a></div></section>
        </main>
    </div>
{/if}

<style>
    :global(html), :global(body) { margin: 0; background: #0b0a07; } :global(*) { box-sizing: border-box; }
    .info-page { min-height: 100vh; color: #fff4dd; font-family: Arial, sans-serif; background: radial-gradient(circle at 80% 0%, #38250f 0, #0b0a07 42rem); } main { width: min(1120px, 100%); margin: auto; padding: clamp(26px, 5vw, 58px) clamp(18px, 4vw, 40px) 64px; overflow: hidden; } .back { display: inline-flex; align-items: center; min-height: 46px; margin-bottom: 30px; padding: 10px 16px; color: #161108; background: #f5d66e; border: 2px solid #f7dc82; border-radius: 999px; font-weight: 800; text-decoration: none; } .hero { max-width: 850px; margin-bottom: 34px; } .eyebrow { color: #f5d66e; font-size: .85rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; } h1, h2, h3 { font-family: Georgia, serif; } h1 { margin: 0 0 18px; color: #f7dc82; font-size: clamp(2.5rem, 7vw, 5rem); line-height: 1.04; } h2 { margin: 0 0 14px; color: #f7dc82; font-size: clamp(1.75rem, 4vw, 2.7rem); line-height: 1.15; } h3 { margin: 0 0 8px; color: #fff4d1; font-size: 1.35rem; } p { margin: 0; color: #f6efe0; font-size: clamp(1.06rem, 1.8vw, 1.22rem); line-height: 1.65; } .panel { margin: 20px 0; padding: clamp(22px, 4vw, 38px); background: linear-gradient(145deg, rgba(48, 34, 16, .94), rgba(22, 18, 12, .96)); border: 1px solid rgba(245, 214, 110, .38); border-radius: 18px; } .figures { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-top: 24px; } .figures div { display: grid; place-items: center; min-height: 98px; padding: 14px; color: #f7dc82; background: #17130d; border: 1px solid rgba(245, 214, 110, .28); border-radius: 12px; font-weight: 800; line-height: 1.35; text-align: center; } aside { margin-top: 24px; padding: 20px; background: #17130d; border-left: 5px solid #d9aa28; border-radius: 8px; } .experience-cards { display: grid; gap: 12px; } .experience-card { background: #17130d; border: 1px solid rgba(245, 214, 110, .3); border-radius: 12px; } .experience-card p { padding: 0 20px 20px; } .experience-card h3 { margin: 0; padding: 18px 20px 10px; } .closing { max-width: 820px; margin: 42px auto 0; text-align: center; } .closing-actions { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 26px; } .start-action { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; padding: 13px 22px; color: #10200d; background: #8ee36f; border: 2px solid #b6f29f; border-radius: 999px; font-weight: 800; text-decoration: none; } .start-action:hover { background: #b6f29f; } .bottom.secondary { min-height: auto; margin: 0; padding: 8px 13px; color: #f7dc82; background: transparent; border-color: #d9aa28; font-size: .9rem; } .bottom.secondary:hover { color: #161108; background: #f5d66e; } a:focus-visible { outline: 3px solid #fff; outline-offset: 4px; } @media (max-width: 820px) { .figures { grid-template-columns: repeat(2, 1fr); } } @media (max-width: 440px) { .figures { grid-template-columns: 1fr; } main { padding-inline: 14px; } .panel { padding: 20px; } .back, .start-action { width: 100%; justify-content: center; text-align: center; } .bottom.secondary { width: auto; } } @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; } }
</style>
