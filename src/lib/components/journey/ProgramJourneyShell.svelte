<script lang="ts">
    import PublicJourneyHeader from '$lib/components/journey/PublicJourneyHeader.svelte';
    import type {Language} from '$lib/types/playback';

    export let language: Language = 'en';
    export let title: string;
    export let instruction: string;
    export let backHref: string;
    export let artwork: string;
    export let artworkAlt: string;
    export let backLabel = 'Back';
    export let accent = '#75ef4f';
</script>

<div class="prototype" style={`--journey-accent: ${accent}`}>
    <PublicJourneyHeader {language}/>

    <main class="journey-page">
        <img class="journey-art" src={artwork} alt={artworkAlt}/>
        <div class="shade" aria-hidden="true"></div>

        <nav class="utilitybar" aria-label="Journey navigation">
            <a class="utility" href={backHref}>
                <span aria-hidden="true">←</span>{backLabel}
            </a>
        </nav>

        <section class="journey-title">
            <h1>{title}</h1>
            <p>{instruction}</p>
        </section>

        <section class="content-card">
            <slot/>
        </section>
    </main>
</div>

<style>
    :global(html), :global(body) {
        margin: 0;
        min-height: 100%;
        background: #090705;
        color: #fff;
        font-family: Arial, sans-serif;
    }

    :global(*) {
        box-sizing: border-box;
    }

    :global(button), :global(a) {
        font: inherit;
    }

    .prototype {
        min-height: 100vh;
        background: #090705;
    }

    .journey-page {
        position: relative;
        min-height: calc(100vh - 72px);
        padding: 150px clamp(18px, 4vw, 64px) 56px;
        overflow: hidden;
        isolation: isolate;
    }

    .journey-art, .shade {
        position: fixed;
        z-index: -2;
        inset: 72px 0 0;
        width: 100%;
        height: calc(100vh - 72px);
    }

    .journey-art {
        object-fit: cover;
        object-position: center;
    }

    .shade {
        z-index: -1;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.58), rgba(0, 0, 0, 0.82)), radial-gradient(circle at 50% 30%, transparent, rgba(0, 0, 0, 0.55));
    }

    .utilitybar {
        position: absolute;
        z-index: 10;
        top: 20px;
        left: clamp(18px, 3vw, 48px);
        display: flex;
        gap: 12px;
    }

    .utility {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 10px 16px;
        color: #fff;
        background: rgba(8, 6, 3, 0.82);
        border: 1px solid rgba(235, 193, 83, 0.62);
        border-radius: 14px;
        text-decoration: none;
        font-weight: 700;
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.55);
    }

    .utility:hover, .utility:focus-visible {
        color: #111;
        background: #f7dc82;
        outline: none;
    }

    .journey-title {
        width: min(1000px, 94vw);
        margin: 0 auto 26px;
        text-align: center;
        text-shadow: 0 3px 12px #000, 0 0 30px #000;
    }

    .journey-title h1 {
        margin: 0;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: clamp(32px, 4vw, 58px);
        line-height: 1.05;
    }

    .journey-title p {
        margin: 10px 0 0;
        font-size: clamp(16px, 1.5vw, 21px);
        font-weight: 700;
    }

    .content-card {
        width: min(1120px, 100%);
        margin: 0 auto;
        padding: clamp(20px, 3vw, 36px);
        background: rgba(13, 11, 8, 0.92);
        border: 1px solid color-mix(in srgb, var(--journey-accent) 55%, transparent);
        border-radius: 24px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.62);
        backdrop-filter: blur(10px);
    }

    @media (min-width: 821px) and (min-height: 800px) {
        .journey-page {
            padding-top: 108px;
            padding-bottom: 28px;
        }

        .journey-title {
            margin-bottom: 16px;
        }

        .journey-title h1 {
            font-size: clamp(32px, 3.2vw, 48px);
        }

        .journey-title p {
            margin-top: 7px;
        }

        .content-card {
            padding: 24px;
        }
    }

    @media (max-width: 820px) {
        .journey-page {
            min-height: calc(100vh - 62px);
            padding: 128px 14px 30px;
        }

        .journey-art, .shade {
            inset: 62px 0 0;
            height: calc(100vh - 62px);
        }

        .utilitybar {
            top: 14px;
        }

        .utility {
            min-height: 44px;
            padding: 8px 12px;
        }

        .content-card {
            padding: 18px;
            border-radius: 18px;
        }
    }
</style>
