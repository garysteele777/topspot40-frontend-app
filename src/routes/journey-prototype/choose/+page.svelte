<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import ContactModal from '$lib/components/profile-components/ContactModal.svelte';

    type LandingLanguage = 'en' | 'es' | 'ptbr';
    type Destination = 'library' | 'radio' | 'journey' | 'preferences';

    let language: LandingLanguage = 'en';
    let destination: Destination | null = null;
    let showContactModal = false;

    const text = {
        en: {
            title: 'Choose Your TopSpot40 Experience',
            instruction: 'Select the road you would like to explore.',
            continue: 'Continue',
            back: 'Back',
            home: 'Home',
            contact: 'Contact Us',
            about: 'About',
            signIn: 'Sign In',
            signUp: 'Sign Up',
            library: 'TopSpot40 Listening Library',
            radio: 'Interactive Radio',
            journey: 'My TopSpot40 Music Journey',
            preferences: 'Playback Preferences'
        },
        es: {
            title: 'Elige tu experiencia TopSpot40',
            instruction: 'Selecciona el camino que deseas explorar.',
            continue: 'Continuar',
            back: 'Atrás',
            home: 'Inicio',
            contact: 'Contáctanos',
            about: 'Acerca de',
            signIn: 'Iniciar sesión',
            signUp: 'Registrarse',
            library: 'Biblioteca musical TopSpot40',
            radio: 'Radio interactiva',
            journey: 'Mi viaje musical TopSpot40',
            preferences: 'Preferencias de reproducción'
        },
        ptbr: {
            title: 'Escolha sua experiência TopSpot40',
            instruction: 'Selecione o caminho que deseja explorar.',
            continue: 'Continuar',
            back: 'Voltar',
            home: 'Início',
            contact: 'Fale conosco',
            about: 'Sobre',
            signIn: 'Entrar',
            signUp: 'Cadastrar',
            library: 'Biblioteca musical TopSpot40',
            radio: 'Rádio interativa',
            journey: 'Minha jornada musical TopSpot40',
            preferences: 'Preferências de reprodução'
        }
    };

    const routes: Record<Destination, string> = {
        library: '/journey-prototype/decade',
        radio: '/options-v4',
        journey: '/options-v4',
        preferences: '/options-v4'
    };

    function chooseDestination(value: Destination) {
        destination = value;
        localStorage.setItem('topspot_journey_destination', value);
    }

    function continueJourney() {
        if (destination) {
            goto(routes[destination]);
        }
    }

    function openContactModal() {
        showContactModal = true;
    }

    function closeContactModal() {
        showContactModal = false;
    }

    onMount(() => {
        const savedLanguage = localStorage.getItem('topspot_language');
        if (savedLanguage === 'en' || savedLanguage === 'es' || savedLanguage === 'ptbr') {
            language = savedLanguage;
        }
    });
</script>

<svelte:head>
    <title>Choose Your TopSpot40 Experience</title>
    <meta
        name="description"
        content="Choose the next road in your TopSpot40 musical journey."
    />
</svelte:head>

<div class="prototype">
    <header class="topbar">
        <a class="brand" href="/" aria-label="TopSpot40 home">
            <img src="/old-dog-icon.png" alt="" />
            <span>TopSpot<span class="brand-number">40</span></span>
        </a>

        <nav aria-label="TopSpot40 navigation">
            <a href="/" on:click|preventDefault={openContactModal}>{text[language].contact}</a>
            <a href="/about">{text[language].about}</a>
            <a href="/signin">{text[language].signIn}</a>
            <a class="signup" href="/signup-official">{text[language].signUp}</a>
        </nav>
    </header>

    <div class="utilitybar">
        <a class="utility" href="/journey-prototype">
            <span aria-hidden="true">←</span>
            {text[language].back}
        </a>
        <a class="utility" href="/">
            <span aria-hidden="true">⌂</span>
            {text[language].home}
        </a>
    </div>

    <main class="journey">
        <div class="art-layer">
<img
            class="journey-art"
            src="/images/journey/03-ai-listening-library-road.png"
            alt="Four glowing musical roads leading toward TopSpot40 destinations"
        />
        <div class="shade" aria-hidden="true"></div>
