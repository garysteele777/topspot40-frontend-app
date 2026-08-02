<script lang="ts">
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import CollectionsJourneyShell from '$lib/components/journey/CollectionsJourneyShell.svelte';
    import CollectionCard from '$lib/components/journey/CollectionCard.svelte';
    import {
        findCollectionGroup,
        loadCollectionsJourneyCatalog
    } from '$lib/collections/catalogAdapter';
    import {localizedCollectionCopy} from '$lib/config/collectionsJourney';
    import type {JourneyCollectionGroup} from '$lib/collections/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let group: JourneyCollectionGroup | null = null;
    let loading = true;
    let errorMessage: string | null = null;
    let invalidRoute = false;

    const text = {
        en: {
            instruction: 'Choose an individual collection to preview its program.',
            back: 'Collection Groups', home: 'Home', loading: 'Loading collections…',
            empty: 'No collections are currently available in this group.',
            invalid: 'This collection group could not be found.',
            error: 'We could not load this collection group.', view: 'View collection'
        },
        es: {
            instruction: 'Elige una colección para conocer su programa.',
            back: 'Grupos de colecciones', home: 'Inicio', loading: 'Cargando colecciones…',
            empty: 'No hay colecciones disponibles en este grupo.',
            invalid: 'No se encontró este grupo de colecciones.',
            error: 'No pudimos cargar este grupo de colecciones.', view: 'Ver colección'
        },
        ptbr: {
            instruction: 'Escolha uma coleção para conhecer seu programa.',
            back: 'Grupos de coleções', home: 'Início', loading: 'Carregando coleções…',
            empty: 'Nenhuma coleção está disponível neste grupo.',
            invalid: 'Este grupo de coleções não foi encontrado.',
            error: 'Não foi possível carregar este grupo de coleções.', view: 'Ver coleção'
        }
    };

    onMount(async () => {
        const savedLanguage = localStorage.getItem('topspot_language');
        language = savedLanguage === 'es' || savedLanguage === 'ptbr' ? savedLanguage : 'en';

        try {
            const groups = await loadCollectionsJourneyCatalog();
            group = findCollectionGroup(groups, page.params.groupSlug ?? '');
            invalidRoute = !group;
        } catch (error) {
            console.error('Failed to load collection group:', error);
            errorMessage = text[language].error;
        } finally {
            loading = false;
        }
    });

    $: title = group?.name ?? 'Collections Programs';
    $: accent = group?.presentation.accent ?? '#75ef4f';
    $: backHref = group
        ? `/journey-prototype/collections?group=${encodeURIComponent(group.slug)}`
        : '/journey-prototype/collections';
</script>

<svelte:head>
    <title>{title} | TopSpot40</title>
</svelte:head>

<CollectionsJourneyShell
    {language}
    {title}
    instruction={text[language].instruction}
    {backHref}
    backLabel={text[language].back}
    homeLabel={text[language].home}
    {accent}
>
    {#if loading}
        <div class="state" aria-live="polite">{text[language].loading}</div>
    {:else if errorMessage}
        <div class="state error" role="alert">{errorMessage}</div>
    {:else if invalidRoute || !group}
        <div class="state invalid" role="alert">
            <h2>{text[language].invalid}</h2>
            <a href="/journey-prototype/collections">{text[language].back}</a>
        </div>
    {:else}
        <header class="group-summary">
            <span class="icon" aria-hidden="true">{group.presentation.icon}</span>
            <div>
                <p>{localizedCollectionCopy(group.presentation.description, language)}</p>
                <strong>
                    {group.items.length} {group.items.length === 1 ? 'collection' : 'collections'}
                    {#if group.totalTracks > 0} • {group.totalTracks} tracks{/if}
                </strong>
            </div>
        </header>

        {#if group.items.length === 0}
            <div class="state">{text[language].empty}</div>
        {:else}
            <div class="collection-grid">
                {#each group.items as collection (collection.slug)}
                    <CollectionCard
                        {collection}
                        groupSlug={group.slug}
                        {language}
                        openLabel={text[language].view}
                    />
                {/each}
            </div>
        {/if}
    {/if}
</CollectionsJourneyShell>

<style>
    .group-summary {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 26px;
        padding-bottom: 22px;
        border-bottom: 1px solid rgba(214, 193, 122, 0.32);
    }

    .group-summary p {
        margin: 0 0 8px;
        color: #f4eedc;
        font-size: 17px;
        line-height: 1.5;
    }

    .group-summary strong {
        color: #d6c17a;
    }

    .icon {
        display: grid;
        width: 62px;
        height: 62px;
        place-items: center;
        flex: 0 0 auto;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 17px;
        font-size: 32px;
    }

    .collection-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
    }

    .state {
        padding: 46px 20px;
        text-align: center;
        color: #f4eedc;
    }

    .state h2 {
        color: #f7dc82;
    }

    .state a {
        color: #75ef4f;
        font-weight: 800;
    }

    .error {
        color: #ffb4aa;
    }

    @media (max-width: 760px) {
        .collection-grid {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 520px) {
        .group-summary {
            align-items: flex-start;
        }
    }
</style>

