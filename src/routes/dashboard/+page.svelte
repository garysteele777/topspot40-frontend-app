<script lang="ts">
    import { goto } from '$app/navigation';
    import { SlidersHorizontal } from 'lucide-svelte';

    type DashboardData = {
        user: {
            display_name?: string | null;
        } | null;
    };

    export let data: DashboardData;

    $: displayName = data?.user?.display_name?.trim();
    $: firstName = displayName?.split(/\s+/)[0];

    function chooseExperience() {
        goto('/journey-prototype/choose');
    }
</script>

<div class="dashboard-wrapper">
    <main class="dashboard">
        <section class="home">
            <p class="eyebrow">TopSpot40</p>

            <h1>
                {firstName
                    ? `Welcome back, ${firstName}`
                    : 'Welcome back to TopSpot40'}
            </h1>

            <p class="tagline">
                Your music. Your memories. Your station.
            </p>

            <button
                class="control-center-button"
                on:click={chooseExperience}
            >
                <SlidersHorizontal size={21} strokeWidth={1.8} />
                Choose Your Experience
            </button>

            <p class="supporting-copy">
                Choose from Nostalgia Programs, Collections, Artist Spotlights,
                and Music Docuseries.
            </p>
        </section>
    </main>
</div>

<style>
    :global(body) {
        margin: 0;
        background: #0c0d0d;
    }

    .dashboard-wrapper {
        min-height: 100vh;
        background:
            radial-gradient(
                circle at 50% 10%,
                rgba(29, 185, 84, 0.12),
                transparent 32rem
            ),
            #0c0d0d;
        color: #f5f5f5;
    }

    .dashboard {
        width: min(960px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 6rem 0;
    }

    .home {
        display: flex;
        min-height: 56vh;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    .eyebrow {
        margin: 0 0 0.75rem;
        color: #7dd99b;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
    }

    h1 {
        margin: 0;
        font-size: clamp(2.5rem, 7vw, 4.75rem);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.04em;
    }

    .tagline {
        margin: 1rem 0 2rem;
        color: #b5b8b6;
        font-size: clamp(1rem, 2.5vw, 1.25rem);
    }

    .control-center-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        min-height: 52px;
        padding: 0.85rem 1.4rem;
        border: 0;
        border-radius: 9px;
        background: #1db954;
        color: #07140c;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }

    .control-center-button:hover {
        background: #27c861;
    }

    .supporting-copy {
        max-width: 520px;
        margin: 1.4rem 0 0;
        color: #8f9391;
        font-size: 0.95rem;
        line-height: 1.6;
    }

    @media (max-width: 640px) {
        .dashboard {
            padding: 3.5rem 0;
        }

        .home {
            min-height: 50vh;
        }

        .control-center-button {
            width: 100%;
            max-width: 320px;
        }
    }
</style>