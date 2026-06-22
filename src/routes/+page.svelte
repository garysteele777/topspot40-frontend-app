<script lang="ts">
    import {goto} from '$app/navigation';

    let language = 'en';

    function setLanguage(value: string) {
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
</script>

<main class="page">
    <section class="card">
        <img src="/favicon.ico" alt="TopSpot40" class="logo"/>

        <h1>TopSpot40</h1>
        <p class="tagline">Your music. Your memories. Your station.</p>

        <div class="language">
            <div class="label">Choose Language</div>

            <div class="language-buttons">
                <button class:active={language === 'en'} on:click={() => setLanguage('en')}>
                    English
                </button>

                <button class:active={language === 'es'} on:click={() => setLanguage('es')}>
                    Español
                </button>

                <button class:active={language === 'pt-BR'} on:click={() => setLanguage('pt-BR')}>
                    Português
                </button>
            </div>
        </div>

        <div class="choices">
            <button class="choice" on:click={discover}>
                <span>Discover TopSpot40</span>
                <small>Explore stories, artists, collections, and music history.</small>
            </button>

            <button class="choice" on:click={controlPanel}>
                <span>Main Control Panel</span>
                <small>Start listening, radio, playlists, favorites, and playback settings.</small>
            </button>
        </div>

        <a class="classic" href="/landing-classic">View classic landing page</a>
    </section>
</main>

<style>
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
        margin-bottom: 34px;
    }

    .language {
        margin-bottom: 34px;
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

    .classic {
        display: inline-block;
        margin-top: 28px;
        color: #bbb;
        text-decoration: none;
        font-size: 14px;
    }

    .classic:hover {
        color: white;
        text-decoration: underline;
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