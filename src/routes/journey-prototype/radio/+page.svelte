<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import InteractiveRadioPanel from '$lib/components/options-v2/InteractiveRadioPanel.svelte';
    import {
        buildExperienceDestination,
        parseRadioExperience,
        type ExperienceFamily
    } from '$lib/journey/experienceMode';

    let family: ExperienceFamily | null = parseRadioExperience(page.url.searchParams);
    let desktopReady = false;

    onMount(() => {
        if (!family) {
            void goto('/journey-prototype/choose', {replaceState: true});
            return;
        }

        const desktopQuery = window.matchMedia('(min-width: 1200px) and (min-height: 650px)');
        if (!desktopQuery.matches) {
            void goto(buildExperienceDestination(family, 'program'), {replaceState: true});
            return;
        }
        desktopReady = true;
    });

    function backToChoose(): void {
        void goto('/journey-prototype/choose');
    }
</script>

<svelte:head><title>{family ? `${family} Radio` : 'TopSpot40 Radio'}</title></svelte:head>

{#if desktopReady && family === 'nostalgia'}
    <button class="back" type="button" on:click={backToChoose}>Back</button>
    <InteractiveRadioPanel journeyLauncher={true} returnTo={buildExperienceDestination('nostalgia', 'radio')}/>
    {:else if desktopReady && family}
        {#if family === 'collections'}
        <button class="back" type="button" on:click={backToChoose}>Back</button>
            <InteractiveRadioPanel journeyLauncher={true} journeyFamily="collections"/>
        {:else if family === 'artist'}
            <button class="back" type="button" on:click={backToChoose}>Back</button>
            <InteractiveRadioPanel journeyLauncher={true} journeyFamily="artist_spotlight"/>
        {:else}
        <main class="handoff-shell">
            <button class="back" type="button" on:click={backToChoose}>Back</button>
            <h1>Music Docuseries Radio</h1>
        </main>
    {/if}
{/if}

<style>
    .back { margin: 1rem; padding: .55rem .85rem; color: #211706; background: #f7dc82; border: 2px solid #fff0b0; border-radius: 999px; font-weight: 800; cursor: pointer; }
    .back:focus-visible { outline: 3px solid #75ef4f; outline-offset: 3px; }
    .handoff-shell { max-width: 900px; margin: 3rem auto; padding: 2rem; color: #f5f5f5; background: #121212; border: 1px solid #cfb87c; border-radius: 14px; }
</style>
