<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';

    type LandingLanguage = 'en' | 'es' | 'ptbr';
    type Decade =
        | '1950s'
        | '1960s'
        | '1970s'
        | '1980s'
        | '1990s'
        | '2000s'
        | '2010s'
        | '2020s';

    const decades: Decade[] = [
        '1950s',
        '1960s',
        '1970s',
        '1980s',
        '1990s',
        '2000s',
        '2010s',
        '2020s'
    ];

    const decadeIcons: Record<Decade, string> = {
        '1950s': '🎙️',
        '1960s': '🌼',
        '1970s': '🪩',
        '1980s': '📼',
        '1990s': '💿',
        '2000s': '🎧',
        '2010s': '📱',
        '2020s': '🔊'
    };

    let language: LandingLanguage = 'en';
    let selectedDecade: Decade | null = null;

    const text = {
        en: {
            title: 'Choose Your Musical Decade',
            instruction: 'Select a decade to continue your journey.',
            continue: 'Continue',
            back: 'Back',
            home: 'Home',
            contact: 'Contact Us',
            about: 'About',
            signIn: 'Sign In',
            signUp: 'Sign Up'
        },
        es: {
            title: 'Elige tu década musical',
            instruction: 'Selecciona una década para continuar tu viaje.',
            continue: 'Continuar',
            back: 'Atrás',
            home: 'Inicio',
            contact: 'Contáctanos',
            about: 'Acerca de',
            signIn: 'Iniciar sesión',
            signUp: 'Registrarse'
        },
        ptbr: {
            title: 'Escolha sua década musical',
            instruction: 'Selecione uma década para continuar sua jornada.',
            continue: 'Continuar',
            back: 'Voltar',
            home: 'Início',
            contact: 'Fale conosco',
            about: 'Sobre',
            signIn: 'Entrar',
            signUp: 'Cadastrar'
        }
    };

    function chooseDecade(decade: Decade) {
        selectedDecade = decade;
        localStorage.setItem('topspot_journey_decade', decade);
    }

    function continueJourney() {
        if (selectedDecade) {
            goto(`/journey-prototype/genre?decade=${selectedDecade}`);
        }
    }

    onMount(() => {
        const savedLanguage = localStorage.getItem('topspot_language');
        if (
            savedLanguage === 'en' ||
            savedLanguage === 'es' ||
            savedLanguage === 'ptbr'
        ) {
            language = savedLanguage;
        }
    });
</script>

<svelte:head>
    <title>Choose Your Musical Decade</title>
</svelte:head>

<div class="prototype">
    <PublicJourneyHeader {language}/>

    <div class="utilitybar">
        <a class="utility" href="/journey-prototype/choose">
            <span aria-hidden="true">←</span>
            {text[language].back}
        </a>
    </div>

    <main class="decade-page">
        <div class="art-layer">
<img
            class="journey-art"
            src="/images/journey/06-ai-decade-road.png"
            alt="Eight musical roads leading to decades from the 1950s through the 2020s"
        />
        <div class="shade" aria-hidden="true"></div>
