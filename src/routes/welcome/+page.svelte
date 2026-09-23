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
            title: 'Welcome to TopSpot40',
            description: 'A guided journey through music, memories, and stories.',
            eyebrow: 'Music discovery through the decades',
            hero: 'Rediscover the music that shaped your life.',
            heroText: 'TopSpot40 brings music, memories, and the stories behind the songs together in one guided journey.',
            free: 'Explore TopSpot40 free through December 31, 2026. No account or credit card required.',
            start: 'Start Exploring — No Account Required',
            deviceNotice: 'TopSpot40 works on phones, tablets, and computers. All content is available on every device. Phones and tablets use Guided Play. Auto Play is available only on desktops and laptops.',
            heroSpotifyNote: 'A separate Spotify account is required only for song playback. Spotify Free or Premium may be used. Music Docuseries can be watched without Spotify. Playback details appear below.',
            glance: 'TopSpot40 at a glance',
            listeningTitle: 'How listening works', listeningIntro: 'All programs, stories, track lists, artist features, and docuseries are available on phones, tablets, desktops, and laptops. Only the way songs advance is different.', guidedPlay: 'Guided Play', guidedPlayText: 'Available on every device. Open each song in Spotify and return to TopSpot40 when it finishes. Works with Spotify Free or Premium.', autoPlay: 'Auto Play', autoPlayText: 'Desktop and laptop only. Automatically advances using estimated song timing. Mobile browser restrictions and the way Spotify opens songs from TopSpot40 prevent reliable Auto Play on phones and tablets. Spotify Premium is recommended. Spotify Free advertisements can cause songs and narration to fall out of sync.', mobileReassurance: 'Nothing is missing on mobile. All content remains available through Guided Play; only automatic advancement is unavailable.', docuseriesPlaybackNote: 'Music Docuseries do not use Guided Play or Auto Play and can be watched without a Spotify account.',
            songs: 'more than 4,400 songs', programs: '64 nostalgia programs', collections: '52 curated collections', artists: 'almost 2,000 artists', languages: 'English, Spanish, and Portuguese',
            earlyMemberTitle: 'Join early and save', earlyMemberText: 'Create your free account by December 31, 2026, and you will qualify for early-member pricing when subscriptions begin.', earlyMemberFootnote: 'Early-member pricing remains available while your subscription remains continuously active.', earlyAnnual: '$49.99/year — best value', earlyMonthly: '$4.99/month', regularPricing: 'Regular pricing beginning January 1, 2027, will be $69.99/year or $6.99/month.', createAccount: 'Create Free Account',
            howTitle: 'See how TopSpot40 works', howText: 'Explore the music, stories, and four ways to experience TopSpot40.', howAction: 'Explore the Discovery Guide',
            experiences: 'Four TopSpot40 experiences',
            nostalgia: 'Nostalgia Programs', nostalgiaText: 'Travel through decades and genres with ranked programs built around the music you remember.',
            collectionsTitle: 'Collections Programs', collectionsText: 'Explore carefully curated musical themes, traditions, and favorites.',
            artist: 'Artist Spotlights', artistText: 'Discover legendary artists through their music, background, and narrated stories.',
            docuseries: 'Music Docuseries', docuseriesText: 'Follow documentary-style series about music history, people, movements, and moments.',
            different: 'Why TopSpot40 is different',
            differentText: 'This is more than a playlist. TopSpot40 pairs music with narrated introductions, artist stories, history, and discovery—because music can carry us back to the people, places, and moments we remember.',
            languagesText: 'The experience is available in English, Spanish, and Portuguese.',
            spotify: 'TopSpot40 provides the stories, narration, program order, and guided experience. Spotify provides the songs. Song availability, advertisements, and Spotify playback behavior may vary by plan, device, and location.',
            phil: 'Meet Phil', philText: 'Phil is your friendly TopSpot40 tour guide, here to help make the journey through music feel welcoming, simple, and full of discovery.',
            finalTitle: 'Your musical journey is ready.', finalText: 'Explore TopSpot40 free through December 31, 2026. No account or credit card required.', finalDeviceNotice: 'All content is available on every device. Mobile uses Guided Play; Auto Play is desktop and laptop only.'
        },
        es: {
            title: 'Bienvenido a TopSpot40', description: 'Un viaje guiado por la música, los recuerdos y las historias.', eyebrow: 'Descubrimiento musical a través de las décadas', hero: 'Redescubre la música que marcó tu vida.', heroText: 'TopSpot40 reúne música, recuerdos y las historias detrás de las canciones en un viaje guiado.', free: 'Explora TopSpot40 gratis hasta el 31 de diciembre de 2026. No se requiere una cuenta ni tarjeta de crédito.', start: 'Comenzar a explorar — No se requiere cuenta', deviceNotice: 'TopSpot40 funciona en teléfonos, tabletas y computadoras. Todo el contenido está disponible en cada dispositivo. Los teléfonos y las tabletas usan Reproducción guiada. La Reproducción automática está disponible solo en computadoras de escritorio y portátiles.', heroSpotifyNote: 'Solo se requiere una cuenta independiente de Spotify para reproducir canciones. Puedes usar Spotify Free o Premium. Las docuseries musicales pueden verse sin Spotify. Los detalles de reproducción aparecen a continuación.',
            glance: 'TopSpot40 de un vistazo', songs: 'más de 4,400 canciones', programs: '64 programas de nostalgia', collections: '52 colecciones seleccionadas', artists: 'casi 2,000 artistas', languages: 'inglés, español y portugués',
            listeningTitle: 'Cómo funciona la escucha', listeningIntro: 'Todos los programas, historias, listas de canciones, contenidos sobre artistas y docuseries están disponibles en teléfonos, tabletas, computadoras de escritorio y portátiles. Solo cambia la forma en que avanzan las canciones.', guidedPlay: 'Reproducción guiada', guidedPlayText: 'Disponible en todos los dispositivos. Abre cada canción en Spotify y vuelve a TopSpot40 cuando termine. Funciona con Spotify Free o Premium.', autoPlay: 'Reproducción automática', autoPlayText: 'Solo en computadoras de escritorio y portátiles. Avanza automáticamente según el tiempo estimado de cada canción. Las restricciones de los navegadores móviles y la forma en que Spotify abre canciones desde TopSpot40 impiden una Reproducción automática confiable en teléfonos y tabletas. Se recomienda Spotify Premium. Los anuncios de Spotify Free pueden hacer que las canciones y la narración se desincronicen.', mobileReassurance: 'No falta nada en dispositivos móviles. Todo el contenido sigue disponible mediante Reproducción guiada; lo único que no está disponible es el avance automático.', docuseriesPlaybackNote: 'Las docuseries musicales no usan Reproducción guiada ni Reproducción automática y pueden verse sin una cuenta de Spotify.',
            earlyMemberTitle: 'Únete ahora y ahorra', earlyMemberText: 'Crea tu cuenta gratuita antes del 31 de diciembre de 2026 y obtendrás el precio especial para miembros fundadores cuando comiencen las suscripciones.', earlyMemberFootnote: 'El precio especial para miembros fundadores se mantendrá mientras tu suscripción permanezca activa.', earlyAnnual: '$49.99 al año — la mejor opción', earlyMonthly: '$4.99 al mes', regularPricing: 'A partir del 1 de enero de 2027, el precio regular será de $69.99 al año o $6.99 al mes.', createAccount: 'Crear una cuenta gratis',
            howTitle: 'Descubre cómo funciona TopSpot40', howText: 'Explora la música, las historias y las cuatro formas de disfrutar TopSpot40.', howAction: 'Explorar la guía',
            experiences: 'Cuatro experiencias TopSpot40', nostalgia: 'Programas de nostalgia', nostalgiaText: 'Viaja por décadas y géneros con programas clasificados basados en la música que recuerdas.', collectionsTitle: 'Programas de colecciones', collectionsText: 'Explora temas musicales, tradiciones y favoritos cuidadosamente seleccionados.', artist: 'Artistas destacados', artistText: 'Descubre artistas legendarios a través de su música, trayectoria e historias narradas.', docuseries: 'Docuseries musicales', docuseriesText: 'Sigue series de estilo documental sobre la historia, las personas, los movimientos y los momentos de la música.',
            different: 'Por qué TopSpot40 es diferente', differentText: 'Esto es más que una lista de reproducción. TopSpot40 combina música con introducciones narradas, historias de artistas, historia y descubrimiento, porque la música puede llevarnos a las personas, lugares y momentos que recordamos.', languagesText: 'La experiencia está disponible en inglés, español y portugués.', spotify: 'TopSpot40 proporciona las historias, la narración, el orden de los programas y la experiencia guiada. Spotify proporciona las canciones. La disponibilidad de las canciones, los anuncios y el comportamiento de reproducción de Spotify pueden variar según el plan, el dispositivo y la ubicación.',
            phil: 'Conoce a Phil', philText: 'Phil es tu amable guía de TopSpot40, aquí para hacer que el viaje por la música sea acogedor, sencillo y lleno de descubrimientos.', finalTitle: 'Tu viaje musical está listo.', finalText: 'Explora TopSpot40 gratis hasta el 31 de diciembre de 2026. No se requiere una cuenta ni tarjeta de crédito.', finalDeviceNotice: 'Todo el contenido está disponible en cada dispositivo. Los móviles usan Reproducción guiada; la Reproducción automática es solo para computadoras de escritorio y portátiles.'
        },
        ptbr: {
            title: 'Bem-vindo ao TopSpot40', description: 'Uma jornada guiada por música, memórias e histórias.', eyebrow: 'Descoberta musical através das décadas', hero: 'Redescubra a música que marcou a sua vida.', heroText: 'O TopSpot40 reúne música, memórias e as histórias por trás das canções em uma jornada guiada.', free: 'Explore o TopSpot40 gratuitamente até 31 de dezembro de 2026. Não é necessário ter uma conta nem cartão de crédito.', start: 'Comece a explorar — Não é necessária uma conta', deviceNotice: 'O TopSpot40 funciona em telefones, tablets e computadores. Todo o conteúdo está disponível em todos os dispositivos. Telefones e tablets usam Reprodução guiada. A Reprodução automática está disponível apenas em computadores de mesa e notebooks.', heroSpotifyNote: 'Uma conta separada do Spotify é necessária apenas para reproduzir músicas. Você pode usar o Spotify Free ou Premium. As docusséries musicais podem ser assistidas sem Spotify. Os detalhes da reprodução aparecem abaixo.',
            glance: 'TopSpot40 em resumo', songs: 'mais de 4.400 canções', programs: '64 programas de nostalgia', collections: '52 coleções selecionadas', artists: 'quase 2.000 artistas', languages: 'inglês, espanhol e português',
            listeningTitle: 'Como funciona a escuta', listeningIntro: 'Todos os programas, histórias, listas de músicas, conteúdos sobre artistas e docusséries estão disponíveis em telefones, tablets, computadores de mesa e notebooks. Apenas a forma de avançar entre as músicas é diferente.', guidedPlay: 'Reprodução guiada', guidedPlayText: 'Disponível em todos os dispositivos. Abra cada música no Spotify e volte ao TopSpot40 quando ela terminar. Funciona com Spotify Free ou Premium.', autoPlay: 'Reprodução automática', autoPlayText: 'Apenas em computadores de mesa e notebooks. Avança automaticamente usando a duração estimada da música. As restrições dos navegadores móveis e a forma como o Spotify abre músicas a partir do TopSpot40 impedem uma Reprodução automática confiável em telefones e tablets. Spotify Premium é recomendado. Os anúncios do Spotify Free podem deixar as músicas e a narração fora de sincronia.', mobileReassurance: 'Nada fica de fora em dispositivos móveis. Todo o conteúdo continua disponível por meio da Reprodução guiada; apenas o avanço automático não está disponível.', docuseriesPlaybackNote: 'As docusséries musicais não usam Reprodução guiada nem Reprodução automática e podem ser assistidas sem uma conta do Spotify.',
            earlyMemberTitle: 'Entre agora e economize', earlyMemberText: 'Crie sua conta gratuita até 31 de dezembro de 2026 e garanta o preço especial para membros fundadores quando as assinaturas começarem.', earlyMemberFootnote: 'O preço especial para membros fundadores será mantido enquanto sua assinatura permanecer ativa.', earlyAnnual: 'US$ 49,99 por ano — melhor opção', earlyMonthly: 'US$ 4,99 por mês', regularPricing: 'A partir de 1º de janeiro de 2027, o preço regular será de US$ 69,99 por ano ou US$ 6,99 por mês.', createAccount: 'Criar conta grátis',
            howTitle: 'Veja como o TopSpot40 funciona', howText: 'Explore a música, as histórias e as quatro maneiras de aproveitar o TopSpot40.', howAction: 'Explorar o guia',
            experiences: 'Quatro experiências TopSpot40', nostalgia: 'Programas de nostalgia', nostalgiaText: 'Viaje por décadas e gêneros com programas classificados baseados na música de que você se lembra.', collectionsTitle: 'Programas de coleções', collectionsText: 'Explore temas musicais, tradições e favoritos cuidadosamente selecionados.', artist: 'Destaques de artistas', artistText: 'Descubra artistas lendários por meio de sua música, trajetória e histórias narradas.', docuseries: 'Docusséries musicais', docuseriesText: 'Acompanhe séries em estilo documentário sobre a história, as pessoas, os movimentos e os momentos da música.',
            different: 'Por que o TopSpot40 é diferente', differentText: 'Isto é mais do que uma playlist. O TopSpot40 combina música com introduções narradas, histórias de artistas, história e descoberta, porque a música pode nos levar de volta às pessoas, lugares e momentos de que nos lembramos.', languagesText: 'A experiência está disponível em inglês, espanhol e português.', spotify: 'O TopSpot40 fornece as histórias, a narração, a ordem dos programas e a experiência guiada. O Spotify fornece as músicas. A disponibilidade das músicas, os anúncios e o comportamento de reprodução do Spotify podem variar conforme o plano, o dispositivo e a localização.',
            phil: 'Conheça Phil', philText: 'Phil é seu amigável guia do TopSpot40, aqui para tornar a jornada pela música acolhedora, simples e cheia de descobertas.', finalTitle: 'Sua jornada musical está pronta.', finalText: 'Explore o TopSpot40 gratuitamente até 31 de dezembro de 2026. Não é necessário ter uma conta nem cartão de crédito.', finalDeviceNotice: 'Todo o conteúdo está disponível em todos os dispositivos. Dispositivos móveis usam Reprodução guiada; a Reprodução automática está disponível apenas em computadores de mesa e notebooks.'
        }
    } as const;

    const philVideos: Record<Language, {id: string; title: string}> = {
        en: {id: 'yipWQbKHiME', title: 'Meet Phil — Your Guide to TopSpot40'},
        es: {id: 'WmatRTwhi84', title: 'Conoce a Phil — Tu Guía de TopSpot40'},
        ptbr: {id: 'RHie47DcfKY', title: 'Conheça o Phil — Seu Guia do TopSpot40'}
    };

    function startExploring() {
        goto('/journey-prototype/choose');
    }

    onMount(() => {
        const savedLanguage = readStoredLanguagePreference();

        if (!savedLanguage) {
            void goto('/journey-prototype', {replaceState: true});
            return;
        }

        language = savedLanguage;
        hasLanguage = true;
    });
