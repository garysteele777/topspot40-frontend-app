<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */

    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {buildSelectionFromResume} from '$lib/options/applyResume';
    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import {loadResumeState} from '$lib/utils/smartResume';
    import {get} from 'svelte/store';
    import {programHistoryStore} from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';
    import {currentSelection} from '$lib/carmode/CarMode.store';


    // ─────────────────────────────────────────────
    // UI Components
    // ─────────────────────────────────────────────
    import HeroHeader from '$lib/components/options/HeroHeader.svelte';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';
    import PlaybackHistoryPanel from '$lib/components/options-v2/PlaybackHistoryPanel.svelte';

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

    console.log('📦 OPTIONS PAGE MOUNTED');

    type OptionItem = { id: string; label: string; mp3?: string };


    // ─────────────────────────────────────────────
    // Core UI State
    // ─────────────────────────────────────────────
    let activeGroup: ModeType = 'decade_genre';
    let language: Language = 'en';

    let startRank = 1;
    let endRank = 1; // or undefined


    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    let radioMode: 'nostalgia' | 'collections' | null = 'nostalgia';

    const playbackSettings = playbackSettingsStore;

    $: selectedVoices = $playbackSettings.voices as VoicePart[];
    $: playbackOrder = $playbackSettings.playbackOrder as PlaybackOrder;
    $: pauseMode = $playbackSettings.pauseMode as 'pause' | 'continuous';
    $: skipPlayed = !!$playbackSettings.skipPlayed;

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

    function buildRadioContext(mode: 'nostalgia' | 'collections'): Record<string, string> {
        if (mode === 'nostalgia') {
            return {decade: 'ALL', genre: 'ALL'};
        }
        return {collection_slug: 'ALL'};
    }

    function startRadio(mode: 'nostalgia' | 'collections') {
        console.log('📻 RADIO MODE SELECTED:', mode);

        radioMode = mode;

        // 🚫 Stop here for now — no navigation yet
    }

    function launchNostalgiaAll() {
        const selection = {
            activeGroup: 'decade_genre' as ModeType,
            context: {
                decade: 'ALL',
                genre: 'ALL'
            },
            language,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };

        console.log('🚀 LAUNCHING NOSTALGIA RADIO:', selection);

        saveResumeFromLocal(selection);

        goto(`/car-page?mode=nostalgia&decade=ALL&genre=ALL&language=${language}`);
    }

    function launchNostalgiaGenre(genre: string) {
        const selection = {
            activeGroup: 'decade_genre' as ModeType,
            context: {
                decade: 'ALL',
                genre
            },
            language,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };

        console.log('🎯 LAUNCHING NOSTALGIA GENRE:', selection);

        saveResumeFromLocal(selection);

        goto(`/car-page?mode=nostalgia&decade=ALL&genre=${genre}&language=${language}`);
    }

    function launchCollectionsAll() {
        const selection = {
            activeGroup: 'collection' as ModeType,
            context: {
                collection_group_slug: 'ALL'
            },
            language,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };

        console.log('🚀 LAUNCHING COLLECTIONS RADIO:', selection);

        saveResumeFromLocal(selection);

        goto(`/car-page?mode=radio_collections&collection_group=ALL&language=${language}`);
    }

    function launchCollectionGroup(groupSlug: string) {
        const selection = {
            activeGroup: 'collection' as ModeType,
            context: {
                collection_group_slug: groupSlug
            },
            language,
            startRank: 1,
            endRank: 9999,
            playbackOrder,
            pauseMode,
            voices: selectedVoices,
            skipPlayed
        };

        console.log('🎯 LAUNCHING COLLECTION GROUP:', selection);

        saveResumeFromLocal(selection);

        goto(`/car-page?mode=radio_collections&collection_group=${groupSlug}&language=${language}`);
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

        console.log('🧠 PROGRAM KEY:', programKey);
        console.log('🧠 HISTORY ENTRY:', entry);

        return entry?.total ?? 0;
    }


    // ─────────────────────────────────────────────
    // Mount: load resume → catalog → apply
    // ─────────────────────────────────────────────
    onMount(async () => {
        pendingSelection = buildSelectionFromResume(loadResumeState());
        console.log('📍 OPTIONS PAGE MOUNTED');

        try {


            const normalized = await loadCatalogOnce();

            decadeOptions = mapOptions(normalized.decades);
            genreOptions = mapOptions(normalized.genres);

            collectionGroups = normalized.collectionGroups ?? [];


            if (pendingSelection) {
                applySelection(pendingSelection);
                pendingSelection = null;
            }

            hydrated = true;
        } catch {
            console.error('❌ Error loading catalog.');
        }
    });

    // ─────────────────────────────────────────────
    // Sync selected language into currentSelection
    // ─────────────────────────────────────────────
    $: if (browser && hydrated) {
        currentSelection.update(s => {
            if (s.language === language) return s;
            return {
                ...s,
                language
            };
        });
    }
    // ─────────────────────────────────────────────
    // Auto-save (guarded)
    // ─────────────────────────────────────────────
    $: if (browser && hydrated) {
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
            playbackOrder,
            pauseMode,
            voicePlayMode: 'before',
            skipPlayed
        });
    }


