<svelte:head>
    <title>TopSpot40 Auto Play</title>
</svelte:head>

<div class="spotify-wait">
    <img
            src="/docuseries/topspot_docuseries_logo.png"
            alt="TopSpot40"
            class="logo"
    />

    <h1>AUTO PLAY</h1>

    <p>Spotify will start after the introduction.</p>

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