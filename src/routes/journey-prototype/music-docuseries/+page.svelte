<script lang="ts">
    import {afterNavigate, goto} from '$app/navigation';
    import {onMount, tick} from 'svelte';
    import SurpriseMe from '$lib/components/journey/SurpriseMe.svelte';
    import {docuseriesCodeForSlug} from '$lib/musicDocuseries/programCodes';
    import ProgramJourneyShell from '$lib/components/journey/ProgramJourneyShell.svelte';
    import MusicDocuseriesCollectionCard from '$lib/components/journey/MusicDocuseriesCollectionCard.svelte';
    import MusicDocuseriesCollectionPreview from '$lib/components/journey/MusicDocuseriesCollectionPreview.svelte';
    import {MUSIC_DOCUSERIES_ACCENT, MUSIC_DOCUSERIES_JOURNEY_ARTWORK} from '$lib/config/musicDocuseriesJourney';
    import {findMusicDocuseriesCollection, loadMusicDocuseriesCollections, loadMusicDocuseriesStories} from '$lib/musicDocuseries/catalogAdapter';
    import type {MusicDocuseriesCollection, MusicDocuseriesStory} from '$lib/musicDocuseries/types';
    import type {Language} from '$lib/types/playback';
    import {readLanguagePreference} from '$lib/languagePreferences';
    import {docuseriesHistoryStore, refreshDocuseriesHistory} from '$lib/musicDocuseries/history';

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
    type StoryPick = {code: string; name: string; collection: MusicDocuseriesCollection; story: MusicDocuseriesStory};
    let surpriseItems: StoryPick[] = [];
    let storiesByGroup: Record<string, MusicDocuseriesStory[]> = {};
    let surprisePick: StoryPick | null = null;
    let surpriseSpinning = false;
    let surpriseLoading = true;
    let surpriseReset = 0;
    let includeHeard = false;
    $: unheardItems = surpriseItems.filter(item => !$docuseriesHistoryStore[item.story.slug]);
    $: eligibleSurprises = includeHeard ? surpriseItems : unheardItems;
    $: catalogStorySlugs = [...new Set(surpriseItems.map(item => item.story.slug))];
    $: heardStoryCount = catalogStorySlugs.filter(slug => Boolean($docuseriesHistoryStore[slug])).length;
    const surpriseCopy = {
        en: {heard:(count: number, total: number) => `Heard ${count} of ${total} stories`, pick:'Surprise Me — Unheard', again:'Pick Again — Unheard', complete:'You’ve heard them all!', all:'Pick from all Docuseries', unheard:'Choose unheard only'},
        es: {heard:(count: number, total: number) => `Escuchadas ${count} de ${total} historias`, pick:'Sorpréndeme — Sin escuchar', again:'Elegir otra — Sin escuchar', complete:'¡Ya las has escuchado todas!', all:'Elegir entre todas las docuseries', unheard:'Elegir solo las no escuchadas'},
        ptbr: {heard:(count: number, total: number) => `Ouvidas ${count} de ${total} histórias`, pick:'Surpreenda-me — Não ouvidas', again:'Escolher outra — Não ouvidas', complete:'Você já ouviu todas!', all:'Escolher entre todas as docusséries', unheard:'Escolher apenas as não ouvidas'}
    };
    $: displayedCollection = surprisePick?.collection ?? selectedCollection;

    async function loadSurpriseStories(): Promise<void> {
        const results = await Promise.allSettled(collections.map(collection => loadMusicDocuseriesStories(collection.slug)));
        const items: StoryPick[] = [];
        const groups: Record<string, MusicDocuseriesStory[]> = {};
        for (const [index, result] of results.entries()) {
            if (result.status !== 'fulfilled') continue;
            const collection = collections[index];
            groups[collection.slug] = result.value;
            for (const story of result.value) {
                const code = docuseriesCodeForSlug(story.slug);
                if (code) items.push({code, name: story.title, collection, story});
            }
        }
        storiesByGroup = groups;
        surpriseItems = items;
        surpriseLoading = false;
    }

    function scrollHighlight(node: HTMLElement, active: boolean) {
        const scroll = () => {
            if (!active || !node.parentElement) return;
            const parent = node.parentElement;
            const bounds = parent.getBoundingClientRect();
            const item = node.getBoundingClientRect();
            if (item.top < bounds.top) parent.scrollTop -= bounds.top - item.top;
            else if (item.bottom > bounds.bottom) parent.scrollTop += item.bottom - bounds.bottom;
        };
        void tick().then(scroll);
        return {update(value: boolean) {active = value; void tick().then(scroll);}};
    }

    function highlightStory(code: string, finished: boolean): void {
        surprisePick = surpriseItems.find(item => item.code === code) ?? null;
        surpriseSpinning = Boolean(surprisePick) && !finished;
        if (!finished || !surprisePick) return;
        // Commit the winning group only at the end; animation frames never navigate.
        previewRequest += 1;
        selectedCollection = surprisePick.collection;
        selectedStories = storiesByGroup[selectedCollection.slug] ?? [];
        previewLoading = false;
        previewError = null;
        const url = new URL(window.location.href);
        url.searchParams.set('collection', selectedCollection.slug);
        void goto(`${url.pathname}${url.search}`, {replaceState:true, noScroll:true, keepFocus:true});
    }

    function openSurpriseStory(code: string): void {
        const pick = surpriseItems.find(item => item.code === code);
        if (!pick || surpriseSpinning) return;
        const query = new URLSearchParams({type:'music_docuseries', slug:pick.story.slug,
            collection:pick.collection.slug, language:language === 'ptbr' ? 'pt-BR' : language,
            returnTo:`/journey-prototype/music-docuseries?collection=${encodeURIComponent(pick.collection.slug)}`});
        void goto(`/story-player?${query}`);
    }

    const MOBILE_BREAKPOINT = '(max-width: 800px)';
    const COLLECTION_SCROLL_KEY = 'topspot40:docuseries:collection-scroll';

    const COLLECTION_ORDER = [
        'history_eras',
        'songs_stories',
        'legends_rivalries',
        'movements_revolutions',
        'people_behind_the_music',
        'mysteries_tragedies',
        'mexico_border',
        'latin_america_and_caribbean',
        'brazil_and_new_global_sounds',
        'modern_music_revolutions',
        'musical_instruments',
        'foundations_technology_events',
        'modern_music_listening',
        'beyond_the_music'
    ];

    const collectionPosition = new Map(
        COLLECTION_ORDER.map((slug, index) => [slug, index])
    );

    function orderMusicDocuseriesCollections(
        items: MusicDocuseriesCollection[]
    ): MusicDocuseriesCollection[] {
        return [...items].sort((first, second) => {
            const firstPosition = collectionPosition.get(first.slug) ?? Number.MAX_SAFE_INTEGER;
            const secondPosition = collectionPosition.get(second.slug) ?? Number.MAX_SAFE_INTEGER;

            return firstPosition - secondPosition
                || first.sort_order - second.sort_order
                || first.id - second.id;
        });
    }

    const text = {
        en: {title:'Choose a Music Docuseries',instruction:'Select a documentary collection to see its stories and continue your journey.',back:'Choose Experience',home:'Home',collections:'Docuseries Collections',loading:'Loading documentary series…',empty:'No Music Docuseries collections are currently available.',error:'We could not load the Music Docuseries catalog.',invalid:'That Music Docuseries collection is not available.',show:'Show available collections',previewLoading:'Loading available stories…',previewError:'The collection is available, but its stories could not be loaded.',previewEmpty:'No stories are currently available in this collection.',explore:'Explore'},
        es: {title:'Elige una docuserie musical',instruction:'Selecciona una colección documental para ver sus historias y continuar tu viaje.',back:'Elegir experiencia',home:'Inicio',collections:'Colecciones de docuseries',loading:'Cargando series documentales…',empty:'No hay colecciones de docuseries musicales disponibles.',error:'No pudimos cargar el catálogo de docuseries musicales.',invalid:'Esa colección de docuseries musicales no está disponible.',show:'Mostrar colecciones disponibles',previewLoading:'Cargando historias disponibles…',previewError:'La colección está disponible, pero no pudimos cargar sus historias.',previewEmpty:'No hay historias disponibles en esta colección.',explore:'Explorar'},
        ptbr: {title:'Escolha uma docussérie musical',instruction:'Selecione uma coleção documental para ver suas histórias e continuar sua jornada.',back:'Escolher experiência',home:'Início',collections:'Coleções de docusséries',loading:'Carregando séries documentais…',empty:'Nenhuma coleção de docusséries musicais está disponível.',error:'Não foi possível carregar o catálogo de docusséries musicais.',invalid:'Essa coleção de docusséries musicais não está disponível.',show:'Mostrar coleções disponíveis',previewLoading:'Carregando histórias disponíveis…',previewError:'A coleção está disponível, mas não foi possível carregar suas histórias.',previewEmpty:'Nenhuma história está disponível nesta coleção.',explore:'Explorar'}
    };

    function readLanguage(): Language {
        return readLanguagePreference();
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
        surpriseReset += 1;
        surprisePick = null;
        surpriseSpinning = false;
        if (window.matchMedia(MOBILE_BREAKPOINT).matches) {
            sessionStorage.setItem(COLLECTION_SCROLL_KEY, JSON.stringify({
                slug: collection.slug,
                pageScrollY: window.scrollY
            }));
            void goto(`/journey-prototype/music-docuseries/${encodeURIComponent(collection.slug)}`);
            return;
        }

        const url = new URL(window.location.href);
        url.searchParams.set('collection', collection.slug);
        void goto(`${url.pathname}${url.search}`, {keepFocus:true,noScroll:true});
    }

    function resetSelection(): void {
        if (collections[0]) selectCollection(collections[0]);
    }

    afterNavigate(({to}) => { if (to) synchronizeSelection(to.url); });

    onMount(async () => {
        refreshDocuseriesHistory();
        language = readLanguage();
        try {
            collections = orderMusicDocuseriesCollections(
                await loadMusicDocuseriesCollections()
            );
        } catch (error) {
            console.error('Failed to load Music Docuseries collections:', error);
            collectionsError = text[language].error;
        } finally {
            collectionsLoading = false;
            initialized = true;
        }
        synchronizeSelection(new URL(window.location.href), true);
        // Load group membership for accurate completion badges, including
        // groups that have not been selected in this visit.
        void loadSurpriseStories();

        const savedScroll = sessionStorage.getItem(COLLECTION_SCROLL_KEY);
        sessionStorage.removeItem(COLLECTION_SCROLL_KEY);
        if (savedScroll && window.matchMedia(MOBILE_BREAKPOINT).matches) {
            try {
                const {slug, pageScrollY} = JSON.parse(savedScroll);
                if (slug === new URL(window.location.href).searchParams.get('collection')) {
                    await tick();
                    requestAnimationFrame(() => {
                        window.scrollTo({top: pageScrollY});
                    });
                }
            } catch (error) {
                console.error('Failed to restore Music Docuseries collection position:', error);
            }
        }
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
        {#if surpriseLoading}
            <p class="surprise-loading" role="status">{text[language].previewLoading}</p>
        {/if}
        {#if !surpriseLoading && surpriseItems.length > 0}
            <p class="heard-count">{surpriseCopy[language].heard(heardStoryCount, catalogStorySlugs.length)}</p>
        {/if}
        {#if !surpriseLoading && surpriseItems.length > 0 && !includeHeard && unheardItems.length === 0}
            <div class="surprise-complete" role="status">
                <span>{surpriseCopy[language].complete}</span>
                <button type="button" on:click={() => includeHeard = true}>{surpriseCopy[language].all}</button>
            </div>
        {:else}
            {#key `${surpriseReset}:${includeHeard}`}
                <SurpriseMe {language} items={eligibleSurprises}
                    pickLabel={includeHeard ? null : surpriseCopy[language].pick}
                    againLabel={includeHeard ? null : surpriseCopy[language].again}
                    onHighlight={highlightStory} onGo={openSurpriseStory}/>
            {/key}
            {#if includeHeard}
                <button class="unheard-only" type="button" disabled={surpriseSpinning} on:click={() => includeHeard = false}>{surpriseCopy[language].unheard}</button>
            {/if}
        {/if}
        <div class="browser-layout" class:has-surprise={Boolean(surprisePick)}>
            <section class="collection-picker" aria-labelledby="docuseries-collections-heading">
                <h2 id="docuseries-collections-heading">{text[language].collections}</h2>
                <div class="collection-buttons">
                    {#each collections as collection, index (`${collection.id}:${collection.slug}`)}
                        <div use:scrollHighlight={surprisePick?.collection.slug === collection.slug}>
                        <MusicDocuseriesCollectionCard
                            {collection}
                            {language}
                            referenceNumber={index + 1}
                            selected={collection.slug === displayedCollection?.slug}
                            onSelect={() => selectCollection(collection)}
                        />
                        </div>
                    {/each}
                </div>
            </section>
            <div class="desktop-preview">
                {#if surprisePick}
                    <section class="surprise-stories" aria-label={surprisePick.collection.name}>
                        <h2>{surprisePick.collection.name}</h2>
                        <div class="story-choices">
                            {#each storiesByGroup[surprisePick.collection.slug] ?? [] as story (`${story.id}:${story.slug}`)}
                                <div use:scrollHighlight={story.slug === surprisePick.story.slug}>
                                    <button type="button" class:highlighted={story.slug === surprisePick.story.slug}
                                        disabled={surpriseSpinning} on:click={() => openSurpriseStory(docuseriesCodeForSlug(story.slug) ?? '')}>
                                        <span>{story.title}</span><small>{docuseriesCodeForSlug(story.slug) ?? ''}</small>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </section>
                {:else}
                    <MusicDocuseriesCollectionPreview {language} collection={selectedCollection} stories={selectedStories} storiesLoading={previewLoading} storiesError={previewError} exploreLabel={text[language].explore} loadingLabel={text[language].previewLoading} emptyLabel={text[language].previewEmpty}/>
                {/if}
            </div>
        </div>
    {/if}
</ProgramJourneyShell>

<style>
    .heard-count {margin:0 0 12px; color:#f7dc82; font-weight:800;}
    .surprise-complete {display:flex; flex-wrap:wrap; align-items:center; gap:14px; padding:14px; margin-bottom:18px; color:#fff0bb; background:#242015; border:1px solid #b49a4c; border-radius:12px;}
    .surprise-complete button, .unheard-only {min-height:44px; padding:10px 18px; font:inherit; font-weight:800; color:#181309; background:#f7dc82; border:2px solid #f7dc82; border-radius:999px; cursor:pointer;}
    .unheard-only {margin-bottom:18px;}
    .surprise-complete button:focus-visible, .unheard-only:focus-visible {outline:2px solid white; outline-offset:3px;}
    .surprise-loading {color:#fff0bb;}
    .surprise-stories {padding:24px; min-height:100%; background:rgba(20,17,11,.96); border:2px solid #d7a64a; border-radius:20px;}
    .surprise-stories h2 {margin:0 0 18px; color:#f7dc82; font-family:Georgia,serif; font-size:28px;}
    .story-choices {display:grid; gap:8px; max-height:420px; overflow-y:auto; padding:4px;}
    .story-choices button {display:flex; align-items:center; justify-content:space-between; gap:12px; width:100%; min-height:46px; padding:10px 12px; color:#fff0bb; background:#292216; border:1px solid #b49a4c; border-radius:8px; text-align:left; font:inherit; cursor:pointer;}
    .story-choices button.highlighted {color:#101909; background:#75ef4f; border-color:#b7ff9c; box-shadow:0 0 14px #75ef4f80;}
    .story-choices button:focus-visible {outline:2px solid white; outline-offset:2px;}
    .story-choices small {flex-shrink:0; font-weight:800;}
    .browser-layout { display:grid; grid-template-columns:minmax(330px,.9fr) minmax(0,1.55fr); gap:clamp(20px,3vw,34px); align-items:stretch; }
    .collection-picker, .desktop-preview { min-width:0; }
    .collection-picker h2 { margin:0 0 12px; color:#f7dc82; font-family:Georgia,serif; font-size:23px; }
    .collection-buttons { display:grid; max-height:520px; gap:7px; padding-right:6px; overflow-y:auto; scrollbar-color:#d7a64a rgba(255,255,255,.08); scrollbar-width:thin; }
    .state { min-height:210px; display:grid; place-items:center; padding:30px; color:#e8dfcb; background:rgba(29,27,23,.78); border:1px solid rgba(215,166,74,.28); border-radius:16px; text-align:center; }
    .state h2 { margin:0 0 12px; color:#fff0bb; }
    .state button { min-height:44px; padding:10px 18px; color:#171006; background:#d7a64a; border:0; border-radius:999px; font-weight:900; cursor:pointer; }
    .state.error,.state.invalid { color:#ffd3cd; border-color:rgba(255,112,95,.5); }
    @media (min-width:801px) and (min-height:800px) { .browser-layout { gap:24px; } .collection-picker h2 { margin-bottom:9px; font-size:21px; } .collection-buttons { max-height:490px; gap:5px; } }
    @media (max-width:800px) { .browser-layout { grid-template-columns:1fr; } .collection-buttons { max-height:none; padding-right:0; overflow-y:visible; } .desktop-preview { display:none; } }
    @media (max-width:800px) {
        .has-surprise .collection-buttons {max-height:220px; overflow-y:auto;}
        .has-surprise .desktop-preview {display:block;}
        .has-surprise .surprise-stories {padding:18px;}
        .has-surprise .story-choices {max-height:260px;}
    }
</style>
