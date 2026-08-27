<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import {get} from 'svelte/store';
    import CollectionsJourneyShell from '$lib/components/journey/CollectionsJourneyShell.svelte';
    import CollectionTrackPreview from '$lib/components/journey/CollectionTrackPreview.svelte';
    import {
        findCollectionGroup,
        findCollectionInGroup,
        loadCollectionsJourneyCatalog,
        loadCollectionTrackPreview
    } from '$lib/collections/catalogAdapter';
    import {buildCollectionJourneyLaunchUrl} from '$lib/collections/launchCollection';
    import type {
        CollectionTrackPreview as TrackPreview,
        JourneyCollection,
        JourneyCollectionGroup
    } from '$lib/collections/types';
    import {localizedCollectionCopy} from '$lib/config/collectionsJourney';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    import type {Language} from '$lib/types/playback';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';

    let language: Language = 'en';
    let group: JourneyCollectionGroup | null = null;
    let collection: JourneyCollection | null = null;
    let tracks: TrackPreview[] = [];
    let loading = true;
    let errorMessage: string | null = null;
    let invalidGroup = false;
    let invalidCollection = false;

    const text = {
        en: {
            instruction: 'Preview the collection, then start listening in the TopSpot40 player.',
            back: 'Back to Group', home: 'Home', loading: 'Loading collection contents…',
            empty: 'No tracks are currently available for this collection.',
            invalidGroup: 'This collection group could not be found.',
            invalidCollection: 'This collection does not belong to the requested group.',
            error: 'We could not load this collection.', play: 'Start Collection',
            tracks: 'Program Contents'
        },
        es: {
            instruction: 'Conoce la colección y comienza a escucharla en el reproductor TopSpot40.',
            back: 'Volver al grupo', home: 'Inicio', loading: 'Cargando el contenido de la colección…',
            empty: 'No hay canciones disponibles para esta colección.',
            invalidGroup: 'No se encontró este grupo de colecciones.',
            invalidCollection: 'Esta colección no pertenece al grupo solicitado.',
            error: 'No pudimos cargar esta colección.', play: 'Iniciar colección',
            tracks: 'Contenido del programa'
        },
        ptbr: {
            instruction: 'Conheça a coleção e comece a ouvir no player TopSpot40.',
            back: 'Voltar ao grupo', home: 'Início', loading: 'Carregando o conteúdo da coleção…',
            empty: 'Nenhuma faixa está disponível para esta coleção.',
            invalidGroup: 'Este grupo de coleções não foi encontrado.',
            invalidCollection: 'Esta coleção não pertence ao grupo solicitado.',
            error: 'Não foi possível carregar esta coleção.', play: 'Iniciar coleção',
            tracks: 'Conteúdo do programa'
        }
    };

    onMount(async () => {
        language = readStoredLanguagePreference() ?? 'en';

        try {
            const groups = await loadCollectionsJourneyCatalog();
            group = findCollectionGroup(groups, page.params.groupSlug ?? '');

            if (!group) {
                invalidGroup = true;
                return;
            }

            collection = findCollectionInGroup(group, page.params.collectionSlug ?? '');

            if (!collection) {
                invalidCollection = true;
                return;
            }

            tracks = await loadCollectionTrackPreview({
                groupSlug: group.slug,
                collectionSlug: collection.slug,
                language
            });
        } catch (error) {
            console.error('Failed to load individual collection:', error);
            errorMessage = text[language].error;
        } finally {
            loading = false;
        }
    });

    function launchCollection() {
        if (!group || !collection || tracks.length === 0) return;

        const settings = get(playbackSettingsStore);
        const returnTo = `/journey-prototype/collections/${encodeURIComponent(group.slug)}`;
        const url = buildCollectionJourneyLaunchUrl({
            groupSlug: group.slug,
            collectionSlug: collection.slug,
            language,
            languages: [language],
            voices: settings.voices,
            playbackOrder: settings.playbackOrder,
            voicePlayMode: settings.voicePlayMode,
            pauseMode: settings.pauseMode,
            skipPlayed: settings.skipPlayed,
            totalTracks: collection.totalTracks || tracks.length,
            returnTo
        });

        void goto(url);
    }

    $: title = collection?.name ?? 'Collections Programs';
    $: accent = collection?.presentation.accent ?? group?.presentation.accent ?? '#75ef4f';
    $: backHref = group
        ? `/journey-prototype/collections/${encodeURIComponent(group.slug)}`
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
    {:else if invalidGroup}
        <div class="state invalid" role="alert">
            <h2>{text[language].invalidGroup}</h2>
            <a href="/journey-prototype/collections">← {text[language].back}</a>
        </div>
    {:else if invalidCollection || !group || !collection}
        <div class="state invalid" role="alert">
            <h2>{text[language].invalidCollection}</h2>
            <a href={backHref}>← {text[language].back}</a>
        </div>
    {:else}
        <header class="collection-summary">
            <span class="icon" aria-hidden="true">{collection.presentation.icon}</span>
            <div>
                <p>{localizedCollectionCopy(collection.presentation.description, language)}</p>
                <strong>
                    {tracks.length || collection.totalTracks}
                    {(tracks.length || collection.totalTracks) === 1 ? 'track' : 'tracks'}
                    <span aria-hidden="true"> • </span>{group.name}
                </strong>
            </div>
            <button type="button" class="play" disabled={tracks.length === 0} on:click={launchCollection}>
                <span aria-hidden="true">▶</span>
                {text[language].play}
            </button>
        </header>


        {#if tracks.length === 0}
            <div class="state">{text[language].empty}</div>
        {:else}
            <CollectionTrackPreview
                    {tracks}
                    collectionName={collection.name}
            />
        {/if}
    {/if}
</CollectionsJourneyShell>

<style>
    .collection-summary {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
        margin-bottom: 26px;
        padding-bottom: 22px;
        border-bottom: 1px solid rgba(214, 193, 122, 0.32);
    }

    .collection-summary p {
        margin: 0 0 8px;
        color: #f4eedc;
        font-size: 17px;
        line-height: 1.5;
    }

    .collection-summary strong {
        color: #d6c17a;
    }

    .icon {
        display: grid;
        width: 62px;
        height: 62px;
        place-items: center;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 17px;
        font-size: 32px;
    }

    .play {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 13px 20px;
        color: #101010;
        background: #75ef4f;
        border: 2px solid #b7ff9c;
        border-radius: 999px;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 0 22px rgba(78, 255, 73, 0.3);
    }

    .play:disabled {
        cursor: not-allowed;
        opacity: 0.45;
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
        .collection-summary {
            grid-template-columns: auto minmax(0, 1fr);
        }

        .play {
            grid-column: 1 / -1;
            justify-content: center;
        }
    }
</style>
