<script lang="ts">
    import {afterNavigate, goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import CollectionsJourneyShell from '$lib/components/journey/CollectionsJourneyShell.svelte';
    import CollectionGroupPreview from '$lib/components/journey/CollectionGroupPreview.svelte';
    import {loadCollectionsJourneyCatalog} from '$lib/collections/catalogAdapter';
    import type {JourneyCollectionGroup} from '$lib/collections/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let groups: JourneyCollectionGroup[] = [];
    let selectedGroup: JourneyCollectionGroup | null = null;
    let loading = true;
    let errorMessage: string | null = null;
    let invalidGroupSlug: string | null = null;

    const text = {
        en: {
            title: 'Choose a Collection Group',
            instruction: 'Select a musical theme, preview its collections, and continue your journey.',
            back: 'Back', home: 'Home', explore: 'Explore', groups: 'Collection Groups',
            loading: 'Loading collection groups…', empty: 'No collection groups are currently available.',
            error: 'We could not load the Collections library.', invalid: 'That collection group is not available.',
            showGroups: 'Show available groups'
        },
        es: {
            title: 'Elige un grupo de colecciones',
            instruction: 'Selecciona un tema musical, descubre sus colecciones y continúa tu viaje.',
            back: 'Atrás', home: 'Inicio', explore: 'Explorar', groups: 'Grupos de colecciones',
            loading: 'Cargando grupos de colecciones…', empty: 'No hay grupos de colecciones disponibles.',
            error: 'No pudimos cargar la biblioteca de Colecciones.', invalid: 'Ese grupo de colecciones no está disponible.',
            showGroups: 'Mostrar grupos disponibles'
        },
        ptbr: {
            title: 'Escolha um grupo de coleções',
            instruction: 'Selecione um tema musical, conheça suas coleções e continue sua jornada.',
            back: 'Voltar', home: 'Início', explore: 'Explorar', groups: 'Grupos de coleções',
            loading: 'Carregando grupos de coleções…', empty: 'Nenhum grupo de coleções está disponível.',
            error: 'Não foi possível carregar a biblioteca de Coleções.', invalid: 'Esse grupo de coleções não está disponível.',
            showGroups: 'Mostrar grupos disponíveis'
        }
    };

    function readLanguage(): Language {
        const saved = localStorage.getItem('topspot_language');
        return saved === 'es' || saved === 'ptbr' ? saved : 'en';
    }

    function synchronizeSelection(url: URL, replaceMissing = false) {
        if (loading || groups.length === 0) return;

        const requestedSlug = url.searchParams.get('group');

        if (!requestedSlug) {
            selectedGroup = groups[0];
            invalidGroupSlug = null;

            if (replaceMissing) {
                const next = new URL(url);
                next.searchParams.set('group', selectedGroup.slug);
                void goto(`${next.pathname}${next.search}`, {replaceState: true, noScroll: true});
            }
            return;
        }

        const match = groups.find((group) => group.slug === requestedSlug) ?? null;
        selectedGroup = match;
        invalidGroupSlug = match ? null : requestedSlug;
    }

    function selectGroup(group: JourneyCollectionGroup) {
        const url = new URL(window.location.href);
        url.searchParams.set('group', group.slug);
        void goto(`${url.pathname}${url.search}`, {keepFocus: true, noScroll: true});
    }

    function resetGroupSelection() {
        if (!groups[0]) return;
        selectGroup(groups[0]);
    }

    afterNavigate(({to}) => {
        if (to) synchronizeSelection(to.url);
    });

    onMount(async () => {
        language = readLanguage();

        try {
            groups = await loadCollectionsJourneyCatalog();
        } catch (error) {
            console.error('Failed to load Collections journey catalog:', error);
            errorMessage = text[language].error;
        } finally {
            loading = false;
        }

        synchronizeSelection(new URL(window.location.href), true);
    });

    $: accent = selectedGroup?.presentation.accent ?? '#75ef4f';
</script>

<svelte:head>
    <title>{text[language].title} | TopSpot40</title>
    <meta name="description" content="Explore TopSpot40 Collections Programs by collection group."/>
</svelte:head>

<CollectionsJourneyShell
    {language}
    title={text[language].title}
    instruction={text[language].instruction}
    backHref="/journey-prototype/choose"
    backLabel={text[language].back}
    homeLabel={text[language].home}
    {accent}
>
    {#if loading}
        <div class="state" aria-live="polite">{text[language].loading}</div>
    {:else if errorMessage}
        <div class="state error" role="alert">{errorMessage}</div>
    {:else if groups.length === 0}
        <div class="state">{text[language].empty}</div>
    {:else if invalidGroupSlug}
        <div class="state invalid" role="alert">
            <h2>{text[language].invalid}</h2>
            <p><code>{invalidGroupSlug}</code></p>
            <button type="button" on:click={resetGroupSelection}>{text[language].showGroups}</button>
        </div>
    {:else if selectedGroup}
        <div class="browser-layout">
            <section class="group-picker" aria-labelledby="collection-groups-heading">
                <h2 id="collection-groups-heading">{text[language].groups}</h2>
                <div class="group-buttons">
                    {#each groups as group (group.slug)}
                        <button
                            type="button"
                            class:active={group.slug === selectedGroup.slug}
                            aria-pressed={group.slug === selectedGroup.slug}
                            on:click={() => selectGroup(group)}
                        >
                            <span aria-hidden="true">{group.presentation.icon}</span>
                            <span>{group.name}</span>
                            <small>{group.items.length}</small>
                        </button>
                    {/each}
                </div>
            </section>

            <CollectionGroupPreview
                group={selectedGroup}
                {language}
                exploreLabel={text[language].explore}
            />
        </div>
    {/if}
</CollectionsJourneyShell>

<style>
    .browser-layout {
        display: grid;
        grid-template-columns: minmax(250px, 0.72fr) minmax(0, 1.6fr);
        gap: clamp(20px, 3vw, 34px);
        align-items: stretch;
    }

    .group-picker h2 {
        margin: 0 0 14px;
        color: #f7dc82;
        font-family: Georgia, serif;
        font-size: 24px;
    }

    .group-buttons {
        display: grid;
        gap: 8px;
    }

    .group-buttons button {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        width: 100%;
        padding: 11px 12px;
        color: #fff;
        background: rgba(36, 36, 36, 0.92);
        border: 1px solid rgba(214, 193, 122, 0.32);
        border-radius: 11px;
        text-align: left;
        cursor: pointer;
    }

    .group-buttons button:hover,
    .group-buttons button:focus-visible,
    .group-buttons button.active {
        color: #101010;
        background: #d6c17a;
        border-color: #f7dc82;
        outline: none;
    }

    .group-buttons small {
        display: grid;
        min-width: 28px;
        min-height: 28px;
        place-items: center;
        color: inherit;
        background: rgba(0, 0, 0, 0.18);
        border-radius: 999px;
        font-weight: 900;
    }

    .state {
        padding: 46px 20px;
        text-align: center;
        color: #f4eedc;
        font-size: 18px;
    }

    .state h2 {
        color: #f7dc82;
    }

    .state button {
        padding: 11px 18px;
        color: #111;
        background: #75ef4f;
        border: 0;
        border-radius: 999px;
        font-weight: 900;
        cursor: pointer;
    }

    .error {
        color: #ffb4aa;
    }

    @media (min-width: 801px) and (min-height: 800px) {
        .browser-layout {
            gap: 24px;
        }

        .group-picker h2 {
            margin-bottom: 10px;
            font-size: 22px;
        }

        .group-buttons {
            gap: 6px;
        }

        .group-buttons button {
            padding: 8px 10px;
        }
    }
    @media (max-width: 800px) {
        .browser-layout {
            grid-template-columns: 1fr;
        }

        .group-buttons {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }

    @media (max-width: 520px) {
        .group-buttons {
            grid-template-columns: 1fr;
        }
    }
</style>

