<script lang="ts">
    import {afterNavigate, goto} from '$app/navigation';
    import {onMount} from 'svelte';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import MusicDocuseriesCollectionCard from '$lib/components/journey/MusicDocuseriesCollectionCard.svelte';
    import MusicDocuseriesCollectionPreview from '$lib/components/journey/MusicDocuseriesCollectionPreview.svelte';
    import {MUSIC_DOCUSERIES_ACCENT, MUSIC_DOCUSERIES_JOURNEY_ARTWORK} from '$lib/config/musicDocuseriesJourney';
    import {findMusicDocuseriesCollection, loadMusicDocuseriesCollections, loadMusicDocuseriesStories} from '$lib/musicDocuseries/catalogAdapter';
    import type {MusicDocuseriesCollection, MusicDocuseriesStory} from '$lib/musicDocuseries/types';
    import type {Language} from '$lib/types/playback';

    let language: Language = 'en';
    let collections: MusicDocuseriesCollection[] = [];
    let selectedCollection: MusicDocuseriesCollection | null = null;
    let selectedStories: MusicDocuseriesStory[] = [];
    let collectionsLoading = true;
    let collectionsError: string | null = null;
    let previewLoading = false;
    let previewError: string | null = null;
    let invalidCollectionSlug: string | null = null;
    let initialized = false;
    let previewRequest = 0;

    const text = {
        en: {title:'Choose a Music Docuseries',instruction:'Select a documentary collection, preview its stories, and continue your journey.',back:'Choose Experience',home:'Home',collections:'Docuseries Collections',loading:'Loading documentary series…',empty:'No Music Docuseries collections are currently available.',error:'We could not load the Music Docuseries catalog.',invalid:'That Music Docuseries collection is not available.',show:'Show available collections',previewLoading:'Loading available stories…',previewError:'The collection is available, but its stories could not be loaded.',previewEmpty:'No stories are currently available in this collection.',explore:'Explore'},
        es: {title:'Elige una docuserie musical',instruction:'Selecciona una colección documental, conoce sus historias y continúa tu viaje.',back:'Elegir experiencia',home:'Inicio',collections:'Colecciones de docuseries',loading:'Cargando series documentales…',empty:'No hay colecciones de docuseries musicales disponibles.',error:'No pudimos cargar el catálogo de docuseries musicales.',invalid:'Esa colección de docuseries musicales no está disponible.',show:'Mostrar colecciones disponibles',previewLoading:'Cargando historias disponibles…',previewError:'La colección está disponible, pero no pudimos cargar sus historias.',previewEmpty:'No hay historias disponibles en esta colección.',explore:'Explorar'},
        ptbr: {title:'Escolha uma docussérie musical',instruction:'Selecione uma coleção documental, conheça suas histórias e continue sua jornada.',back:'Escolher experiência',home:'Início',collections:'Coleções de docusséries',loading:'Carregando séries documentais…',empty:'Nenhuma coleção de docusséries musicais está disponível.',error:'Não foi possível carregar o catálogo de docusséries musicais.',invalid:'Essa coleção de docusséries musicais não está disponível.',show:'Mostrar coleções disponíveis',previewLoading:'Carregando histórias disponíveis…',previewError:'A coleção está disponível, mas não foi possível carregar suas histórias.',previewEmpty:'Nenhuma história está disponível nesta coleção.',explore:'Explorar'}
    };

    function readLanguage(): Language {
        const saved = localStorage.getItem('topspot_language');
        return saved === 'es' || saved === 'ptbr' ? saved : 'en';
    }

    async function loadSelectedPreview(collection: MusicDocuseriesCollection): Promise<void> {
        const request = ++previewRequest;
        selectedStories = [];
        previewError = null;
        previewLoading = true;
        try {
            const stories = await loadMusicDocuseriesStories(collection.slug);
            if (request === previewRequest && selectedCollection?.slug === collection.slug) selectedStories = stories;
        } catch (error) {
            if (request === previewRequest && selectedCollection?.slug === collection.slug) {
                console.error('Failed to load selected Music Docuseries preview:', error);
                previewError = text[language].previewError;
            }
        } finally {
            if (request === previewRequest) previewLoading = false;
        }
    }

    function synchronizeSelection(url: URL, replaceMissing = false): void {
        if (!initialized || collectionsLoading || collections.length === 0) return;
        const requestedSlug = url.searchParams.get('collection');
        const nextCollection = requestedSlug
            ? findMusicDocuseriesCollection(collections, requestedSlug)
            : collections[0];

        if (!requestedSlug && replaceMissing && nextCollection) {
            const next = new URL(url);
            next.searchParams.set('collection', nextCollection.slug);
            void goto(`${next.pathname}${next.search}`, {replaceState:true,noScroll:true});
        }

        if (!nextCollection) {
            selectedCollection = null;
            selectedStories = [];
            previewError = null;
            previewLoading = false;
            invalidCollectionSlug = requestedSlug;
            return;
        }

        invalidCollectionSlug = null;
        if (selectedCollection?.slug === nextCollection.slug) return;
        selectedCollection = nextCollection;
        void loadSelectedPreview(nextCollection);
    }

    function selectCollection(collection: MusicDocuseriesCollection): void {
        const url = new URL(window.location.href);
        url.searchParams.set('collection', collection.slug);
        void goto(`${url.pathname}${url.search}`, {keepFocus:true,noScroll:true});
    }

    function resetSelection(): void {
        if (collections[0]) selectCollection(collections[0]);
    }

    afterNavigate(({to}) => { if (to) synchronizeSelection(to.url); });

    onMount(async () => {
        language = readLanguage();
        try {
            collections = await loadMusicDocuseriesCollections();
        } catch (error) {
            console.error('Failed to load Music Docuseries collections:', error);
            collectionsError = text[language].error;
        } finally {
            collectionsLoading = false;
            initialized = true;
        }
        synchronizeSelection(new URL(window.location.href), true);
    });

    const accent = MUSIC_DOCUSERIES_ACCENT;
