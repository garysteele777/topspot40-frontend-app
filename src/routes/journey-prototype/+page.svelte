<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import posthog from 'posthog-js';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import {createSingleChoiceContinue} from '$lib/interactions/singleChoiceContinue.js';
    import {
        readStoredLanguagePreference,
        writeLanguagePreference
    } from '$lib/languagePreferences';
    import {captureLanguageSelected} from '$lib/analytics/posthog';

    type LandingLanguage = 'en' | 'es' | 'ptbr';

    let language: LandingLanguage = 'en';
    let hasChosenLanguage = false;
    let showJourneyLayout = false;

    const text = {
        en: {
            title: 'You know the songs. Discover their stories.',
            subtitle: 'TopSpot40 adds narrated song introductions, artist biographies, and music history to your Spotify listening.',
            trialOffer: 'Free through December 31, 2026 · No credit card required',
            instruction: 'Choose your language—all introductions, artist stories, and music history are narrated in English, Spanish, or Portuguese.',
            continue: 'Continue',
            home: 'Home',
            back: 'Back'
        },
        es: {
            title: 'Conoces las canciones. Descubre sus historias.',
            subtitle: 'TopSpot40 añade introducciones narradas, biografías de artistas e historia musical a lo que escuchas en Spotify.',
            trialOffer: 'Gratis hasta el 31 de diciembre de 2026 · No se requiere tarjeta de crédito',
            instruction: 'Elige tu idioma: todas las introducciones, historias de artistas e historia musical se narran en inglés, español o portugués.',
            continue: 'Continuar',
            home: 'Inicio',
            back: 'Atrás'
        },
        ptbr: {
            title: 'Você conhece as músicas. Descubra suas histórias.',
            subtitle: 'O TopSpot40 acrescenta introduções narradas, biografias de artistas e história da música ao que você ouve no Spotify.',
            trialOffer: 'Grátis até 31 de dezembro de 2026 · Não é necessário cartão de crédito',
            instruction: 'Escolha seu idioma: todas as introduções, histórias de artistas e história da música são narradas em inglês, espanhol ou português.',
            continue: 'Continuar',
            home: 'Início',
            back: 'Voltar'
        }
    };

    const earlyMemberCopy = {
        en: 'Create your free account by December 31, 2026 to qualify for early-member pricing: $49.99/year or $4.99/month, while continuously subscribed.',
        es: 'Crea tu cuenta gratuita antes de finalizar el 31 de diciembre de 2026 para acceder al precio de miembro inicial: $49.99/año o $4.99/mes, mientras mantengas tu suscripción activa sin interrupciones.',
        ptbr: 'Crie sua conta gratuita até 31 de dezembro de 2026 para ter acesso ao preço de membro inicial: $49.99/ano ou $4.99/mês, enquanto mantiver sua assinatura ativa sem interrupções.'
    };

        const landingOfferCopy = {
        en: {
            title: 'Explore first. Join when ready.',
            free: 'Free through December 31, 2026',
            card: 'Choose a language to explore. Signup is optional. No credit card required.',
            qualify: 'Optional: create your free account by December 31, 2026 to qualify for early-member pricing.',
            price: '$49.99/year or $4.99/month',
            terms: 'Keep this price while continuously subscribed.',
            action: 'View early-member offer'
        },
        es: {
            title: 'Explora primero. Únete cuando quieras.',
            free: 'Gratis hasta el 31 de diciembre de 2026',
            card: 'Elige un idioma para explorar. Registrarte es opcional. No se requiere tarjeta de crédito.',
            qualify: 'Opcional: crea tu cuenta gratuita antes de finalizar el 31 de diciembre de 2026 para acceder al precio de miembro inicial.',
            price: '$49.99/año o $4.99/mes',
            terms: 'Conserva este precio mientras mantengas tu suscripción activa sin interrupciones.',
            action: 'Ver oferta para miembros iniciales'
        },
        ptbr: {
            title: 'Explore primeiro. Cadastre-se quando quiser.',
            free: 'Grátis até 31 de dezembro de 2026',
            card: 'Escolha um idioma para explorar. O cadastro é opcional. Não é necessário cartão de crédito.',
            qualify: 'Opcional: crie sua conta gratuita até 31 de dezembro de 2026 para ter direito ao preço de membro inicial.',
            price: '$49.99/ano ou $4.99/mês',
            terms: 'Mantenha este preço enquanto sua assinatura permanecer ativa sem interrupções.',
            action: 'Ver oferta para membros iniciais'
        }
    };

    const languageOptions: {
        code: LandingLanguage;
        name: string;
    }[] = [
        {code: 'en', name: 'English'},
        {code: 'es', name: 'Español'},
        {code: 'ptbr', name: 'Português'}
    ];

    function setLanguage(value: LandingLanguage) {
        language = value;
        hasChosenLanguage = true;
        writeLanguagePreference(value);
    }

    function performContinueJourney() {
        captureLanguageSelected(posthog, language);
        goto('/journey-prototype/choose');
    }

    const selectionContinue = createSingleChoiceContinue({
        getSelected: () => (hasChosenLanguage ? language : null),
        select: setLanguage,
        onContinue: performContinueJourney,
        isContinueDisabled: () => !hasChosenLanguage
    });

    function chooseLanguage(value: LandingLanguage, event?: MouseEvent) {
        selectionContinue.select(value, event);
    }

    function continueJourney() {
        return selectionContinue.continue();
    }

    onMount(() => {
        const journeyScreen = window.matchMedia(
            '(min-width: 1024px) and (min-height: 650px)'
        );

        function updateLayout() {
            showJourneyLayout = journeyScreen.matches;
        }

        const savedLanguage = readStoredLanguagePreference();

        if (savedLanguage) {
            language = savedLanguage;
            hasChosenLanguage = true;
            if (new URL(window.location.href).searchParams.get('showLanding') !== '1') {
                void goto('/journey-prototype/choose', {
                    replaceState: true
                });
                return;
            }
        }

        updateLayout();
        journeyScreen.addEventListener('change', updateLayout);

        return () => {
            journeyScreen.removeEventListener('change', updateLayout);
        };
    });
