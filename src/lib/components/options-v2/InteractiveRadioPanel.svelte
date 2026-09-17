<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {get} from 'svelte/store';
    import {goto} from '$app/navigation';
    import {dev} from '$app/environment';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import type {Language, ModeType, VoicePart} from '$lib/types/playback';
    import NostalgiaRadioGenreSelection from './NostalgiaRadioGenreSelection.svelte';
    import {
        NOSTALGIA_RADIO_GENRES,
        normalizeNostalgiaRadioGenres,
        type NostalgiaRadioGenreSlug
    } from '$lib/journey/nostalgiaRadioGenres';

    export let journeyLauncher = false;
    export let returnTo = '';

    type OptionItem = {id: string; label: string};
    type CollectionGroup = {name: string; slug: string};
    type RadioMode = 'nostalgia' | 'collections' | 'artist_spotlight';

    let isDesktop = false;
    let loading = false;
    let radioMode: RadioMode = 'nostalgia';
    let genreOptions: OptionItem[] = [];
    let collectionGroups: CollectionGroup[] = [];
    let desktopQuery: MediaQueryList | null = null;
    let selectedNostalgiaGenres: NostalgiaRadioGenreSlug[] = [...NOSTALGIA_RADIO_GENRES];

    const language: Language = 'en';
    const languages: Language[] = ['en'];
    function updateDesktopCapability(): void {
        isDesktop = desktopQuery?.matches ?? false;
        if (isDesktop && !loading && genreOptions.length === 0) void loadStations();
    }

    function optionFrom(value: unknown): OptionItem | null {
        if (!value || typeof value !== 'object') return null;
        const record = value as Record<string, unknown>;
        const id = record.slug ?? record.id ?? record.value ?? record.key;
        const label = record.label ?? record.name ?? id;
        return typeof id === 'string' && typeof label === 'string' ? {id, label} : null;
    }

    async function loadStations(): Promise<void> {
        if (!isDesktop || loading) return;
        loading = true;
        try {
            const catalog = await loadCatalogOnce();
            genreOptions = (Array.isArray(catalog.genres) ? catalog.genres : [])
                .map(optionFrom)
                .filter((item): item is OptionItem => item !== null);
            collectionGroups = (catalog.collectionGroups ?? []).map(group => ({name: group.name, slug: group.slug}));
        } finally {
            loading = false;
        }
    }

    function launch(
        mode: RadioMode,
        station = 'ALL',
        requestedGenres: readonly NostalgiaRadioGenreSlug[] | null = null
    ): void {
        if (!isDesktop || (!dev && !journeyLauncher)) return;
        const settings = get(playbackSettingsStore);
        const voices: VoicePart[] = settings.voices;
        const common = new URLSearchParams({language, languages: languages.join(','), voices: voices.join(','), playbackOrder: 'shuffle', voicePlayMode: 'before', pauseMode: 'continuous', skipPlayed: 'true', interactiveRadioTest: 'true'});
        playbackSettingsStore.update(current => ({...current, playbackMethod: 'automatic', playbackOrder: 'shuffle', pauseMode: 'continuous', skipPlayed: true}));

        if (mode === 'nostalgia') {
            const selectedGenres = requestedGenres
                ? normalizeNostalgiaRadioGenres(requestedGenres)
                : null;
            const genre = selectedGenres?.length === 1 ? selectedGenres[0] : station;
            saveResumeFromLocal({activeGroup: 'decade_genre' as ModeType, context: {decade: 'ALL', genre, radioGenres: selectedGenres?.join(',') ?? ''}, language, languages, startRank: 1, endRank: 9999, playbackOrder: 'shuffle', pauseMode: 'continuous', voices, skipPlayed: true});
            common.set('mode', 'nostalgia'); common.set('decade', 'ALL'); common.set('genre', genre);
            if (selectedGenres) common.set('genres', selectedGenres.join(','));
        } else if (mode === 'collections') {
            saveResumeFromLocal({activeGroup: 'collection' as ModeType, context: {collection_group_slug: station}, language, languages, startRank: 1, endRank: 9999, playbackOrder: 'shuffle', pauseMode: 'continuous', voices, skipPlayed: true});
            common.set('mode', 'radio_collections'); common.set('collection_group', station);
        } else {
            common.set('mode', 'artist_radio'); common.set('genre', station);
        }
        if (returnTo) common.set('radioReturnTo', returnTo);
        void goto(`/car-page?${common.toString()}`);
    }

    onMount(() => {
        desktopQuery = window.matchMedia('(min-width: 1200px)');
        updateDesktopCapability();
        desktopQuery.addEventListener('change', updateDesktopCapability);
    });
    onDestroy(() => desktopQuery?.removeEventListener('change', updateDesktopCapability));
