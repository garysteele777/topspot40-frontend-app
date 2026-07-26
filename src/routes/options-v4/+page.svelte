<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */

    import {onMount} from 'svelte';
    import {page} from '$app/state';
    import {browser, dev} from '$app/environment';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {buildSelectionFromResume} from '$lib/options/applyResume';
    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import {loadResumeState} from '$lib/utils/smartResume';
    import {get} from 'svelte/store';
    import {
        programHistoryStore
    } from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';


    // ─────────────────────────────────────────────
    // UI Components
    // ─────────────────────────────────────────────
    import HeroHeader from '$lib/components/options/HeroHeader.svelte';
    import ListeningLibraryPanel from '$lib/components/options-v2/ListeningLibraryPanel.svelte';
    import MusicJourneyPanel from '$lib/components/options-v2/MusicJourneyPanel.svelte';
    import PlaybackPreferencesPanel from '$lib/components/options-v2/PlaybackPreferencesPanel.svelte';

    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    // ─────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────
    import type {
        ModeType,
        VoicePart,
        PlaybackOrder,
        Language
    } from '$lib/types/playback';


    type OptionItem = { id: string; label: string; mp3?: string };


    // ─────────────────────────────────────────────
    // Core UI State
    // ─────────────────────────────────────────────
    let activeGroup: ModeType = 'decade_genre';
    let language: Language = 'en';
    let languages: Language[] = ['en'];
    let initialLibraryTab: 'nostalgia' | 'collections' | 'artists' =
        page.url.searchParams.get('tab') === 'artist'
            ? 'artists'
            : page.url.searchParams.get('tab') === 'collections'
                ? 'collections'
                : 'nostalgia';

    let initialDocuseriesCollection =
        page.url.searchParams.get('docuseries_collection');

    let startRank = 1;
    let endRank = 9999;

    const initialPlaybackSettings = get(playbackSettingsStore);

    let playbackMethod: 'automatic' | 'guided' =
        dev ? initialPlaybackSettings.playbackMethod : 'guided';
    let playbackOrder: PlaybackOrder =
        initialPlaybackSettings.playbackOrder;

    let pauseMode: 'pause' | 'continuous' =
        initialPlaybackSettings.pauseMode;

    let skipPlayed = initialPlaybackSettings.skipPlayed;

    let selectedVoices: VoicePart[] = [
        ...initialPlaybackSettings.voices
    ];
    let detailLength = initialPlaybackSettings.detailLength;


    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    let radioMode: 'nostalgia' | 'collections' | 'artist_spotlight' | null = null;
    type OpenSection =
        | 'preferences'
        | 'radio'
        | 'library'
        | 'journey'
        | null;

    let openSection: OpenSection = null;
    // Options
    let decadeOptions: OptionItem[] = [];
    let genreOptions: OptionItem[] = [];

    let collectionGroups: {
        name: string;
        slug: string;
        items: { name: string; slug: string }[];
    }[] = [];

    // Resume lifecycle guard
    let hydrated = false;
    let pendingSelection: ReturnType<typeof buildSelectionFromResume> | null = null;
    let selectedGenre: string | null = null;

    const genreIcons: Record<string, string> = {
        rock: '🎸',
        country: '🤠',
        pop: '🎤',
        blues_jazz: '🎷',
        rnb: '🎹',
        rnb_soul: '🎹',
        folk: '🪕',
        folk_acoustic: '🪕',
        latin: '💃',
        latin_global: '💃',
        tv_themes: '📺',
    };

    const uiText = {
        en: {
            home: 'Home',
            title: 'TopSpot40 Control Center',
            tagline: 'Your music. 🕰️ Your memories. 📻 Your station.',
            playback: 'TopSpot40 Playback Preferences',
            radio: 'TopSpot40 Interactive Radio',
            radioDesc: 'Build custom nostalgia radio stations.',
            radioHelp: 'Nostalgia mixes sets by decades and genres. Collections plays themed playlists. Artist Spotlight mixes sets by artists.',
            nostalgiaRadio: 'Nostalgia Radio',
            collectionsRadio: 'Collections Radio',
            artistRadio: 'Artist Spotlight Radio',
            artistRadioDesc: 'Artist Spotlight Radio will rotate featured artists and play short artist-focused sets.',
            stations: 'Stations',
            startAllGenres: 'Start All Genres: 1950s to the Present',
            startAllCollections: 'Start All Collections',
            startAllArtists: 'Start All Artist Genres',
            library: 'TopSpot40 Listening Library',
            libraryDesc: 'Browse saved programs and curated collections.',
            journey: 'My TopSpot40 Music Journey',
            journeyDesc: 'Track your music journey and favorite discoveries.'
        },
        es: {
            home: 'Inicio',
            title: 'Panel de Control TopSpot40',
            tagline: 'Tu música. 🕰️ Tus recuerdos. 📻 Tu estación.',
            playback: 'Preferencias de Reproducción TopSpot40',
            radio: 'Radio Interactiva TopSpot40',
            radioDesc: 'Cree estaciones de radio nostálgicas personalizadas.',
            radioHelp: 'Nostalgia mezcla décadas y géneros. Colecciones reproduce listas temáticas. Destacados de Artistas mezcla selecciones por artista.',
            nostalgiaRadio: 'Radio Nostalgia',
            collectionsRadio: 'Radio de Colecciones',
            artistRadio: 'Radio Destacados de Artistas',
            artistRadioDesc: 'Radio Destacados de Artistas rotará artistas destacados y reproducirá conjuntos cortos centrados en cada artista.',
            stations: 'Estaciones',
            startAllGenres: 'Iniciar todos los géneros: 1950s hasta hoy',
            startAllCollections: 'Iniciar todas las colecciones',
            startAllArtists: 'Iniciar todos los géneros de artistas',
            library: 'Biblioteca Musical TopSpot40',
            libraryDesc: 'Explora programas guardados y colecciones seleccionadas.',
            journey: 'Mi Viaje Musical TopSpot40',
            journeyDesc: 'Sigue tu recorrido musical y tus descubrimientos favoritos.'
        },
        ptbr: {
            home: 'Início',
            title: 'Painel de Controle TopSpot40',
            tagline: 'Sua música. 🕰️ Suas memórias. 📻 Sua estação.',
            playback: 'Preferências de Reprodução TopSpot40',
            radio: 'Rádio Interativa TopSpot40',
            radioDesc: 'Crie estações de rádio nostálgicas personalizadas.',
            radioHelp: 'Nostalgia mistura décadas e gêneros. Coleções reproduz playlists temáticas. Destaque de Artistas mistura seleções por artista.',
            nostalgiaRadio: 'Rádio Nostalgia',
            collectionsRadio: 'Rádio de Coleções',
            artistRadio: 'Rádio Destaque de Artistas',
            artistRadioDesc: 'A Rádio Destaque de Artistas alternará artistas em destaque e reproduzirá conjuntos curtos focados em cada artista.',
            stations: 'Estações',
            startAllGenres: 'Iniciar todos os gêneros: dos anos 1950 até hoje',
            startAllCollections: 'Iniciar todas as coleções',
            startAllArtists: 'Iniciar todos os gêneros de artistas',
            library: 'Biblioteca Musical TopSpot40',
            libraryDesc: 'Explore programas salvos e coleções selecionadas.',
            journey: 'Minha Jornada Musical TopSpot40',
            journeyDesc: 'Acompanhe sua jornada musical e descobertas favoritas.'
        }
    };


    function startRadio(mode: 'nostalgia' | 'collections' | 'artist_spotlight') {
        openSection = 'radio';
        radioMode = mode;
    }

    function launchNostalgiaAll() {
        const selection = {
            activeGroup: 'decade_genre' as ModeType,
            context: {
                decade: 'ALL',
                genre: 'ALL'
            },
            language,
            languages,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };


        saveResumeFromLocal(selection);

        goto(`/car-page?mode=nostalgia&decade=ALL&genre=ALL&language=${language}&languages=${languages.join(',')}&voices=${buildVoiceQuery()}&playbackOrder=shuffle&voicePlayMode=before&pauseMode=${pauseMode}&skipPlayed=${skipPlayed}`);
    }

    function launchNostalgiaGenre(genre: string) {
        const selection = {
            activeGroup: 'decade_genre' as ModeType,
            context: {
                decade: 'ALL',
                genre
            },
            language,
            languages,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };


        saveResumeFromLocal(selection);

        goto(`/car-page?mode=nostalgia&decade=ALL&genre=${genre}&language=${language}&languages=${languages.join(',')}&voices=${buildVoiceQuery()}&playbackOrder=shuffle&voicePlayMode=before&pauseMode=${pauseMode}&skipPlayed=${skipPlayed}`);
    }

    function launchCollectionsAll() {
        const selection = {
            activeGroup: 'collection' as ModeType,
            context: {
                collection_group_slug: 'ALL'
            },
            language,
            languages,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };


        saveResumeFromLocal(selection);

        goto(`/car-page?mode=radio_collections&collection_group=ALL&language=${language}&languages=${languages.join(',')}&voices=${buildVoiceQuery()}`);
    }

    function buildVoiceQuery(): string {
        return encodeURIComponent(selectedVoices.join(','));
    }


    function launchCollectionGroup(groupSlug: string) {
        const selection = {
            activeGroup: 'collection' as ModeType,
            context: {
                collection_group_slug: groupSlug
            },
            language,
            languages,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };


        saveResumeFromLocal(selection);

        goto(`/car-page?mode=radio_collections&collection_group=${groupSlug}&language=${language}&languages=${languages.join(',')}&voices=${buildVoiceQuery()}`);
    }

    function launchArtistSpotlightRadioGenre(genre: string) {
        goto(
            `/car-page?mode=artist_radio` +
            `&genre=${genre}` +
            `&language=${language}` +
            `&languages=${languages.join(',')}` +
            `&voices=${buildVoiceQuery()}` +
            `&playbackOrder=shuffle` +
            `&voicePlayMode=before` +
            `&pauseMode=${pauseMode}` +
            `&skipPlayed=${skipPlayed}`
        );
    }


    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    function getStringProp(obj: unknown, key: string): string | null {
        if (!obj || typeof obj !== 'object') return null;
        const v = (obj as Record<string, unknown>)[key];
        return typeof v === 'string' ? v : null;
    }

    function toOptionItem(x: unknown): OptionItem | null {
        const id =
            getStringProp(x, 'slug') ??
            getStringProp(x, 'id') ??
            getStringProp(x, 'value') ??
            getStringProp(x, 'key');

        const label =
            getStringProp(x, 'label') ??
            getStringProp(x, 'name') ??
            id;

        if (!id || !label) return null;
        return {id, label, mp3: getStringProp(x, 'mp3') ?? undefined};
    }

    function mapOptions(list: unknown): OptionItem[] {
        if (!Array.isArray(list)) return [];
        return list.map(toOptionItem).filter(Boolean) as OptionItem[];
    }

    function resolveOptionId(saved: string | undefined, options: OptionItem[]): string[] {
        if (!saved) return [];
        const match = options.find(
            o =>
                o.id === saved ||
                o.id.toLowerCase() === saved.toLowerCase() ||
                o.label.toLowerCase() === saved.toLowerCase()
        );
        return match ? [match.id] : [];
    }

    function applySelection(
        selection: ReturnType<typeof buildSelectionFromResume>
    ) {
        if (!selection) return;

        activeGroup = selection.mode;
        language = selection.language;
        languages = selection.languages ?? [selection.language];

        selectedVoices = (selection.voices ?? ['intro']) as VoicePart[];
        startRank = selection.startRank ?? 1;
        const totalTracks = getTotalTracksForSelection(
            selection.mode,
            decades,
            genres,
            collections
        );

        endRank = selection.endRank ?? totalTracks;

        playbackOrder = selection.playbackOrder ?? 'up';
        pauseMode = selection.pauseMode === 'continuous' ? 'continuous' : 'pause';
        skipPlayed = !!selection.skipPlayed;

        if (selection.mode === 'decade_genre') {
            decades = resolveOptionId(selection.context?.decade, decadeOptions);
            genres = resolveOptionId(selection.context?.genre, genreOptions);
            collections = [];
        } else {
            collections = selection.context?.collection_slug
                ? [selection.context.collection_slug]
                : [];
            decades = [];
            genres = [];
        }
    }

    function getTotalTracksForSelection(
        mode: ModeType,
        decades: string[],
        genres: string[],
        collections: string[]
    ): number {

        let programKey = '';

        if (mode === 'decade_genre') {
            const decade = decades[0];
            const genre = genres[0];
            if (!decade || !genre) return 0;

            programKey = `DG|${decade}|${genre}`;
        } else {
            const collection = collections[0];
            if (!collection) return 0;

            programKey = `COL|${collection}`;
        }

        const historyList = get(programHistoryStore);
        const entry = historyList.find(p => p.key === programKey);


        return entry?.total ?? 0;
    }


    // ─────────────────────────────────────────────
    // Mount: load resume → catalog → apply
    // ─────────────────────────────────────────────
    onMount(async () => {
        pendingSelection = buildSelectionFromResume(
            loadResumeState()
        );

        const savedLanguage = localStorage.getItem('topspot_language');

        const panel = page.url.searchParams.get('panel');
        const tab = page.url.searchParams.get('tab');

        console.log('panel=', panel);
        console.log('tab=', tab);

        const optionsVisitedKey =
            'ts-options-v4-visited-v1';
        const isFirstControlPanelVisit =
            sessionStorage.getItem(optionsVisitedKey) !== 'true';

        sessionStorage.setItem(optionsVisitedKey, 'true');

        if (!panel && isFirstControlPanelVisit) {
            openSection = 'library';
        }

        if (panel === 'library') {
            openSection = 'library';
        }

        if (tab === 'artist') {
            initialLibraryTab = 'artists';
        } else if (tab === 'collections') {
            initialLibraryTab = 'collections';
            initialDocuseriesCollection =
                page.url.searchParams.get('docuseries_collection');
        }

        try {


            const normalized = await loadCatalogOnce();

            decadeOptions = mapOptions(normalized.decades);
            genreOptions = mapOptions(normalized.genres);

            collectionGroups = normalized.collectionGroups ?? [];


            if (pendingSelection) {
                applySelection(pendingSelection);
                pendingSelection = null;
            }

            if (
                savedLanguage === 'en'
                || savedLanguage === 'es'
                || savedLanguage === 'ptbr'
            ) {
                language = savedLanguage;
                languages = [savedLanguage];
            }

            hydrated = true;
        } catch {
            console.error('❌ Error loading catalog.');
        }
    });

    // ─────────────────────────────────────────────
    // Auto-save (guarded)
    // ─────────────────────────────────────────────
    $: if (browser && hydrated) {
        // Keep landing-page and playback language synchronized.
        localStorage.setItem('topspot_language', language);
        localStorage.setItem('tts_language', language);

        // console.log('OPTIONS AUTOSAVE languages:', languages);
        saveResumeFromLocal({
            activeGroup,
            context:
                activeGroup === 'decade_genre'
                    ? {
                        ...(decades[0] ? {decade: decades[0]} : {}),
                        ...(genres[0] ? {genre: genres[0]} : {})
                    }
                    : {
                        ...(collections[0]
                            ? {collection_slug: collections[0]}
                            : {})
                    },
            language,
            languages,
            startRank,
            endRank,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        });
    }

    // ─────────────────────────────────────────────
    // Sync playback settings into store
    // ─────────────────────────────────────────────
    $: if (browser && hydrated) {
        playbackSettingsStore.set({
            voices: selectedVoices,
            playbackMethod: dev ? playbackMethod : 'guided',
            playbackOrder,
            pauseMode,
            voicePlayMode: 'before',
            skipPlayed,
            detailLength
        });
    }