</script>

<svelte:head>
    <title>{copy[language].title}</title>
    <meta name="description" content={copy[language].description}/>
</svelte:head>

{#if hasLanguage}
    <div class="welcome-page">
        <PublicJourneyHeader {language}/>
        <main>
            <section class="hero" aria-labelledby="welcome-title">
                <div class="hero-image" aria-hidden="true"></div>
                <div class="hero-content">
                    <p class="eyebrow">{copy[language].eyebrow}</p>
                    <h1 id="welcome-title">{copy[language].hero}</h1>
                    <p class="hero-text">{copy[language].heroText}</p>
                    <p class="free-message">{copy[language].free}</p>
                    <p class="device-notice">{copy[language].deviceNotice}</p>
                    <button class="primary-action" type="button" on:click={startExploring}>{copy[language].start}</button>
                    <p class="hero-spotify-note">{copy[language].heroSpotifyNote}</p>
                </div>
            </section>

            <section class="content-section glance" aria-labelledby="glance-title">
                <h2 id="glance-title">{copy[language].glance}</h2>
                <div class="stats" role="list">
                    {#each [copy[language].songs, copy[language].programs, copy[language].collections, copy[language].artists, copy[language].languages] as stat}
                        <div class="stat" role="listitem">{stat}</div>
                    {/each}
                </div>
            </section>

            <section class="content-section listening" aria-labelledby="listening-title">
                <h2 id="listening-title">{copy[language].listeningTitle}</h2>
                <p class="listening-intro">{copy[language].listeningIntro}</p>
                <div class="listening-grid">
                    <article class="listening-card">
                        <h3>{copy[language].guidedPlay}</h3>
                        <p>{copy[language].guidedPlayText}</p>
                    </article>
                    <article class="listening-card">
                        <h3>{copy[language].autoPlay}</h3>
                        <p>{copy[language].autoPlayText}</p>
                    </article>
                </div>
                <p class="mobile-reassurance">{copy[language].mobileReassurance}</p>
                <p class="docuseries-playback-note">{copy[language].docuseriesPlaybackNote}</p>
            </section>

            {#if language === 'en' || language === 'es' || language === 'ptbr'}
                <section class="content-section early-member-section" aria-labelledby="early-member-title">
                    <div class="early-member-card">
                        <p class="eyebrow">{language === 'es' ? 'OFERTA PARA MIEMBROS FUNDADORES' : language === 'ptbr' ? 'OFERTA PARA MEMBROS FUNDADORES' : 'Early member welcome'}</p>
                        <h2 id="early-member-title">{copy[language].earlyMemberTitle}</h2>
                        <p>{copy[language].earlyMemberText}</p>
                        <div class="early-member-prices" aria-label="Early-member subscription pricing">
                            <p class="early-annual-price">{copy[language].earlyAnnual}</p>
                            <p class="early-monthly-price">{copy[language].earlyMonthly}</p>
                        </div>
                        <p class="early-member-footnote">{copy[language].earlyMemberFootnote}</p>
                        <p class="regular-pricing">{copy[language].regularPricing}</p>
                        <a class="create-account-action" href="/signup-official">{copy[language].createAccount}</a>
                    </div>
                </section>
            {/if}

            {#if language === 'en' || language === 'es' || language === 'ptbr'}
                <section class="content-section how-card-section" aria-labelledby="how-card-title">
                    <div class="how-card">
                        <div>
                            <h2 id="how-card-title">{copy[language].howTitle}</h2>
                            <p>{copy[language].howText}</p>
                        </div>
                        <a href="/discovery-guide">{copy[language].howAction}</a>
                    </div>
                </section>
            {/if}

            <section class="content-section" aria-labelledby="experiences-title">
                <h2 id="experiences-title">{copy[language].experiences}</h2>
                <div class="experience-grid">
                    {#each [['01', copy[language].nostalgia, copy[language].nostalgiaText], ['02', copy[language].collectionsTitle, copy[language].collectionsText], ['03', copy[language].artist, copy[language].artistText], ['04', copy[language].docuseries, copy[language].docuseriesText]] as experience}
                        <article class="experience-card"><span aria-hidden="true">{experience[0]}</span><h3>{experience[1]}</h3><p>{experience[2]}</p></article>
                    {/each}
                </div>
            </section>

            <section class="content-section difference" aria-labelledby="different-title">
                <div><p class="eyebrow">TopSpot40</p><h2 id="different-title">{copy[language].different}</h2></div>
                <div><p>{copy[language].differentText}</p><p>{copy[language].languagesText}</p><p class="spotify-note">{copy[language].spotify}</p></div>
            </section>

            <section class="content-section phil" aria-labelledby="phil-title">
                <div><h2 id="phil-title">{copy[language].phil}</h2><p>{copy[language].philText}</p></div>
                <div class="phil-video">
                    <iframe
                        src={`https://www.youtube-nocookie.com/embed/${philVideos[language].id}`}
                        title={philVideos[language].title}
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture"
                        allowfullscreen
                    ></iframe>
                </div>
            </section>

            <section class="final-invitation" aria-labelledby="final-title">
                <h2 id="final-title">{copy[language].finalTitle}</h2><p>{copy[language].finalText}</p>
                <p class="final-device-notice">{copy[language].finalDeviceNotice}</p>
                <button class="primary-action" type="button" on:click={startExploring}>{copy[language].start}</button>
            </section>
        </main>
    </div>
{/if}

<style>
    :global(html), :global(body) { margin: 0; background: #0b0a07; color: #fff; font-family: Arial, sans-serif; }
    :global(*) { box-sizing: border-box; }
    .welcome-page { min-height: 100vh; background: #0b0a07; }
    main { overflow: hidden; }
    .hero { position: relative; display: grid; place-items: center; padding: clamp(44px, 6vw, 56px) 24px; isolation: isolate; }
    .hero-image { position: absolute; z-index: -2; inset: 0; background: linear-gradient(90deg, rgba(7, 7, 5, .96) 0%, rgba(7, 7, 5, .7) 48%, rgba(7, 7, 5, .8) 100%), url('/images/journey/grand-music-library.png') center / cover; }
    .hero-image::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 55%, #0b0a07); }
    .hero-content, .content-section, .final-invitation { width: min(1120px, 100%); margin: 0 auto; }
    .hero-content { max-width: 760px; text-align: center; }
    .eyebrow { margin: 0 0 14px; color: #f5d66e; font-size: .85rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1, h2, h3, p { margin-top: 0; } h1, h2, h3 { font-family: Georgia, serif; }
    h1 { margin-bottom: 20px; color: #f7dc82; font-size: clamp(2.6rem, 6vw, 5.2rem); line-height: 1.02; }
    h2 { margin-bottom: 22px; color: #f7dc82; font-size: clamp(2rem, 4vw, 3.25rem); line-height: 1.1; }
    h3 { margin-bottom: 10px; color: #fff4d1; font-size: 1.55rem; }
    p { color: #f6efe0; font-size: clamp(1.05rem, 1.7vw, 1.25rem); line-height: 1.6; }
    .hero-text { font-size: clamp(1.2rem, 2.3vw, 1.55rem); }.free-message { color: #dff4bb; font-weight: 700; }.device-notice { max-width: 720px; margin: 20px auto 24px; padding: 14px 18px; color: #fff4d1; background: rgba(24, 20, 14, .8); border: 1px solid rgba(245, 214, 110, .55); border-radius: 14px; font-size: clamp(1.05rem, 1.7vw, 1.2rem); font-weight: 700; line-height: 1.5; }.hero-spotify-note { max-width: 660px; margin: 16px auto 0; color: #e8dfcb; font-size: clamp(.92rem, 1.45vw, 1rem); line-height: 1.5; }
    .primary-action { min-height: 58px; padding: 14px 24px; color: #101008; background: #75ef4f; border: 2px solid #b7ff9c; border-radius: 999px; box-shadow: 0 0 28px rgba(78, 255, 73, .35); font: 800 clamp(1rem, 1.8vw, 1.15rem) Arial, sans-serif; cursor: pointer; }
    .primary-action:hover { background: #93fa73; }.primary-action:focus-visible, a:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
    .content-section { padding: clamp(38px, 5vw, 60px) 24px; }.glance { text-align: center; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }.stat { min-height: 112px; display: grid; place-items: center; padding: 18px; color: #f7dc82; background: linear-gradient(145deg, #272014, #15120d); border: 1px solid rgba(245, 214, 110, .4); border-radius: 16px; font-size: 1.08rem; font-weight: 700; line-height: 1.35; }
    .listening { text-align: center; }.listening-intro { max-width: 820px; margin: 0 auto 28px; font-size: clamp(1.1rem, 1.8vw, 1.3rem); line-height: 1.65; }.listening-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; text-align: left; }.listening-card { padding: clamp(24px, 3vw, 32px); background: linear-gradient(145deg, #272014, #15120d); border: 1px solid rgba(245, 214, 110, .4); border-radius: 18px; }.listening-card h3 { color: #f7dc82; font-size: clamp(1.55rem, 2.6vw, 2rem); }.listening-card p { margin-bottom: 0; font-size: clamp(1.08rem, 1.6vw, 1.2rem); }.mobile-reassurance { max-width: 880px; margin: 24px auto 0; padding: 18px 22px; color: #dff4bb; background: rgba(65, 59, 29, .48); border: 1px solid rgba(182, 242, 159, .48); border-radius: 14px; font-weight: 800; }.docuseries-playback-note { max-width: 800px; margin: 14px auto 0; color: #e8dfcb; font-size: clamp(.95rem, 1.45vw, 1.05rem); line-height: 1.55; }
    .early-member-section { padding-top: 0; padding-bottom: 0; }.early-member-card { padding: clamp(26px, 4vw, 38px); background: linear-gradient(115deg, #273b1d, #161d11); border: 1px solid rgba(182, 242, 159, .5); border-radius: 18px; }.early-member-card .eyebrow { color: #b6f29f; }.early-member-card h2 { margin-bottom: 10px; font-size: clamp(1.7rem, 3vw, 2.4rem); }.early-member-card > p { max-width: 760px; margin-bottom: 0; }.early-member-prices { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }.early-annual-price, .early-monthly-price { margin: 0; padding: 10px 14px; border-radius: 999px; font-size: 1rem; font-weight: 800; }.early-annual-price { color: #10200d; background: #b6f29f; }.early-monthly-price { color: #eaf9df; background: rgba(182, 242, 159, .16); border: 1px solid rgba(182, 242, 159, .55); }.early-member-footnote, .regular-pricing { margin-top: 14px; color: #eaf9df; }.regular-pricing { font-weight: 700; }.create-account-action { display: inline-flex; align-items: center; justify-content: center; min-height: 52px; margin-top: 22px; padding: 13px 22px; color: #10200d; background: #b6f29f; border: 2px solid #d7ffc6; border-radius: 999px; box-shadow: 0 0 24px rgba(182, 242, 159, .28); font-weight: 800; text-decoration: none; }.create-account-action:hover { background: #d7ffc6; }
    .how-card-section { padding-top: 0; }.how-card { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding: clamp(26px, 4vw, 38px); background: linear-gradient(115deg, #413215, #1a160d); border: 1px solid rgba(245, 214, 110, .58); border-radius: 18px; box-shadow: 0 12px 30px rgba(0, 0, 0, .22); }.how-card h2 { margin-bottom: 10px; font-size: clamp(1.7rem, 3vw, 2.4rem); }.how-card p { max-width: 680px; margin-bottom: 0; }.how-card a { flex: 0 0 auto; padding: 14px 20px; color: #101008; background: #f5d66e; border: 2px solid #f7dc82; border-radius: 999px; font-weight: 800; text-align: center; text-decoration: none; }.how-card a:hover { background: #fff0a8; }
    .experience-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }.experience-card { min-height: 260px; padding: 28px; background: #18140e; border: 1px solid rgba(245, 214, 110, .32); border-radius: 18px; }.experience-card span { display: block; margin-bottom: 30px; color: #e54a2e; font-weight: 900; letter-spacing: .12em; }.experience-card p { font-size: 1rem; }
    .difference { display: grid; grid-template-columns: .9fr 1.1fr; align-items: start; gap: clamp(30px, 5vw, 72px); background: linear-gradient(115deg, #2e2110, #12100c); border-block: 1px solid rgba(245, 214, 110, .2); }.spotify-note { padding-left: 18px; border-left: 4px solid #d9aa28; color: #f7dc82; font-size: 1rem; }
    .phil { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); align-items: center; gap: clamp(24px, 4vw, 48px); }.phil-video { width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: #1c160d; border: 2px solid #8a6b24; border-radius: 14px; box-shadow: 0 12px 30px rgba(0, 0, 0, .35); }.phil-video iframe { display: block; width: 100%; height: 100%; border: 0; }
    .final-invitation { padding: clamp(40px, 5vw, 62px) 24px; text-align: center; }.final-invitation p { max-width: 650px; margin: 0 auto 24px; color: #dff4bb; font-weight: 700; }.final-invitation .final-device-notice { max-width: 760px; margin-top: -8px; color: #fff4d1; font-size: clamp(1.05rem, 1.6vw, 1.2rem); }
    @media (max-width: 850px) { .stats { grid-template-columns: repeat(2, 1fr); }.listening-grid { grid-template-columns: 1fr; }.how-card { align-items: flex-start; flex-direction: column; }.experience-grid { grid-template-columns: repeat(2, 1fr); }.difference { grid-template-columns: 1fr; }.phil { grid-template-columns: 1fr; text-align: center; } }
    @media (max-width: 520px) { .hero { padding: 42px 18px; }.content-section, .final-invitation { padding-inline: 18px; }.stats, .experience-grid, .listening-grid { grid-template-columns: 1fr; }.stat { min-height: 76px; }.experience-card { min-height: auto; }.primary-action { width: 100%; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; } }
</style>
