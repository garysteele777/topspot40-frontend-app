<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import {
        MUSIC_DOCUSERIES_ACCENT,
        MUSIC_DOCUSERIES_FALLBACK_ARTWORK,
        MUSIC_DOCUSERIES_JOURNEY_ARTWORK,
        formatTargetLength,
        musicDocuseriesCollectionPresentation
    } from '$lib/config/musicDocuseriesJourney';
    import {
        findMusicDocuseriesCollection,
        findMusicDocuseriesStory,
        loadMusicDocuseriesCollections,
        loadMusicDocuseriesStories
    } from '$lib/musicDocuseries/catalogAdapter';
    import {buildMusicDocuseriesLaunchUrl} from '$lib/musicDocuseries/launchMusicDocuseries';
    import type {MusicDocuseriesCollection, MusicDocuseriesStory} from '$lib/musicDocuseries/types';
    import type {Language} from '$lib/types/playback';
    import {readStoredLanguagePreference} from '$lib/languagePreferences';

    let language: Language = 'en';
    let collection: MusicDocuseriesCollection | null = null;
    let story: MusicDocuseriesStory | null = null;
    let collectionLoading = true;
    let storyLoading = false;
    let collectionError: string | null = null;
    let storyError: string | null = null;
    let invalidCollection = false;
    let invalidStory = false;
    let imageFailed = false;

    const text = {
        en: {instruction: 'Preview this documentary story, then start it in the TopSpot40 player.', back: 'Back to Stories', home: 'Home', loadingCollection: 'Loading documentary collection…', loadingStory: 'Loading story preview…', invalidCollection: 'This Music Docuseries collection could not be found.', invalidStory: 'This story is unavailable or does not belong to the requested collection.', collectionError: 'We could not load the Music Docuseries catalog.', storyError: 'We found the collection, but could not load this story.', start: 'Start Music Docuseries', story: 'Documentary Story'},
        es: {instruction: 'Conoce esta historia documental y luego iníciala en el reproductor TopSpot40.', back: 'Volver a historias', home: 'Inicio', loadingCollection: 'Cargando colección documental…', loadingStory: 'Cargando vista previa…', invalidCollection: 'No se encontró esta colección de docuseries musicales.', invalidStory: 'Esta historia no está disponible o no pertenece a la colección solicitada.', collectionError: 'No pudimos cargar el catálogo de docuseries musicales.', storyError: 'Encontramos la colección, pero no pudimos cargar esta historia.', start: 'Iniciar docuserie musical', story: 'Historia documental'},
        ptbr: {instruction: 'Conheça esta história documental e depois inicie no player TopSpot40.', back: 'Voltar às histórias', home: 'Início', loadingCollection: 'Carregando coleção documental…', loadingStory: 'Carregando prévia da história…', invalidCollection: 'Esta coleção de docusséries musicais não foi encontrada.', invalidStory: 'Esta história não está disponível ou não pertence à coleção solicitada.', collectionError: 'Não foi possível carregar o catálogo de docusséries musicais.', storyError: 'Encontramos a coleção, mas não foi possível carregar esta história.', start: 'Iniciar docussérie musical', story: 'História documental'}
    };

    function collectionPath(): string {
        return collection
            ? `/journey-prototype/music-docuseries/${encodeURIComponent(collection.slug)}`
            : '/journey-prototype/music-docuseries';
    }

    function startStory(): void {
        if (!collection || !story) return;
        void goto(buildMusicDocuseriesLaunchUrl({
            collectionSlug: collection.slug,
            storySlug: story.slug,
            language,
            returnTo: collectionPath()
        }));
    }

    onMount(async () => {
        language = readStoredLanguagePreference() ?? 'en';
        const collectionSlug = page.params.collectionSlug ?? '';
        const storySlug = page.params.storySlug ?? '';

        try {
            const collections = await loadMusicDocuseriesCollections();
            collection = findMusicDocuseriesCollection(collections, collectionSlug);
            invalidCollection = !collection;
        } catch (error) {
            console.error('Failed to load Music Docuseries collection for preview:', error);
            collectionError = text[language].collectionError;
        } finally {
            collectionLoading = false;
        }

        if (!collection) return;

        storyLoading = true;
        try {
            const stories = await loadMusicDocuseriesStories(collection.slug);
            story = findMusicDocuseriesStory(stories, storySlug);
            invalidStory = !story;
        } catch (error) {
            console.error('Failed to load Music Docuseries story preview:', error);
            storyError = text[language].storyError;
        } finally {
            storyLoading = false;
        }
    });

    $: title = story?.title ?? collection?.name ?? 'Music Docuseries';
    $: presentation = musicDocuseriesCollectionPresentation(collection?.slug ?? '');
    $: artwork = !imageFailed && story?.artwork_url ? story.artwork_url : MUSIC_DOCUSERIES_FALLBACK_ARTWORK;
    $: targetLength = formatTargetLength(story?.target_length);
    $: backHref = collectionPath();