</script>


{#if import.meta.env.DEV}
    <div style="position:fixed;top:4px;right:6px;font-size:11px;opacity:.5">
        ROUTE: /options-v4
    </div>
{/if}


<div class="page-shell">
    <HeroHeader/>

    <div class="page">

        <div class="page-hero">
            <div class="page-header">
                <button
                        class="home-button"
                        on:click={() => goto('/')}
                >
                    🏠 {uiText[language].home}
                </button>

                <h1 class="page-title">
                    🎙️ {uiText[language].title}
                </h1>
            </div>

            <div class="page-subtitle">
                🎵 {uiText[language].tagline}
            </div>
        </div>

        <div
                id="listening-library"
                class:active-section-wrapper={openSection === 'library'}
        >
            <ListeningLibraryPanel
                    {decadeOptions}
                    {genreOptions}
                    {collectionGroups}
                    {language}
                    {languages}
                    voices={selectedVoices}
                    {playbackOrder}
                    voicePlayMode="before"
                    {pauseMode}
                    {skipPlayed}
                    initialTab={initialLibraryTab}
                    {initialDocuseriesCollection}
                    title={uiText[language].library}
                    description={uiText[language].libraryDesc}
                    collapsed={openSection !== 'library'}
                    onActivate={() => {
        openSection = openSection === 'library'
            ? null
            : 'library';

        radioMode = null;
    }}
            />
        </div>

        {#if dev}
            <!-- 🔥 RADIO (NEW) -->
            <div
                    class="opt-cell opt-cell--radio"
                    class:active-section-wrapper={openSection === 'radio'}
            >
                <div
                        class="section-header-row section-header-clickable"
                        role="button"
                        tabindex="0"
                        on:click={() => {
                openSection = openSection === 'radio' ? null : 'radio';
            }}
                        on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openSection = openSection === 'radio' ? null : 'radio';
                }
            }}
                >
                    <h3 class="section-title">
                        📻🐕 {uiText[language].radio} 📻🐕
                    </h3>
                    <span class="section-toggle">{openSection === 'radio' ? '▲' : '▼'}</span>
                </div>

                <div class="radio-description">
                    {uiText[language].radioDesc}
                </div>

                {#if openSection === 'radio'}
                    <div class="radio-description">
                        {uiText[language].radioHelp}
                    </div>

                    <div class="radio-buttons">
                        <button
                                class:active={radioMode === 'nostalgia'}
                                on:click|stopPropagation={() => startRadio('nostalgia')}
                        >
                            {uiText[language].nostalgiaRadio}
                        </button>

                        <button
                                class:active={radioMode === 'collections'}
                                on:click|stopPropagation={() => startRadio('collections')}
                        >
                            {uiText[language].collectionsRadio}
                        </button>

                        <button
                                class:active={radioMode === 'artist_spotlight'}
                                on:click|stopPropagation={() => startRadio('artist_spotlight')}
                        >
                            {uiText[language].artistRadio}
                        </button>
                    </div>

                    <span>{uiText[language].stations}</span>

                    {#if radioMode === 'nostalgia'}
                        <div style="margin-top: 10px;">
                            <button class="start-all-btn" on:click|stopPropagation={launchNostalgiaAll}>
                                <span class="icon">📻</span>
                                <span>{uiText[language].startAllGenres}</span>
                            </button>
                        </div>

                        <div class="radio-genres">
                            {#each genreOptions as g}
                                <button
                                        class="genre-btn"
                                        class:selected={selectedGenre === g.id}
                                        on:click|stopPropagation={() => {
                                launchNostalgiaGenre(g.id);
                            }}
                                >
                                    <span class="icon">{genreIcons[g.id] ?? '🎶'}</span>
                                    <span>{g.label}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}

                    {#if radioMode === 'collections'}
                        <div style="margin-top: 10px;">
                            <button class="start-all-btn" on:click|stopPropagation={launchCollectionsAll}>
                                <span class="icon">📻</span>
                                <span>{uiText[language].startAllCollections}</span>
                            </button>
                        </div>

                        <div class="radio-genres">
                            {#each collectionGroups as group}
                                <button
                                        class="genre-btn"
                                        on:click|stopPropagation={() => launchCollectionGroup(group.slug)}
                                >
                                    <span class="icon">📀</span>
                                    <span>{group.name}</span>
                                </button>
                            {/each}
                        </div>
                    {/if}
                {/if}
            </div>

            {#if radioMode === 'artist_spotlight'}
                <div class="radio-description" style="margin-top: 10px;">
                    {uiText[language].artistRadioDesc}
                </div>

                <div class="radio-genres">

                    <button
                            class="start-all-btn artist-start-all-btn"
                            on:click|stopPropagation={() => launchArtistSpotlightRadioGenre('ALL')}
                    >
                        <span class="icon">🎤</span>
                        <span>{uiText[language].startAllArtists}</span>
                    </button>

                    {#each genreOptions.filter(g => g.id !== 'tv_themes') as g}
                        <button
                                class="genre-btn"
                                on:click|stopPropagation={() => {
                        launchArtistSpotlightRadioGenre(g.id);
                    }}
                        >
                            <span class="icon">{genreIcons[g.id] ?? '🎤'}</span>
                            <span>{g.label}</span>
                        </button>
                    {/each}
                </div>
            {/if}
        {/if}


        <div class:active-section-wrapper={openSection === 'journey'}>
            <MusicJourneyPanel
                    {collectionGroups}
                    title={uiText[language].journey}
                    description={uiText[language].journeyDesc}
                    collapsed={openSection !== 'journey'}
                    onActivate={() => {
        openSection = openSection === 'journey' ? null : 'journey';
        radioMode = null;
    }}
            />
        </div>


        <div class:active-section-wrapper={openSection === 'preferences'}>

            <PlaybackPreferencesPanel
                    bind:language
                    bind:languages
                    bind:selectedVoices
                    bind:detailLength
                    bind:playbackMethod
                    showPlaybackMethod={dev}
                    bind:playbackOrder
                    bind:pauseMode
                    bind:skipPlayed
                    collapsed={openSection !== 'preferences'}
                    onActivate={() => {
        openSection = openSection === 'preferences' ? null : 'preferences';
        radioMode = null;
    }}
            />
        </div>

        <!-- ✅ Playback History now at top -->
        <!--        <PlaybackHistoryPanel {language} {languages}/>-->

    </div>
</div>

<style>
    .page-shell {
        padding-bottom: 4rem;
        background: radial-gradient(circle at top, #1f1f1f 0, #121212 45%, #050505 100%);
        min-height: 100vh;
    }

    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 4rem;
        color: #f5f5f5;
    }

    /* =========================
       CARD STYLE
    ========================= */

    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out, background-color 0.18s ease-out;
    }

    .opt-cell:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
        border-color: rgba(207, 184, 124, 0.8);
        background: rgba(24, 24, 24, 0.98);
    }

    /* SELECTED */

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }


    /* RADIO DESCRIPTION */
    .radio-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    /* RADIO BUTTONS */
    .radio-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
    }

    .radio-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .radio-buttons button:hover {
        border-color: #666;
    }

    /* ACTIVE STATE (matches your gold theme) */
    .radio-buttons button.active {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }


    .radio-genres {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
        margin-top: 8px;
    }

    .radio-genres button {
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .radio-genres button:hover {
        border-color: #666;
    }

    .genre-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        justify-content: center;

        padding: 6px 10px;
        border-radius: 999px;

        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;

        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .genre-btn:hover {
        border-color: #cfb87c;
        color: #fff;
        background: #333;
    }

    .genre-btn .icon {
        font-size: 0.9rem;
    }

    .genre-btn.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .start-all-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        width: 100%;
        margin-top: 10px;
        margin-bottom: 8px;

        padding: 8px 12px;
        border-radius: 999px;

        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;

        font-size: 0.9rem;
        font-weight: 600;

        cursor: pointer;
        transition: all 0.2s ease;
    }

    .start-all-btn:hover {
        border-color: #666;
        background: #333;
        color: #fff;
    }

    .start-all-btn:active {
        transform: scale(0.98);
        opacity: 0.9;
    }

    .start-all-btn .icon {
        font-size: 1rem;
    }

    .artist-start-all-btn {
        grid-column: 1 / -1;
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 700;
    }

    .radio-separator {
        display: flex;
        align-items: center;
        margin: 10px 0 12px;
        opacity: 0.9;
    }

    .radio-separator span {
        padding: 0 8px;
        font-size: 0.7rem;
        color: rgba(207, 184, 124, 0.7);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .section-toggle {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.95;
    }

    .active-section-wrapper {
        border-color: rgba(207, 184, 124, 0.9);
        box-shadow: 0 0 0 1px rgba(207, 184, 124, 0.45),
        0 0 18px rgba(207, 184, 124, 0.18);
    }

    .section-header-clickable {
        cursor: pointer;
    }

    .page-hero {
        margin-bottom: 1.5rem;
        padding: 0.5rem 0 1rem 0;
        border-bottom: 1px solid rgba(207, 184, 124, 0.18);
    }

    .page-title {
        font-size: 1.5rem;
        font-weight: 800;
        color: #cfb87c;
        margin: 0;
        letter-spacing: 0.02em;
    }

    .page-subtitle {
        margin-top: 0.35rem;
        font-size: 0.95rem;
        color: #aaa;
        letter-spacing: 0.01em;
    }

    .page-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
    }

    .home-button {
        background: transparent;
        border: 1px solid #d6c17a;
        color: #d6c17a;
        padding: 8px 14px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
    }

    .home-button:hover {
        background: rgba(214, 193, 122, 0.15);
    }

</style>