</script>


{#if import.meta.env.DEV}
    <div style="position:fixed;top:4px;right:6px;font-size:11px;opacity:.5">
        ROUTE: /options-v2
    </div>
{/if}

<div class="page-shell">
    <HeroHeader/>

    <div class="page">

        <!-- 🔥 RADIO (NEW) -->
        <div class="opt-cell opt-cell--radio">
            <h3 class="section-title">📻🐕 TopSpot40 Radio 📻🐕 </h3>

            <div class="radio-description">
                Nostalgia mixes decades and genres. Collections plays themed playlists.
            </div>

            <div class="radio-description">
                DJ Mode • Shuffle • Favor New • Continuous
            </div>

            <div class="radio-buttons">
                <button
                        class:active={radioMode === 'nostalgia'}
                        on:click={() => startRadio('nostalgia')}
                >
                    Nostalgia Radio
                </button>

                <button
                        class:active={radioMode === 'collections'}
                        on:click={() => startRadio('collections')}
                >
                    Collections Radio
                </button>
            </div>

            <div class="radio-separator">
                <span>Stations</span>
            </div>


            {#if radioMode === 'nostalgia'}
                <div style="margin-top: 10px;">
                    <button class="start-all-btn" on:click={launchNostalgiaAll}>
                        <span class="icon">📻</span>
                        <span>Start All Genres: 1950s to the Present</span>
                    </button>
                </div>

                <div class="radio-genres">
                    {#each genreOptions as g}
                        <button
                                class="genre-btn"
                                class:selected={selectedGenre === g.id}
                                on:click={() => {
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
                    <button class="start-all-btn" on:click={launchCollectionsAll}>
                        <span class="icon">📻</span>
                        <span>Start All Collections</span>
                    </button>
                </div>

                <!-- 🔥 NEW: Collection Group Buttons -->
                <div class="radio-genres">
                    {#each collectionGroups as group}
                        <button
                                class="genre-btn"
                                on:click={() => launchCollectionGroup(group.slug)}
                        >
                            <span class="icon">📀</span>
                            <span>{group.name}</span>
                        </button>
                    {/each}
                </div>
            {/if}

        </div>

        <!-- ✅ Playback History now at top -->
        <PlaybackHistoryPanel/>


        <!-- TOP CONFIG GRID (4 + 4) -->
        <section class="options-grid options-grid--compact">

            <!-- LEFT: CONTENT -->
            <div class="opt-cell opt-cell--content">
                <h3 class="section-title">Settings</h3>

                <div class="compact-block compact-block--content">
                    <LanguageSelector bind:language/>
                    <VoiceContentSelector bind:selectedVoices/>
                </div>

                <div class="opt-cell opt-cell--playback">
                    <h3 class="section-title">Playback</h3>

                    <div class="playback-section">

                        <!-- ORDER -->
                        <div class="playback-group">
                            <div class="label">Order</div>
                            <div class="grid">
                                <button class:selected={playbackOrder === 'up'} on:click={() => playbackOrder = 'up'}>
                                    Up
                                </button>
                                <button class:selected={playbackOrder === 'down'}
                                        on:click={() => playbackOrder = 'down'}>
                                    Down
                                </button>
                                <button class:selected={playbackOrder === 'shuffle'}
                                        on:click={() => playbackOrder = 'shuffle'}>
                                    Shuffle
                                </button>
                            </div>
                        </div>

                        <!-- TRACK STRATEGY -->
                        <div class="playback-group">
                            <div class="label">Tracks</div>
                            <div class="grid grid-2">
                                <button class:selected={skipPlayed} on:click={() => skipPlayed = true}>
                                    Favor New
                                </button>
                                <button class:selected={!skipPlayed} on:click={() => skipPlayed = false}>
                                    All Equal
                                </button>
                            </div>
                        </div>

                        <!-- FLOW -->
                        <div class="playback-group">
                            <div class="label">Flow</div>
                            <div class="grid grid-2">
                                <button class:selected={pauseMode === 'pause'} on:click={() => pauseMode = 'pause'}>
                                    Pause
                                </button>
                                <button class:selected={pauseMode === 'continuous'}
                                        on:click={() => pauseMode = 'continuous'}>
                                    Continuous
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <!-- RIGHT: PLAYBACK + RADIO STACK -->
            <div class="right-column">


            </div>

        </section>


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
       OPTIONS GRID (CORE UI)
    ========================= */

    .options-grid {
        display: grid;
        gap: 1.2rem;
        grid-template-columns: repeat(4, minmax(200px, 1fr));
        margin-bottom: 2rem;
    }

    .options-grid--compact {
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        grid-template-columns: 1fr 1fr;
        align-items: start;
    }

    .opt-cell--content,
    .opt-cell--playback {
        min-width: 0;
    }

    @media (max-width: 1100px) {
        .options-grid--compact {
            grid-template-columns: 1fr;
        }
    }

    @media (max-width: 700px) {
        .options-grid--compact {
            grid-template-columns: 1fr;
        }

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

    .compact-block {
        display: flex;
        flex-direction: column;
        gap: 12px;
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
        grid-template-columns: repeat(2, 1fr);
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


    /* =========================
       PLAYBACK SECTION (FINAL)
    ========================= */

    .playback-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .playback-group {
        display: grid;
        grid-template-columns: 70px 1fr;
        align-items: center;
        column-gap: 10px;
    }

    .playback-group .label {
        font-size: 0.8rem;
        color: #ccc;
    }

    /* GRID FOR BUTTONS */
    .grid {
        display: grid;
        gap: 6px;
    }

    /* 3 buttons (Order) */
    .grid {
        grid-template-columns: repeat(3, 1fr);
    }

    /* 2 buttons (Tracks, Flow) */
    .grid-2 {
        grid-template-columns: repeat(2, 1fr);
    }

    /* BUTTON STYLE (UNIFIED) */
    .grid button {
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .grid button:hover {
        border-color: #666;
    }

    /* SELECTED */
    .grid button.selected {
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

    .radio-separator {
        display: flex;
        align-items: center;
        margin: 10px 0 12px;
        opacity: 0.9;
    }

    .radio-separator::before,
    .radio-separator::after {
        content: '';
        flex: 1;
        border-top: 1px dashed rgba(207, 184, 124, 0.35);
    }

    .radio-separator span {
        padding: 0 8px;
        font-size: 0.7rem;
        color: rgba(207, 184, 124, 0.7);
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }
</style>
