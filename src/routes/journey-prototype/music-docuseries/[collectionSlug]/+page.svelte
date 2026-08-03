<script lang="ts">
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import MusicDocuseriesStoryCard from '$lib/components/journey/MusicDocuseriesStoryCard.svelte';
    import {
        MUSIC_DOCUSERIES_ACCENT,
        MUSIC_DOCUSERIES_JOURNEY_ARTWORK,
        musicDocuseriesCollectionPresentation
    } from '$lib/config/musicDocuseriesJourney';
    import {
        findMusicDocuseriesCollection,
        loadMusicDocuseriesCollections,
        loadMusicDocuseriesStories
    } from '$lib/musicDocuseries/catalogAdapter';
    import type {MusicDocuseriesCollection, MusicDocuseriesStory} from '$lib/musicDocuseries/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let collection: MusicDocuseriesCollection | null = null;
    let stories: MusicDocuseriesStory[] = [];
    let collectionLoading = true;
    let storiesLoading = false;
    let collectionError: string | null = null;
    let storiesError: string | null = null;
    let invalidRoute = false;

    const text = {
        en: {instruction: 'Choose a story or episode to preview.', back: 'All Docuseries', home: 'Home', loadingCollection: 'Loading documentary collection…', loadingStories: 'Loading stories…', invalid: 'This Music Docuseries collection could not be found.', collectionError: 'We could not load the Music Docuseries catalog.', storiesError: 'We found the collection, but could not load its stories.', empty: 'No stories are currently available in this collection.', open: 'Open story'},
        es: {instruction: 'Elige una historia o episodio para conocerlo.', back: 'Todas las docuseries', home: 'Inicio', loadingCollection: 'Cargando colección documental…', loadingStories: 'Cargando historias…', invalid: 'No se encontró esta colección de docuseries musicales.', collectionError: 'No pudimos cargar el catálogo de docuseries musicales.', storiesError: 'Encontramos la colección, pero no pudimos cargar sus historias.', empty: 'No hay historias disponibles en esta colección.', open: 'Ver historia'},
        ptbr: {instruction: 'Escolha uma história ou episódio para conhecer.', back: 'Todas as docusséries', home: 'Início', loadingCollection: 'Carregando coleção documental…', loadingStories: 'Carregando histórias…', invalid: 'Esta coleção de docusséries musicais não foi encontrada.', collectionError: 'Não foi possível carregar o catálogo de docusséries musicais.', storiesError: 'Encontramos a coleção, mas não foi possível carregar suas histórias.', empty: 'Nenhuma história está disponível nesta coleção.', open: 'Ver história'}
    };

    onMount(async () => {
        const savedLanguage = localStorage.getItem('topspot_language');
        language = savedLanguage === 'es' || savedLanguage === 'ptbr' ? savedLanguage : 'en';
        const collectionSlug = page.params.collectionSlug ?? '';

        try {
            const collections = await loadMusicDocuseriesCollections();
            collection = findMusicDocuseriesCollection(collections, collectionSlug);
            invalidRoute = !collection;
        } catch (error) {
            console.error('Failed to load Music Docuseries collection:', error);
            collectionError = text[language].collectionError;
        } finally {
            collectionLoading = false;
        }

        if (!collection) return;

        storiesLoading = true;
        try {
            stories = await loadMusicDocuseriesStories(collection.slug);
        } catch (error) {
            console.error('Failed to load Music Docuseries stories:', error);
            storiesError = text[language].storiesError;
        } finally {
            storiesLoading = false;
        }
    });

    $: title = collection?.name ?? 'Music Docuseries';
    $: presentation = musicDocuseriesCollectionPresentation(collection?.slug ?? '');
</script>

<svelte:head><title>{title} | TopSpot40</title></svelte:head>

<ProgramJourneyShell
    {language}
    {title}
    instruction={text[language].instruction}
    backHref="/journey-prototype/music-docuseries"
    backLabel={text[language].back}
    homeLabel={text[language].home}
    accent={presentation.accent ?? MUSIC_DOCUSERIES_ACCENT}
    artwork={MUSIC_DOCUSERIES_JOURNEY_ARTWORK}
    artworkAlt="A cinematic TopSpot40 music library prepared for a documentary journey"
>
    {#if collectionLoading}
        <div class="state" aria-live="polite">{text[language].loadingCollection}</div>
    {:else if collectionError}
        <div class="state error" role="alert">{collectionError}</div>
    {:else if invalidRoute || !collection}
        <div class="state invalid" role="alert"><h2>{text[language].invalid}</h2><a href="/journey-prototype/music-docuseries">← {text[language].back}</a></div>
    {:else}
        <header class="collection-summary">
            <div><span class="eyebrow">{presentation.kicker}</span>{#if collection.description}<p>{collection.description}</p>{/if}</div>
            {#if !storiesLoading && !storiesError}<strong>{stories.length} {stories.length === 1 ? 'story' : 'stories'}</strong>{/if}
        </header>

        {#if storiesLoading}
            <div class="state" aria-live="polite">{text[language].loadingStories}</div>
        {:else if storiesError}
            <div class="state error" role="alert">{storiesError}</div>
        {:else if stories.length === 0}
            <div class="state">{text[language].empty}</div>
        {:else}
            <div class="story-grid">
                {#each stories as story, index (`${story.id}:${story.slug}`)}
                    <MusicDocuseriesStoryCard {story} collectionSlug={collection.slug} episodeNumber={index + 1} openLabel={text[language].open}/>
                {/each}
            </div>
        {/if}
    {/if}
</ProgramJourneyShell>

<style>
    .collection-summary { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid rgba(215,166,74,.3); }
    .collection-summary p { max-width: 760px; margin: 7px 0 0; color: #eee5d2; font-size: 16px; line-height: 1.5; }
    .collection-summary strong { flex: 0 0 auto; color: #d7a64a; }
    .eyebrow { color: #f7dc82; font-size: 12px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    .story-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; }
    .state { min-height: 190px; display: grid; place-items: center; padding: 30px; color: #e8dfcb; background: rgba(29,27,23,.78); border: 1px solid rgba(215,166,74,.28); border-radius: 16px; text-align: center; }
    .state h2 { margin: 0 0 14px; color: #fff0bb; }
    .state a { color: #d7a64a; font-weight: 800; }
    .state.error, .state.invalid { color: #ffd3cd; border-color: rgba(255,112,95,.5); }

    @media (max-width: 800px) { .story-grid { grid-template-columns: 1fr; } }
    @media (max-width: 560px) { .collection-summary { align-items: flex-start; flex-direction: column; } }
</style>