</div>

        <section class="page-title">
            <h1>{text[language].title}</h1>
            <p>{text[language].instruction}</p>
        </section>

        <div class="hotspot-layer">
{#each decades as decade}
            <button
                class="decade-button decade-{decade}"
                class:active={selectedDecade === decade}
                aria-label={`Choose ${decade}`}
                aria-pressed={selectedDecade === decade}
                on:click={() => chooseDecade(decade)}
            >
                <span class="screen-reader-only">{decade}</span>
            </button>
        {/each}
</div>

        {#if selectedDecade}
            <button class="continue" on:click={continueJourney}>
                {text[language].continue}
                <span aria-hidden="true">→</span>
            </button>
        {/if}
    </main>

    <main class="mobile-page">
        <section class="mobile-card">
            <h1>{text[language].title}</h1>
            <p>{text[language].instruction}</p>

            <div class="mobile-options">
                {#each decades as decade}
                    <button
                        class:active={selectedDecade === decade}
                        on:click={() => chooseDecade(decade)}
                    >
                        <span class="mobile-icon" aria-hidden="true">
                            {decadeIcons[decade]}
                        </span>
                        <span>{decade}</span>
                        <span aria-hidden="true">→</span>
                    </button>
                {/each}
            </div>

            {#if selectedDecade}
                <button class="mobile-continue" on:click={continueJourney}>
                    {text[language].continue} →
                </button>
            {/if}
        </section>
    </main>
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

    button,
    a {
        font: inherit;
    }

    button {
        cursor: pointer;
    }

    .prototype {
        min-height: 100vh;
        background: #0b0a07;
    }


    .utilitybar {
        position: absolute;
        z-index: 30;
        top: 88px;
        left: clamp(16px, 3vw, 48px);
        display: flex;
        gap: 10px;
    }

    .utility {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 9px 13px;
        color: #fff;
        background: rgba(8, 8, 8, 0.76);
        border: 1px solid rgba(245, 214, 110, 0.55);
        border-radius: 10px;
        text-decoration: none;
        backdrop-filter: blur(7px);
    }

    .decade-page {
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
        background:
            linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.12),
                transparent 24%,
                transparent 80%,
                rgba(0, 0, 0, 0.36)
            );
    }

    .page-title {
        position: absolute;
        z-index: 4;
        top: 2.5%;
        left: 50%;
        width: min(900px, 52vw);
        transform: translateX(-50%);
        text-align: center;
        text-shadow: 0 3px 12px #000, 0 0 30px #000;
        pointer-events: none;
    }

    .page-title h1 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(28px, 3vw, 50px);
        line-height: 1.05;
    }

    .page-title p {
        margin: 8px 0 0;
        font-size: clamp(15px, 1.25vw, 20px);
        font-weight: 700;
    }

    .decade-button {
        position: absolute;
        z-index: 6;
        width: 16.7%;
        height: 15%;
        padding: 0;
        border: 3px solid transparent;
        border-radius: 22px;
        background: transparent;
        transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
    }

    .decade-button:hover,
    .decade-button:focus-visible,
    .decade-button.active {
        outline: none;
        border-color: #7cff54;
        background: rgba(29, 185, 84, 0.1);
        box-shadow:
            0 0 18px #55ff3c,
            0 0 48px rgba(55, 255, 56, 0.75),
            inset 0 0 30px rgba(55, 255, 56, 0.24);
    }

    .decade-1950s,
    .decade-1960s,
    .decade-1970s,
    .decade-1980s {
        left: 3.5%;
    }

    .decade-1990s,
    .decade-2000s,
    .decade-2010s,
    .decade-2020s {
        left: 79.7%;
    }

    .decade-1950s,
    .decade-1990s {
        top: 11.5%;
    }

    .decade-1960s,
    .decade-2000s {
        top: 31.5%;
    }

    .decade-1970s,
    .decade-2010s {
        top: 51.5%;
    }

    .decade-1980s,
    .decade-2020s {
        top: 76.5%;
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

    .mobile-page {
        display: none;
    }

    @media (max-width: 700px) and (orientation: portrait) {

        .utilitybar {
            top: 74px;
        }

        .decade-page {
            display: none;
        }

        .mobile-page {
            min-height: calc(100vh - 62px);
            display: block;
            padding: 78px 14px 28px;
            background:
                radial-gradient(circle at 50% 0%, #31591e, transparent 42%),
                linear-gradient(#17140d, #080806);
        }

        .mobile-card {
            width: min(520px, 100%);
            margin: 0 auto;
            padding: 20px 16px;
            background: rgba(15, 15, 13, 0.95);
            border: 1px solid rgba(245, 214, 110, 0.5);
            border-radius: 22px;
        }

        .mobile-card h1 {
            margin: 0;
            color: #f7dc82;
            font-family: Georgia, serif;
            font-size: 30px;
            text-align: center;
        }

        .mobile-card p {
            margin: 8px 0 18px;
            color: #eee5c9;
            text-align: center;
        }

        .mobile-options {
            display: grid;
            gap: 10px;
        }

        .mobile-options button {
            min-height: 64px;
            display: grid;
            grid-template-columns: 48px 1fr 24px;
            align-items: center;
            gap: 10px;
            padding: 9px 16px;
            color: #f7dc82;
            background: #25231d;
            border: 2px solid #695a31;
            border-radius: 14px;
            font-size: 21px;
            font-weight: 800;
            text-align: left;
        }

        .mobile-options button.active {
            color: #071007;
            background: #75ef4f;
            border-color: #c6ffb2;
            box-shadow: 0 0 20px rgba(78, 255, 73, 0.5);
        }

        .mobile-icon {
            font-size: 30px;
            text-align: center;
        }

        .mobile-continue {
            position: sticky;
            bottom: 12px;
            width: 100%;
            min-height: 58px;
            margin-top: 16px;
            color: #071007;
            background: #75ef4f;
            border: 2px solid #c6ffb2;
            border-radius: 999px;
            font-size: 20px;
            font-weight: 900;
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

    .hotspot-layer .decade-button {
        width: 14.25%;
        height: 12.1%;
        border-radius: 5px;
    }

    .hotspot-layer .decade-1950s,
    .hotspot-layer .decade-1960s,
    .hotspot-layer .decade-1970s,
    .hotspot-layer .decade-1980s {
        left: 5.7%;
    }

    .hotspot-layer .decade-1990s,
    .hotspot-layer .decade-2000s,
    .hotspot-layer .decade-2010s,
    .hotspot-layer .decade-2020s {
        left: 80.1%;
    }

    .hotspot-layer .decade-1950s,
    .hotspot-layer .decade-1990s {
        top: 15.4%;
    }

    .hotspot-layer .decade-1960s,
    .hotspot-layer .decade-2000s {
        top: 34.25%;
    }

    .hotspot-layer .decade-1970s,
    .hotspot-layer .decade-2010s {
        top: 53.25%;
    }

    .hotspot-layer .decade-1980s,
    .hotspot-layer .decade-2020s {
        top: 72.55%;
    }

</style>
