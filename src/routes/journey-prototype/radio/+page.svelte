<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import InteractiveRadioPanel from '$lib/components/options-v2/InteractiveRadioPanel.svelte';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';
    import type {Language} from '$lib/types/playback';
    import {
        buildExperienceDestination,
        parseRadioExperience,
        type ExperienceFamily
    } from '$lib/journey/experienceMode';

    let family: ExperienceFamily | null = parseRadioExperience(page.url.searchParams);
    let desktopReady = false;
    let language: Language = 'en';
    const text = {
        en: {back: 'Back', title: 'TopSpot40 Radio'},
        es: {back: 'Atrás', title: 'Radio TopSpot40'},
        ptbr: {back: 'Voltar', title: 'Rádio TopSpot40'}
    };

    onMount(() => {
        language = readStoredLanguagePreference() ?? 'en';
        if (!family) {
            void goto('/journey-prototype/choose', {replaceState: true});
            return;
        }
        if (family === 'docuseries') {
            void goto(buildExperienceDestination('docuseries', 'program'), {replaceState: true});
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

<svelte:head><title>{text[language].title}</title></svelte:head>

{#if desktopReady && family === 'nostalgia'}
    <button class="back" type="button" on:click={backToChoose}>{text[language].back}</button>
    <InteractiveRadioPanel journeyLauncher={true} returnTo={buildExperienceDestination('nostalgia', 'radio')} {language}/>
    {:else if desktopReady && family}
        {#if family === 'collections'}
        <button class="back" type="button" on:click={backToChoose}>{text[language].back}</button>
            <InteractiveRadioPanel journeyLauncher={true} journeyFamily="collections" {language}/>
        {:else if family === 'artist'}
            <button class="back" type="button" on:click={backToChoose}>{text[language].back}</button>
            <InteractiveRadioPanel journeyLauncher={true} journeyFamily="artist_spotlight" {language}/>
    {/if}
{/if}

<style>
    .back { margin: 1rem; padding: .55rem .85rem; color: #211706; background: #f7dc82; border: 2px solid #fff0b0; border-radius: 999px; font-weight: 800; cursor: pointer; }
    .back:focus-visible { outline: 3px solid #75ef4f; outline-offset: 3px; }
</style>