</div>

        <section class="journey-title">
            <h1>{text[language].title}</h1>
            <p>{text[language].instruction}</p>
        </section>

        <div class="hotspot-layer">
{#each (['library', 'radio', 'journey', 'preferences'] as Destination[]) as choice}
            <button
                class="destination-button destination-{choice}"
                class:active={destination === choice}
                aria-label={text[language][choice]}
                aria-pressed={destination === choice}
                on:click={() => chooseDestination(choice)}
            >
                <span class="screen-reader-only">{text[language][choice]}</span>
            </button>
        {/each}
</div>

        {#if destination}
            <button class="continue" on:click={continueJourney}>
                {text[language].continue}
                <span aria-hidden="true">→</span>
            </button>
        {/if}
    </main>
</div>

<div class="contact-modal-host">
    <ContactModal visible={showContactModal} onClose={closeContactModal} />
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

    .contact-modal-host {
        position: relative;
        z-index: 10000;
    }

    .topbar {
        position: relative;
        z-index: 20;
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 10px clamp(18px, 4vw, 64px);
        background: rgba(5, 5, 5, 0.94);
        border-bottom: 1px solid rgba(214, 193, 122, 0.38);
    }

    .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        color: #f5d66e;
        font-size: clamp(22px, 2vw, 32px);
        font-weight: 900;
        text-decoration: none;
    }

    .brand img {
        width: 46px;
        height: 46px;
        border-radius: 10px;
    }

    .brand-number {
        color: #e54a2e;
    }

    nav {
        display: flex;
        align-items: center;
        gap: clamp(14px, 2vw, 34px);
    }

    nav a {
        color: #fff;
        text-decoration: none;
        white-space: nowrap;
    }

    nav a:hover,
    nav a:focus-visible {
        color: #f5d66e;
    }

    nav .signup {
        padding: 10px 22px;
        color: #f5d66e;
        border: 2px solid #d9aa28;
        border-radius: 12px;
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
        background:
            linear-gradient(
                to bottom,
                rgba(0, 0, 0, 0.24),
                transparent 28%,
                transparent 78%,
                rgba(0, 0, 0, 0.48)
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
    }

    .journey-title p {
        margin: 10px 0 0;
        font-size: clamp(16px, 1.4vw, 22px);
        font-weight: 700;
    }

    .destination-button {
        position: absolute;
        z-index: 6;
        top: 34%;
        width: 12%;
        height: 13%;
        padding: 0;
        border: 3px solid transparent;
        border-radius: 22px;
        background: transparent;
        transition:
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
    }

    .destination-button:hover,
    .destination-button:focus-visible,
    .destination-button.active {
        outline: none;
        border-color: #7cff54;
        background: rgba(29, 185, 84, 0.1);
        box-shadow:
            0 0 18px #55ff3c,
            0 0 48px rgba(55, 255, 56, 0.75),
            inset 0 0 30px rgba(55, 255, 56, 0.24);
    }

    .destination-library {
        left: 14.2%;
    }

    .destination-radio {
        left: 30.4%;
    }

    .destination-journey {
        left: 55.8%;
    }

    .destination-preferences {
        left: 70.7%;
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

    @media (max-width: 820px) {
        .topbar {
            min-height: 62px;
        }

        nav a:not(.signup) {
            display: none;
        }

        .brand {
            font-size: 22px;
        }

        .brand img {
            width: 38px;
            height: 38px;
        }

        .journey {
            min-height: calc(100vh - 62px);
        }

        .utilitybar {
            top: 74px;
        }

        .journey-title {
            top: 12%;
        }

        .destination-button {
            top: 34%;
            width: 22%;
            height: 14%;
        }

        .destination-library {
            left: 1%;
        }

        .destination-radio {
            left: 26%;
        }

        .destination-journey {
            left: 51%;
        }

        .destination-preferences {
            left: 76%;
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

    .hotspot-layer .destination-button {
        top: 39.15%;
        height: 9.55%;
        border-radius: 5px;
    }

    .hotspot-layer .destination-library {
        left: 13.35%;
        width: 13.85%;
    }

    .hotspot-layer .destination-radio {
        left: 29.75%;
        width: 13.1%;
    }

    .hotspot-layer .destination-journey {
        left: 55.4%;
        width: 12.65%;
    }

    .hotspot-layer .destination-preferences {
        left: 70.4%;
        width: 12.65%;
    }

    @media (max-width: 820px) {
        .art-layer,
        .hotspot-layer {
            width: max(100%, calc((100vh - 62px) * 1.780618));
        }

        .hotspot-layer .destination-button {
            top: 39.15%;
            height: 9.55%;
        }

        .hotspot-layer .destination-library {
            left: 13.35%;
            width: 13.85%;
        }

        .hotspot-layer .destination-radio {
            left: 29.75%;
            width: 13.1%;
        }

        .hotspot-layer .destination-journey {
            left: 55.4%;
            width: 12.65%;
        }

        .hotspot-layer .destination-preferences {
            left: 70.4%;
            width: 12.65%;
        }
    }

</style>