</script>

<section class="radio-panel" class:journey-launcher={journeyLauncher} aria-labelledby="interactive-radio-heading">
    {#if journeyLauncher}
        {#if isDesktop}
            <NostalgiaRadioGenreSelection bind:selectedGenres={selectedNostalgiaGenres} onContinue={(genres) => launch('nostalgia', 'ALL', genres)}/>
        {/if}
    {:else}
    <h1 id="interactive-radio-heading">Interactive Radio — Private Test</h1>
    {#if !dev}
        <p>This private test is available only from a local development server.</p>
    {:else if !isDesktop}
        <p>Interactive Radio testing requires a desktop computer.</p>
    {:else}
        <p class="description">Cross-decade stations play in Drive-In View with Auto Play.</p>
        {#if !journeyLauncher}
        <div class="modes" aria-label="Radio categories">
            <button class:active={radioMode === 'nostalgia'} on:click={() => radioMode = 'nostalgia'}>Nostalgia</button>
            <button class:active={radioMode === 'collections'} on:click={() => radioMode = 'collections'}>Collections</button>
            <button class:active={radioMode === 'artist_spotlight'} on:click={() => radioMode = 'artist_spotlight'}>Artist Spotlight</button>
        </div>
        {/if}
        {#if loading}
            <p>Loading stations…</p>
        {:else if radioMode === 'nostalgia'}
            <button class="start" on:click={() => launch('nostalgia')}>Start All Decades & Genres</button>
            <div class="stations">{#each genreOptions as genre}<button on:click={() => launch('nostalgia', genre.id)}>{genre.label}</button>{/each}</div>
        {:else if radioMode === 'collections'}
            <button class="start" on:click={() => launch('collections')}>Start All Collections</button>
            <div class="stations">{#each collectionGroups as group}<button on:click={() => launch('collections', group.slug)}>{group.name}</button>{/each}</div>
        {:else}
            <button class="start" on:click={() => launch('artist_spotlight')}>Start All Artist Genres</button>
            <div class="stations">{#each genreOptions.filter(genre => genre.id !== 'tv_themes') as genre}<button on:click={() => launch('artist_spotlight', genre.id)}>{genre.label}</button>{/each}</div>
        {/if}
    {/if}
    {/if}
</section>

<style>
    .radio-panel { max-width: 900px; margin: 3rem auto; padding: 2rem; color: #f5f5f5; background: #121212; border: 1px solid #cfb87c; border-radius: 14px; }
    .radio-panel.journey-launcher { max-width: none; min-height: calc(100vh - 72px); margin: 0; padding: 0; border: 0; border-radius: 0; background: #0b0a07; }
    h1 { color: #cfb87c; margin-top: 0; }.description { color: #ccc; }
    .modes, .stations { display: flex; flex-wrap: wrap; gap: .6rem; margin: 1rem 0; }
    button { cursor: pointer; padding: .55rem .85rem; border: 1px solid #665b3c; border-radius: 999px; color: #eee; background: #292929; }
    button.active, .start { color: #111; background: #cfb87c; border-color: #cfb87c; font-weight: 700; }
</style>
