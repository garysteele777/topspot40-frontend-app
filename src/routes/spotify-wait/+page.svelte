<script lang="ts">
    import {page} from '$app/stores';

    type WaitLanguage = 'en' | 'es' | 'ptbr';
    let language: WaitLanguage = 'en';
    const copy: Record<WaitLanguage, {title: string; heading: string; message: string; logoAlt: string}> = {
        en: {title: 'TopSpot40 Auto Play', heading: 'AUTO PLAY', message: 'Spotify will start after the introduction.', logoAlt: 'TopSpot40'},
        es: {title: 'Reproducción automática de TopSpot40', heading: 'REPRODUCCIÓN AUTOMÁTICA', message: 'Spotify comenzará después de la introducción.', logoAlt: 'TopSpot40'},
        ptbr: {title: 'Reprodução automática do TopSpot40', heading: 'REPRODUÇÃO AUTOMÁTICA', message: 'O Spotify começará após a introdução.', logoAlt: 'TopSpot40'}
    };
    $: requestedLanguage = $page.url.searchParams.get('language');
    $: language = requestedLanguage === 'es' ? 'es' : requestedLanguage === 'ptbr' || requestedLanguage === 'pt-BR' ? 'ptbr' : 'en';
    $: text = copy[language];
</script>

<svelte:head>
    <title>{text.title}</title>
</svelte:head>

<div class="spotify-wait">
    <img
            src="/docuseries/topspot_docuseries_logo.png"
            alt={text.logoAlt}
            class="logo"
    />

    <h1>{text.heading}</h1>

    <p>{text.message}</p>

    <div class="waiting-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
    </div>
</div>

<style>
    .spotify-wait {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        box-sizing: border-box;
        background: #050505;
        color: white;
        text-align: center;
        font-family: Arial, Helvetica, sans-serif;
    }

    .logo {
        width: min(420px, 75vw);
        height: auto;
        margin-bottom: 2rem;
    }

    h1 {
        margin: 0;
        color: #22c55e;
        font-size: clamp(1.8rem, 5vw, 3rem);
        letter-spacing: 0.12em;
    }

    p {
        margin-top: 1rem;
        color: #e4c365;
        font-size: clamp(1rem, 2.5vw, 1.35rem);
    }

    .waiting-dots {
        display: flex;
        gap: 0.55rem;
        margin-top: 1.5rem;
    }

    .waiting-dots span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #22c55e;
        animation: pulse 1.2s infinite ease-in-out;
    }

    .waiting-dots span:nth-child(2) {
        animation-delay: 0.2s;
    }

    .waiting-dots span:nth-child(3) {
        animation-delay: 0.4s;
    }

    @keyframes pulse {
        0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
        }

        40% {
            opacity: 1;
            transform: scale(1.2);
        }
    }
</style>