</script>

<svelte:head><title>{text[language].title} | TopSpot40</title><meta name="description" content="Browse TopSpot40 Music Docuseries collections."/></svelte:head>

<ProgramJourneyShell {language} title={text[language].title} instruction={text[language].instruction} backHref="/journey-prototype/choose" backLabel={text[language].back} homeLabel={text[language].home} {accent} artwork={MUSIC_DOCUSERIES_JOURNEY_ARTWORK} artworkAlt="A cinematic TopSpot40 music library prepared for a documentary journey">
    {#if collectionsLoading}
        <div class="state" aria-live="polite">{text[language].loading}</div>
    {:else if collectionsError}
        <div class="state error" role="alert">{collectionsError}</div>
    {:else if collections.length === 0}
        <div class="state">{text[language].empty}</div>
    {:else if invalidCollectionSlug}
        <div class="state invalid" role="alert"><h2>{text[language].invalid}</h2><p><code>{invalidCollectionSlug}</code></p><button type="button" on:click={resetSelection}>{text[language].show}</button></div>
    {:else if selectedCollection}
        <div class="browser-layout">
            <section class="collection-picker" aria-labelledby="docuseries-collections-heading">
                <h2 id="docuseries-collections-heading">{text[language].collections}</h2>
                <div class="collection-buttons">
                    {#each collections as collection (`${collection.id}:${collection.slug}`)}
                        <MusicDocuseriesCollectionCard {collection} selected={collection.slug === selectedCollection.slug} onSelect={() => selectCollection(collection)}/>
                    {/each}
                </div>
            </section>
            <MusicDocuseriesCollectionPreview collection={selectedCollection} stories={selectedStories} storiesLoading={previewLoading} storiesError={previewError} exploreLabel={text[language].explore} loadingLabel={text[language].previewLoading} emptyLabel={text[language].previewEmpty}/>
        </div>
    {/if}
</ProgramJourneyShell>

<style>
    .browser-layout { display:grid; grid-template-columns:minmax(270px,.76fr) minmax(0,1.65fr); gap:clamp(20px,3vw,34px); align-items:stretch; }
    .collection-picker { min-width:0; }
    .collection-picker h2 { margin:0 0 12px; color:#f7dc82; font-family:Georgia,serif; font-size:23px; }
    .collection-buttons { display:grid; max-height:520px; gap:7px; padding-right:6px; overflow-y:auto; scrollbar-color:#d7a64a rgba(255,255,255,.08); scrollbar-width:thin; }
    .state { min-height:210px; display:grid; place-items:center; padding:30px; color:#e8dfcb; background:rgba(29,27,23,.78); border:1px solid rgba(215,166,74,.28); border-radius:16px; text-align:center; }
    .state h2 { margin:0 0 12px; color:#fff0bb; }
    .state button { min-height:44px; padding:10px 18px; color:#171006; background:#d7a64a; border:0; border-radius:999px; font-weight:900; cursor:pointer; }
    .state.error,.state.invalid { color:#ffd3cd; border-color:rgba(255,112,95,.5); }
    @media (min-width:801px) and (min-height:800px) { .browser-layout { gap:24px; } .collection-picker h2 { margin-bottom:9px; font-size:21px; } .collection-buttons { max-height:490px; gap:5px; } }
    @media (max-width:800px) { .browser-layout { grid-template-columns:1fr; } .collection-buttons { max-height:370px; } }
    @media (max-width:520px) { .collection-buttons { max-height:330px; } }
</style>