</script>

<svelte:head>
    <title>{title} | TopSpot40</title>
    <meta name="description" content={story?.short_description ?? 'Preview a TopSpot40 Music Docuseries story.'}/>
</svelte:head>

<ProgramJourneyShell
    {language}
    {title}
    instruction={text[language].instruction}
    {backHref}
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
    {:else if invalidCollection || !collection}
        <div class="state invalid" role="alert"><h2>{text[language].invalidCollection}</h2><a href="/journey-prototype/music-docuseries">← {text[language].back}</a></div>
    {:else if storyLoading}
        <div class="state" aria-live="polite">{text[language].loadingStory}</div>
    {:else if storyError}
        <div class="state error" role="alert">{storyError}</div>
    {:else if invalidStory || !story}
        <div class="state invalid" role="alert"><h2>{text[language].invalidStory}</h2><a href={backHref}>← {text[language].back}</a></div>
    {:else}
        <article class="preview">
            <div class="poster">
                <img class:fallback={!story.artwork_url || imageFailed} src={artwork} alt="" on:error={() => imageFailed = true}/>
                <span class="poster-shade" aria-hidden="true"></span>
                <span class="play-mark" aria-hidden="true">▶</span>
            </div>
            <div class="preview-copy">
                <span class="eyebrow">{text[language].story}<span aria-hidden="true"> • </span>{collection.name}</span>
                <h2>{story.title}</h2>
                {#if targetLength}<strong>{targetLength}</strong>{/if}
                {#if story.short_description}<p>{story.short_description}</p>{/if}
                <button type="button" class="start" on:click={startStory}><span aria-hidden="true">▶</span>{text[language].start}</button>
            </div>
        </article>
    {/if}
</ProgramJourneyShell>

<style>
    .preview { display: grid; grid-template-columns: minmax(260px, 38%) minmax(0, 1fr); min-height: 390px; overflow: hidden; background: linear-gradient(135deg, rgba(49,41,27,.98), rgba(17,17,16,.98)); border: 1px solid rgba(215,166,74,.42); border-radius: 20px; }
    .poster { position: relative; min-height: 390px; overflow: hidden; background: #21190d; }
    .poster img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .poster img.fallback { filter: sepia(.85) contrast(1.08); opacity: .68; }
    .poster-shade { position: absolute; inset: 0; background: linear-gradient(135deg, transparent, rgba(9,6,2,.65)); }
    .play-mark { position: absolute; top: 50%; left: 50%; display: grid; width: 76px; height: 76px; place-items: center; padding-left: 5px; color: #24190a; background: rgba(247,220,130,.92); border: 2px solid #fff0bb; border-radius: 50%; transform: translate(-50%,-50%); box-shadow: 0 10px 30px rgba(0,0,0,.55); font-size: 24px; }
    .preview-copy { display: flex; min-width: 0; padding: clamp(26px, 4vw, 48px); flex-direction: column; justify-content: center; align-items: flex-start; }
    .eyebrow { color: #d7a64a; font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    h2 { margin: 10px 0 0; color: #fff0bb; font-family: Georgia, serif; font-size: clamp(28px, 3.7vw, 46px); line-height: 1.08; }
    .preview-copy strong { margin-top: 12px; color: #d7a64a; }
    .preview-copy p { margin: 16px 0 0; color: #e6dece; font-size: 17px; line-height: 1.58; }
    .start { display: inline-flex; min-height: 50px; align-items: center; gap: 10px; margin-top: 28px; padding: 13px 24px; color: #160f06; background: #d7a64a; border: 2px solid #ffe0a2; border-radius: 999px; font-weight: 900; cursor: pointer; box-shadow: 0 0 24px rgba(215,166,74,.32); }
    .start:hover, .start:focus-visible { filter: brightness(1.1); outline: 2px solid #fff0bb; outline-offset: 3px; }
    .state { min-height: 230px; display: grid; place-items: center; padding: 30px; color: #e8dfcb; background: rgba(29,27,23,.78); border: 1px solid rgba(215,166,74,.28); border-radius: 16px; text-align: center; }
    .state h2 { margin: 0 0 14px; font-size: 25px; }
    .state a { color: #d7a64a; font-weight: 800; }
    .state.error, .state.invalid { color: #ffd3cd; border-color: rgba(255,112,95,.5); }

    @media (max-width: 720px) {
        .preview { grid-template-columns: 1fr; }
        .poster { min-height: 240px; }
    }
</style>
