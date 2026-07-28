<script lang="ts">
    import {goto} from '$app/navigation';
    import {onMount} from 'svelte';

    type LandingLanguage = 'en' | 'es' | 'ptbr';

    let language: LandingLanguage = 'en';

    const text = {
        en: {
            tagline: 'Your music. Your memories. Your station.',
            choose: 'Choose Language',
            discoverTitle: 'Discover TopSpot40',
            discoverDesc: 'Explore stories, artists, collections, and music history.',
            controlTitle: 'Main Control Panel',
            controlDesc: 'Start listening, radio, playlists, favorites, and playback settings.',
            journeyView: 'Journey View'
        },
        es: {
            tagline: 'Tu música. Tus recuerdos. Tu estación.',
            choose: 'Elige idioma',
            discoverTitle: 'Descubrir TopSpot40',
            discoverDesc: 'Explora historias, artistas, colecciones e historia musical.',
            controlTitle: 'Panel de Control Principal',
            controlDesc: 'Empieza a escuchar, radio, listas, favoritos y ajustes de reproducción.',
            journeyView: 'Vista de viaje'
        },
        'ptbr': {
            tagline: 'Sua música. Suas memórias. Sua estação.',
            choose: 'Escolha o idioma',
            discoverTitle: 'Descobrir TopSpot40',
            discoverDesc: 'Explore histórias, artistas, coleções e história da música.',
            controlTitle: 'Painel de Controle Principal',
            controlDesc: 'Comece a ouvir, rádio, playlists, favoritos e configurações de reprodução.',
            journeyView: 'Vista da jornada'
        }
    };

    const rotatingMessages = {
        en: [
            'Rediscover the songs. Remember the feeling.',
            'Every track has a story. We tell it.',
            'Music discovery through the decades.',
            'Your countdown companion.',
            'Where the beat meets the story.'
        ],
        es: [
            'Redescubre las canciones. Recuerda la emoción.',
            'Cada canción tiene una historia. Nosotros la contamos.',
            'Descubrimiento musical a través de las décadas.',
            'Tu compañero de cuenta regresiva.',
            'Donde el ritmo se encuentra con la historia.'
        ],
        'ptbr': [
            'Redescubra as músicas. Relembre a emoção.',
            'Cada faixa tem uma história. Nós contamos.',
            'Descoberta musical através das décadas.',
            'Seu companheiro de contagem regressiva.',
            'Onde a batida encontra a história.'
        ]
    };


    $: marqueeMessages = [
        ...rotatingMessages[language],
        ...rotatingMessages[language]
    ];

    function isLandingLanguage(value: string | null): value is LandingLanguage {
        return value === 'en' || value === 'es' || value === 'ptbr';
    }

    function setLanguage(value: LandingLanguage) {
        language = value;
        localStorage.setItem('topspot_language', value);
        localStorage.setItem('tts_language', value);
    }

    function discover() {
        setLanguage(language);
        window.location.href = '/catalog/index.html';
    }

    function controlPanel() {
        setLanguage(language);
        goto('/options-v4');
    }

    function showJourneyView() {
        localStorage.setItem('topspot_home_layout', 'journey');
        goto('/journey-prototype');
    }

    onMount(() => {
        const savedLayout = localStorage.getItem('topspot_home_layout');

        if (savedLayout !== 'compact') {
            localStorage.setItem('topspot_home_layout', 'journey');
            goto('/journey-prototype', {replaceState: true});
            return;
        }

        const savedLanguage = localStorage.getItem('topspot_language');

        if (isLandingLanguage(savedLanguage)) {
            language = savedLanguage;
        }

    });
</script>