</script>

<svelte:head>
    <title>Choose Your TopSpot40 Journey</title>
    <meta
            name="description"
            content="Choose the language for your TopSpot40 musical journey."
    />
</svelte:head>

<div class="prototype">
    <PublicJourneyHeader {language}/>

    {#if showJourneyLayout}
        <main class="journey">
            <div class="art-layer">
                <img
                        class="journey-art"
                        src="/images/journey/01-ai-language-journey.png"
                        alt="Three musical roads leading toward the TopSpot40 castle"
                />

                <div class="shade" aria-hidden="true"></div>
            </div>

            <section class="journey-title">
                <h1>{text[language].title}</h1>
                <p class="landing-subtitle">{text[language].subtitle}</p>


                <p class="language-instruction">{text[language].instruction}</p>
            </section>

            <div class="hotspot-layer">
                <button
                        class:active={language === 'en' && hasChosenLanguage}
                        class="road-button english"
                        aria-label="Choose English"
                        aria-pressed={language === 'en' && hasChosenLanguage}
                        on:click={(event) => chooseLanguage('en', event)}
                >
                    <span class="screen-reader-only">English</span>
                </button>

                <button
                        class:active={language === 'es' && hasChosenLanguage}
                        class="road-button spanish"
                        aria-label="Elegir Español"
                        aria-pressed={language === 'es' && hasChosenLanguage}
                        on:click={(event) => chooseLanguage('es', event)}
                >
                    <span class="screen-reader-only">Español</span>
                </button>

                <button
                        class:active={language === 'ptbr' && hasChosenLanguage}
                        class="road-button portuguese"
                        aria-label="Escolher Português"
                        aria-pressed={language === 'ptbr' && hasChosenLanguage}
                        on:click={(event) => chooseLanguage('ptbr', event)}
                >
                    <span class="screen-reader-only">Português</span>
                </button>
{#if hasChosenLanguage}
                <button class="continue" on:click={continueJourney}>
                    {text[language].continue}
                    <span aria-hidden="true">→</span>
                </button>
            {/if}
            </div>



            <aside class="landing-offer" aria-label={landingOfferCopy[language].title}>
                <h2>{landingOfferCopy[language].title}</h2>
                <p class="offer-free">{landingOfferCopy[language].free}</p>
                <p class="offer-card">{landingOfferCopy[language].card}</p>
                <p class="offer-qualify">{landingOfferCopy[language].qualify}</p>
                <p class="offer-price">{landingOfferCopy[language].price}</p>
                <p class="offer-terms">{landingOfferCopy[language].terms}</p>
                <a href="/welcome" on:click={() => writeLanguagePreference(language)}>
                    {landingOfferCopy[language].action}
                </a>
            </aside>

        </main>
    {:else}
        <main class="list-page">
            <section class="list-card">
                <img src="/old-dog-icon.png" alt="" class="list-logo"/>
                <h1>{text[language].title}</h1>
                <p class="landing-subtitle">{text[language].subtitle}</p>


                <p class="language-instruction">{text[language].instruction}</p>

                <div class="language-list">
                    {#each languageOptions as {code, name}}
                        <button
                                class:active={
                                language === code && hasChosenLanguage
                            }
                                on:click={(event) => chooseLanguage(code, event)}
                        >
                            <span>{name}</span>
                            <span aria-hidden="true">
                                {language === code && hasChosenLanguage ? '✓' : '→'}
                            </span>
                        </button>
                    {/each}
                </div>

                {#if hasChosenLanguage}
                    <button class="list-continue" on:click={continueJourney}>
                        {text[language].continue}
                    </button>
                {/if}

            <aside class="landing-offer" aria-label={landingOfferCopy[language].title}>
                <h2>{landingOfferCopy[language].title}</h2>
                <p class="offer-free">{landingOfferCopy[language].free}</p>
                <p class="offer-card">{landingOfferCopy[language].card}</p>
                <p class="offer-qualify">{landingOfferCopy[language].qualify}</p>
                <p class="offer-price">{landingOfferCopy[language].price}</p>
                <p class="offer-terms">{landingOfferCopy[language].terms}</p>
                <a href="/welcome" on:click={() => writeLanguagePreference(language)}>
                    {landingOfferCopy[language].action}
                </a>
            </aside>
</section>
        </main>
    {/if}
</div>

<style>
    :global(html),
    :global(body) {
        margin: 0;
        min-height: 100%;
        background: #0b0a07;
        color: #fff;
        font-family: Arial, sans-serif;
    }

    :global(*) {
        box-sizing: border-box;
    }

    button {
        font: inherit;
    }

    button {
        cursor: pointer;
    }

    .prototype {
        min-height: 100vh;
        background: #0b0a07;
    }


    .journey {
        position: relative;
        width: 100%;
        min-height: calc(100vh - 72px);
        overflow: hidden;
        background: #0b0a07;
    }

    .journey-art {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
    }

    .shade {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.2),
                transparent 25%,
                transparent 78%,
                rgba(0, 0, 0, 0.45)
        );
    }

    .journey-title {
        position: absolute;
        z-index: 4;
        top: 8%;
        left: 50%;
        width: min(1180px, 86vw);
        transform: translateX(-50%);
        text-align: center;
        text-shadow: 0 3px 12px #000, 0 0 30px #000;
        pointer-events: none;
    }

    .journey-title h1 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(30px, 3.35vw, 58px);
        line-height: 1.05;
        white-space: nowrap;
    }

    .journey-title p {
        margin: 10px 0 0;
        font-size: clamp(16px, 1.4vw, 22px);
        font-weight: 700;
    }

    .road-button {
        position: absolute;
        z-index: 6;
        top: 34%;
        width: 12%;
        height: 11.5%;
        padding: 0;
        border: 3px solid transparent;
        border-radius: 22px;
        background: transparent;
        transition: border-color 160ms ease,
        box-shadow 160ms ease,
        background 160ms ease;
    }

    .road-button:hover,
    .road-button:focus-visible,
    .road-button.active {
        outline: none;
        border-color: #7cff54;
        background: rgba(29, 185, 84, 0.1);
        box-shadow: 0 0 18px #55ff3c,
        0 0 48px rgba(55, 255, 56, 0.75),
        inset 0 0 30px rgba(55, 255, 56, 0.24);
    }

    .english {
        left: 23.3%;
    }

    .spanish {
        left: 44.1%;
    }

    .portuguese {
        left: 68.9%;
    }

    .continue {
        position: absolute;
        z-index: 8;
        left: 50%;
        bottom: 3.5%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 30px;
        color: #081008;
        background: #75ef4f;
        border: 2px solid #b7ff9c;
        border-radius: 999px;
        font-size: 20px;
        font-weight: 900;
        box-shadow: 0 0 28px rgba(78, 255, 73, 0.62);
    }

    .list-page {
        min-height: calc(100vh - 72px);
        display: grid;
        place-items: center;
        padding: 90px 24px 40px;
        background: radial-gradient(circle at 30% 20%, #164a23, transparent 40%),
        #101010;
    }

    .list-card {
        width: min(680px, 100%);
        padding: clamp(26px, 5vw, 48px);
        text-align: center;
        background: rgba(18, 18, 18, 0.96);
        border: 1px solid rgba(214, 193, 122, 0.42);
        border-radius: 28px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
    }

    .list-logo {
        width: 64px;
        height: 64px;
        border-radius: 12px;
    }

    .list-card h1 {
        margin: 20px 0 8px;
        color: #f7dc82;
        font-size: clamp(32px, 5vw, 50px);
    }

    .list-card p {
        color: #d8f5e2;
        font-size: 18px;
    }

    .language-list {
        display: grid;
        gap: 14px;
        margin-top: 30px;
    }

    .language-list button {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 24px;
        color: #fff;
        background: #222;
        border: 2px solid #625735;
        border-radius: 15px;
        font-size: 22px;
        font-weight: 800;
    }

    .language-list button:hover,
    .language-list button:focus-visible {
        background: #332d23;
        border-color: #f7dc82;
        outline: none;
    }

    .language-list button.active {
        color: #081008;
        background: #75ef4f;
        border-color: #b7ff9c;
    }

    .list-continue {
        width: 100%;
        min-height: 58px;
        margin-top: 22px;
        color: #111;
        background: #d6c17a;
        border: 0;
        border-radius: 15px;
        font-size: 19px;
        font-weight: 900;
    }

    .screen-reader-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (max-width: 820px) {

        .journey {
            min-height: calc(100vh - 62px);
        }

        .journey-art {
            object-position: center;
        }

        .journey-title {
            top: 12%;
        }

        .journey-title h1 {
            white-space: normal;
        }

        .road-button {
            top: 35%;
            width: 27%;
            height: 13%;
        }

        .english {
            left: 5%;
        }

        .spanish {
            left: 36.5%;
        }

        .portuguese {
            left: 68%;
        }
    }

    /* Rectangular Journey artwork alignment */
    .art-layer,
    .hotspot-layer {
        position: absolute;
        top: 50%;
        left: 50%;
        width: max(100%, calc((100vh - 72px) * 1.780618));
        aspect-ratio: 1672 / 939;
        transform: translate(-50%, -50%);
    }

    .art-layer {
        z-index: 1;
    }

    .hotspot-layer {
        z-index: 5;
        pointer-events: none;
    }

    .hotspot-layer button {
        pointer-events: auto;
    }

    .art-layer .journey-art {
        position: static;
        display: block;
        width: 100%;
        height: 100%;
        object-fit: fill;
    }

    .hotspot-layer .road-button {
        top: 40.05%;
        height: 8.3%;
        border-radius: 5px;
    }

    .hotspot-layer .english {
        left: 23.35%;
        width: 11.7%;
    }

    .hotspot-layer .spanish {
        left: 44.35%;
        width: 10.45%;
    }

    .hotspot-layer .portuguese {
        left: 69%;
        width: 11%;
    }

    @media (max-width: 820px) {
        .art-layer,
        .hotspot-layer {
            width: max(100%, calc((100vh - 62px) * 1.780618));
        }

        .hotspot-layer .road-button {
            top: 40.05%;
            height: 8.3%;
        }

        .hotspot-layer .english {
            left: 23.35%;
            width: 11.7%;
        }

        .hotspot-layer .spanish {
            left: 44.35%;
            width: 10.45%;
        }

        .hotspot-layer .portuguese {
            left: 69%;
            width: 11%;
        }
    }


    .journey-title {
        width: min(1000px, 88vw);
        top: 4%;
        padding: 16px 24px;
        border-radius: 18px;
        background: rgba(8, 5, 2, .85);
    }
    .journey-title h1 { font-size: clamp(28px, 2.7vw, 46px); white-space: normal; }
    .journey-title .landing-subtitle, .list-card .landing-subtitle {
        margin: 8px 0 0; color: #fff4d1;
        font-size: clamp(17px, 1.15vw, 20px); line-height: 1.35; font-weight: 400;
    }
    .journey-title .language-instruction, .list-card .language-instruction {
        margin: 12px 0 0; color: #fff; font-size: 18px; line-height: 1.35;
    }
    .list-page { padding: 82px 16px 24px; }
    .list-card { padding: 24px; }
    .list-card h1 { margin: 12px 0 0; font-size: clamp(28px, 5vw, 42px); }
    .language-list { margin-top: 20px; gap: 10px; }
    .language-list button { min-height: 60px; }
    @media (max-width: 600px) {
        .list-card { padding: 20px 16px; }
    }
    .journey-title { pointer-events: auto; }

    /* Separate the introduction from the membership offer. */
    .journey-title {
        top: 2%;
        width: min(1050px, 86vw);
        padding: 14px 22px;
        background: rgba(8, 5, 2, .78);
    }
    .journey-title h1 {
        font-size: clamp(28px, 2.5vw, 44px);
        line-height: 1.12;
        text-wrap: balance;
    }
    .journey-title .landing-subtitle {
        max-width: 850px;
        margin: 8px auto 0;
        font-size: 18px;
        line-height: 1.35;
    }
    .journey-title .language-instruction {
        margin-top: 10px;
    }
    .hotspot-layer .continue {
        top: 51%;
        bottom: auto;
    }
    .landing-offer {
        box-sizing: border-box;
        padding: 18px;
        border: 1px solid #c4a65a;
        border-radius: 16px;
        background: rgba(8, 5, 2, .88);
        color: #fff4d1;
        text-align: center;
    }
    .journey .landing-offer {
        position: absolute;
        z-index: 8;
        right: 2%;
        bottom: 3%;
        width: min(370px, 30vw);
    }
    .landing-offer h2 {
        margin: 0 0 10px;
        font-size: 23px;
        line-height: 1.2;
    }
    .landing-offer p {
        margin: 8px 0;
        font-size: 16px;
        line-height: 1.35;
    }
    .landing-offer .offer-free,
    .landing-offer .offer-price {
        font-size: 19px;
        font-weight: 700;
        color: #ffe49b;
    }
    .landing-offer .offer-card { margin-top: 4px; }
    .landing-offer a {
        display: block;
        margin-top: 14px;
        padding: 12px 16px;
        border-radius: 10px;
        background: #f5dc8a;
        color: #211706;
        font-size: 17px;
        font-weight: 700;
        text-decoration: none;
    }
    .landing-offer a:hover { background: #ffebad; }
    .landing-offer a:focus-visible {
        outline: 3px solid white;
        outline-offset: 4px;
    }
    .list-card .landing-offer { margin-top: 24px; }


    .journey .landing-offer {
        right: 3%;
        bottom: 7%;
        width: min(370px, 30vw);
    }
    .landing-offer h2 {
        font-size: 21px;
        text-wrap: balance;
    }
    .landing-offer .offer-qualify {
        margin-top: 16px;
        padding-top: 14px;
        border-top: 1px solid rgba(196, 166, 90, .5);
    }
    .landing-offer a {
        display: inline-block;
        margin-top: 8px;
        padding: 8px 4px;
        background: transparent;
        color: #ffe49b;
        font-size: 16px;
        font-weight: 400;
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    .landing-offer a:hover {
        background: transparent;
        color: white;
    }


    .journey .landing-offer {
        left: 67%;
        right: auto;
        transform: translateX(-50%);
    }
    .journey-title .landing-subtitle {
        max-width: 940px;
        font-size: clamp(20px, 1.35vw, 25px);
        font-weight: 700;
        line-height: 1.4;
        color: #fff4d1;
        text-wrap: balance;
    }
    .list-card .landing-subtitle {
        font-size: 20px;
        font-weight: 700;
        line-height: 1.4;
    }


    .journey .landing-offer {
        top: calc(50% + 40px);
        bottom: auto;
        max-height: calc(50% - 56px);
        overflow-y: auto;
        scrollbar-width: thin;
    }


    .journey .landing-offer {
        left: calc(67% - min(185px, 15vw));
        right: auto;
        transform: none;
        width: min(520px, 40vw);
    }


    /* Larger text for comfortable reading. */
    .journey-title .language-instruction,
    .list-card .language-instruction {
        font-size: 20px;
        line-height: 1.45;
    }
    .landing-offer h2 {
        font-size: 24px;
        line-height: 1.3;
    }
    .landing-offer p {
        font-size: 20px;
        line-height: 1.45;
    }
    .landing-offer .offer-free,
    .landing-offer .offer-price {
        font-size: 22px;
    }
    .landing-offer a {
        font-size: 20px;
        line-height: 1.45;
    }
    .journey .landing-offer {
        max-height: none;
        overflow: visible;
        pointer-events: auto;
    }

</style>