<main class="page">
    <section class="card">
        <img src="/old-dog-icon.png" alt="TopSpot40" class="logo"/>

        <h1>TopSpot40</h1>
        <p class="tagline">{text[language].tagline}</p>

        <div class="message-marquee">
            <div class="message-track">
                {#each marqueeMessages as message}
                    <span>{message}</span>
                {/each}
            </div>
        </div>

        <div class="language">
            <div class="label">{text[language].choose}</div>

            <div class="language-buttons">
                <button class:active={language === 'en'} on:click={() => setLanguage('en')}>
                    English
                </button>

                <button class:active={language === 'es'} on:click={() => setLanguage('es')}>
                    Español
                </button>

                <button class:active={language === 'ptbr'} on:click={() => setLanguage('ptbr')}>
                    Português
                </button>
            </div>
        </div>

        <div class="choices">
            <button class="choice" on:click={discover}>
                <span>{text[language].discoverTitle}</span>
                <small>{text[language].discoverDesc}</small>
            </button>

            <button class="choice" on:click={controlPanel}>
                <span>{text[language].controlTitle}</span>
                <small>{text[language].controlDesc}</small>
            </button>
        </div>

        <button class="layout-switch" on:click={showJourneyView}>
            <span aria-hidden="true">✨</span>
            {text[language].journeyView}
        </button>
    </section>
</main>

<style>

    :global(html),
    :global(body) {
        overflow-x: hidden;
    }


    :global(body) {
        margin: 0;
        background: #101010;
        color: white;
        font-family: Arial, sans-serif;
    }

    .page {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: radial-gradient(circle at 30% 20%, #1db954 0%, transparent 35%),
        #101010;
    }

    .card {
        width: min(760px, 100%);
        background: rgba(18, 18, 18, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 28px;
        padding: 42px;
        text-align: center;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
        overflow: hidden;
    }

    .logo {
        width: 72px;
        height: 72px;
        margin-bottom: 18px;
    }

    h1 {
        font-size: 64px;
        margin: 0 0 10px;
    }

    .tagline {
        font-size: 22px;
        color: #d8f5e2;
        margin-bottom: 10px;
    }

    .message-marquee {
        width: 100%;
        overflow: hidden;
        margin: 10px 0 24px;
    }

    .message-track {
        display: inline-flex;
        width: max-content;
        gap: 48px;
        animation: messageScroll 28s linear infinite;
    }

    .message-track span {
        flex-shrink: 0;
        color: #d8f5e2;
        font-size: 1.05rem;
        font-weight: 600;
        opacity: 0.92;
    }

    @keyframes messageScroll {
        from {
            transform: translateX(0);
        }

        to {
            transform: translateX(-50%);
        }
    }

    .language {
        margin-bottom: 28px;
    }

    .label {
        color: #d6c17a;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        margin-bottom: 14px;
    }

    .language-buttons {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    button {
        cursor: pointer;
        border: 0;
        font: inherit;
    }

    .language-buttons button {
        padding: 10px 18px;
        border-radius: 999px;
        background: #2b2b2b;
        color: white;
        border: 1px solid #555;
        font-weight: 700;
    }

    .language-buttons button.active {
        background: #d6c17a;
        color: #111;
        border-color: #d6c17a;
    }

    .choices {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        margin-top: 12px;
    }

    .choice {
        min-height: 150px;
        border-radius: 22px;
        padding: 24px;
        background: #1db954;
        color: white;
        text-align: left;
        box-shadow: 0 12px 30px rgba(29, 185, 84, 0.25);
    }

    .choice:last-child {
        background: #d6c17a;
        color: #111;
    }

    .choice span {
        display: block;
        font-size: 26px;
        font-weight: 900;
        margin-bottom: 12px;
    }

    .choice small {
        display: block;
        font-size: 16px;
        line-height: 1.4;
        opacity: 0.9;
    }

    .layout-switch {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-top: 28px;
        padding: 10px 18px;
        color: #f5d66e;
        background: #242014;
        border: 1px solid #d6c17a;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 800;
    }

    .layout-switch:hover,
    .layout-switch:focus-visible {
        color: #111;
        background: #d6c17a;
        outline: none;
    }

    @media (max-width: 720px) {
        .choices {
            grid-template-columns: 1fr;
        }

        h1 {
            font-size: 46px;
        }

        .card {
            padding: 28px;
        }
    }
</style>