<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */


    import {onMount} from 'svelte';
    import {get} from 'svelte/store';
    import {currentSelection} from '$lib/carmode/CarMode.store';

    import type {SelectionState} from '$lib/stores/selection';
    import {resetSelection} from '$lib/stores/selection';
    import {upsertProgram} from '$lib/carmode/programHistory';
    import type {ProgramKey} from '$lib/carmode/programHistory';
    import {browser} from '$app/environment';

    // UI Components
    import HeroHeader from '$lib/components/options/HeroHeader.svelte';
    import ModeToggle from '$lib/components/options-v2/ModeToggle.svelte';
    import CategoryModeSelector from '$lib/components/options-v2/CategoryModeSelector.svelte';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';
    import TrackRangeSelector from '$lib/components/options-v2/TrackRangeSelector.svelte';
    import PlaybackOrderSelector from '$lib/components/options-v2/PlaybackOrderSelector.svelte';
    import VoicePlaybackSelector from '$lib/components/options-v2/VoicePlaybackSelector.svelte';
    import PauseModeSelector from '$lib/components/options-v2/PauseModeSelector.svelte';
    import PlaybackHistoryPanel from '$lib/components/options-v2/PlaybackHistoryPanel.svelte';

    import {goto} from '$app/navigation';

    import ListPicker from '$lib/components/options/ListPicker.svelte';
    import type {PickerGroup} from '$lib/types/pickers';

    import {loadResumeState, type ResumeState, saveResumeState} from '$lib/utils/smartResume';
    import {launchWithPlayback} from '$lib/utils/buildLaunchUrl';


    // Data
    import type {GroupedCatalog} from '$lib/api/catalog';
    import {fetchGroupedCatalog} from '$lib/api/catalog';
    import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';

    // Types
    type Language = 'en' | 'es' | 'ptbr';
    type VoicePart = 'intro' | 'detail' | 'artist';
    type PlaybackOrder = 'up' | 'down' | 'shuffle';
    type VoicePlayMode = 'before' | 'over';
    type PauseMode = 'pause' | 'continuous';
    type CategoryMode = 'single' | 'multiple';
    import type {ModeType} from '$lib/types/playback';


    // ---------------------------
    // Local State
    // ---------------------------
    let activeGroup: ModeType = 'decade_genre';
    let categoryMode: CategoryMode = 'single';
    let language: Language = 'en';
    let selectedVoices: VoicePart[] = ['intro'];

    let startRank = 1;
    let endRank = 40;

    let playbackOrder: PlaybackOrder = 'up';
    let voicePlayMode: VoicePlayMode = 'before';
    let pauseMode: PauseMode = 'pause';

    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    let status: 'Loading…' | 'Ready' | '❌ Error loading catalog.' = 'Loading…';
    let decadeOptions: { id: string; label: string }[] = [];
    let genreOptions: { id: string; label: string }[] = [];
    let collectionGroups: {
        open: boolean;
        name: string;
        slug: string;
        items: { id: number | string; name: string; slug: string }[];
    }[] = [];

    // Derived State
    let globalMode: CategoryMode = 'single';
    let modeLabel = '';
    let rankLabel = '';
    let voicesSummary = '';
    let selectionSummary = '';
    let canLaunchDecadeGenre = false;
    let canLaunchCollection = false;

    // keep globalMode in sync with categoryMode
    $: globalMode = categoryMode;

    // ---------------------------
    // Load Catalog + Resume
    // ---------------------------
    onMount(async () => {

        // ⭐ FIRST: try currentSelection (global store)
        const sel = get(currentSelection);

        if (sel) {
            activeGroup = sel.mode;

            if (sel.mode === 'decade_genre') {
                decades = sel.context?.decade ? [sel.context.decade] : [];
                genres = sel.context?.genre ? [sel.context.genre] : [];
            } else {
                collections = sel.context?.collection_slug
                    ? [sel.context.collection_slug]
                    : [];
            }

            language = sel.language;
            startRank = sel.startRank;
            endRank = sel.endRank;
        }


        const resumed = loadResumeState();

        if (resumed) {
            activeGroup = resumed.mode === 'collection' ? 'collection' : 'decade_genre';

            if (resumed.mode === 'decade_genre') {
                decades = resumed.context?.decade ? [resumed.context.decade] : [];
                genres = resumed.context?.genre ? [resumed.context.genre] : [];
            } else {
                collections = resumed.context?.collection_slug
                    ? [resumed.context.collection_slug]
                    : [];
            }

            language = resumed.language as Language;
            startRank = resumed.startRank;
            endRank = resumed.endRank;
            playbackOrder = resumed.playbackOrder as PlaybackOrder;
            selectedVoices = resumed.voices.filter(
                (v): v is VoicePart => v === 'intro' || v === 'detail' || v === 'artist'
            );
            pauseMode = resumed.autoAdvance ? 'continuous' : 'pause';

            // ⭐⭐ THIS IS THE MISSING PIECE ⭐⭐
            const selection: SelectionState = {
                mode: resumed.mode,
                context: resumed.context ?? null,

                playIntro: resumed.voices.includes('intro'),
                playDetail: resumed.voices.includes('detail'),
                playArtistDescription: resumed.voices.includes('artist'),

                textIntro: resumed.voices.includes('intro'),
                textDetail: resumed.voices.includes('detail'),
                textArtistDescription: resumed.voices.includes('artist'),

                voices: resumed.voices,
                language: resumed.language,
                playbackOrder: resumed.playbackOrder,

                startRank: resumed.startRank,
                endRank: resumed.endRank,
                currentRank: resumed.currentRank ?? resumed.startRank,

                pauseMode: resumed.autoAdvance ? 'continuous' : 'pause',
                voicePlayMode: 'before',       // or resume this if you add it later
                categoryMode: 'single'         // or resume this if needed
            };


            currentSelection.set(selection);

        }


        try {
            const data: GroupedCatalog = await fetchGroupedCatalog();
            const normalized = normalizeCatalog(data);

            decadeOptions = normalized.decades;
            genreOptions = normalized.genres;
            collectionGroups = normalized.collectionGroups.map((g) => ({
                ...g,
                open: false
            }));

            status = 'Ready';
        } catch (err) {
            console.error(err);
            status = '❌ Error loading catalog.';
        }
    });

    function buildProgramKey(): ProgramKey {
        if (activeGroup === 'decade_genre') {
            return `DG|${decades[0] ?? ''}|${genres[0] ?? ''}` as ProgramKey;
        }
        return `COL|${collections[0] ?? ''}` as ProgramKey;
    }


    function buildProgramLabel(): string {
        if (activeGroup === 'decade_genre') {
            return `${decades[0] ?? '—'} • ${genres[0] ?? '—'}`;
        }
        return `${collections[0] ?? '—'}`;
    }

    function getTotalTracks(): number {
        return Math.max(0, endRank - startRank + 1);
    }


    // ---------------------------
    // Picker handlers
    // ---------------------------
    function handleActivate(e: CustomEvent<{ group: PickerGroup }>) {
        const g = e.detail.group;
        activeGroup = g === 'decade' || g === 'genre' ? 'decade_genre' : 'collection';
    }

    function handleChange(e: CustomEvent<{ group: PickerGroup; selected: string[] }>) {
        const {group, selected} = e.detail;

        if (group === 'decade') decades = selected;
        if (group === 'genre') genres = selected;
        if (group === 'collection') collections = selected;

        // ⭐⭐⭐ ADD THIS ⭐⭐⭐
        const context: Record<string, string> = {};

        if (activeGroup === 'decade_genre') {
            if (decades[0]) context.decade = decades[0];
            if (genres[0]) context.genre = genres[0];
        } else {
            if (collections[0]) context.collection_slug = collections[0];
        }

        currentSelection.set({
            mode: activeGroup,
            context,

            playIntro: selectedVoices.includes('intro'),
            playDetail: selectedVoices.includes('detail'),
            playArtistDescription: selectedVoices.includes('artist'),

            textIntro: selectedVoices.includes('intro'),
            textDetail: selectedVoices.includes('detail'),
            textArtistDescription: selectedVoices.includes('artist'),

            voices: selectedVoices,
            language,
            playbackOrder,

            startRank,
            endRank,
            currentRank: startRank,

            pauseMode,
            voicePlayMode,
            categoryMode
        });
    }


    // ---------------------------
    // Collections helpers
    // ---------------------------
    function isCollectionSelected(slug: string) {
        return collections.includes(slug);
    }

    function toggleCollection(slug: string) {
        // ✅ Ensure Collections area is the active group when a collection is clicked
        activeGroup = 'collection';

        if (categoryMode === 'single') {
            collections = collections.includes(slug) ? [] : [slug];
            return;
        }

        collections = isCollectionSelected(slug)
            ? collections.filter((s) => s !== slug)
            : [...collections, slug];
    }


    function expandAll() {
        collectionGroups = collectionGroups.map((g) => ({...g, open: true}));
    }

    function collapseAll() {
        collectionGroups = collectionGroups.map((g) => ({...g, open: false}));
    }

    function selectAllDecadeGenre() {
        decades = decadeOptions.map((d) => d.id);
        genres = genreOptions.map((g) => g.id);
    }

    function clearDecadeGenre() {
        decades = [];
        genres = [];
    }

    function selectAllCollections() {
        collections = collectionGroups.flatMap((g) => g.items.map((i) => i.slug));
    }

    function clearCollections() {
        collections = [];
    }

    function resetOptions() {
        // ⭐⭐ reset global store FIRST
        resetSelection();

        // ⭐⭐ then reset local UI state
        activeGroup = 'decade_genre';
        categoryMode = 'single';
        language = 'en';
        selectedVoices = ['intro'];

        startRank = 1;
        endRank = 40;

        playbackOrder = 'up';
        voicePlayMode = 'before';
        pauseMode = 'pause';

        decades = [];
        genres = [];
        collections = [];

        collectionGroups = collectionGroups.map((g) => ({...g, open: false}));
    }


    // ✅ Enforce single-selection when switching from multiple → single
    $: if (categoryMode === 'single' && collections.length > 1) {
        collections = collections.slice(0, 1);
    }


    // --------------------------------------------
    // AUTO-SAVE resume state whenever settings change
    // --------------------------------------------
    $: {
        const context: Record<string, string> = {};

        if (activeGroup === 'decade_genre') {
            if (decades[0]) context.decade = decades[0];
            if (genres[0]) context.genre = genres[0];
        } else if (activeGroup === 'collection') {
            if (collections[0]) context.collection_slug = collections[0];
        }

        const state: ResumeState = {
            mode: activeGroup,
            context,
            language,
            startRank,
            endRank,
            playbackOrder,
            currentRank: startRank,
            autoAdvance: pauseMode === 'continuous',
            voices: selectedVoices
        };

        saveResumeState(state);
    }

    // ---------------------------
    // Summaries
    // ---------------------------
    function summarizeVoices(parts: VoicePart[]) {
        const sorted = [...parts].sort();
        if (sorted.length === 0) return 'No narration';
        if (sorted.length === 3) return 'Intro + Detail + Artist';
        if (sorted.length === 2) {
            if (!sorted.includes('artist')) return 'Intro + Detail';
            if (!sorted.includes('detail')) return 'Intro + Artist';
            return 'Detail + Artist';
        }
        return sorted[0] === 'intro'
            ? 'Intro only'
            : sorted[0] === 'detail'
                ? 'Detail only'
                : 'Artist notes only';
    }

    function summarizeSelection(
        group: ModeType,
        decadesSel: string[],
        genresSel: string[],
        collectionsSel: string[]
    ) {
        if (group === 'decade_genre') {
            if (!decadesSel.length && !genresSel.length) return 'No decade/genre selected';
            const decadePart =
                decadesSel.length === 0
                    ? 'No decade'
                    : decadesSel.length === 1
                        ? decadesSel[0]
                        : `${decadesSel.length} decades`;
            const genrePart =
                genresSel.length === 0
                    ? 'No genre'
                    : genresSel.length === 1
                        ? genresSel[0]
                        : `${genresSel.length} genres`;
            return `${decadePart} • ${genrePart}`;
        }

        if (!collectionsSel.length) return 'No collection selected';
        return collectionsSel.length === 1
            ? collectionsSel[0]
            : `${collectionsSel.length} collections`;
    }

    // Derived crumbs + launch guards
    $: modeLabel = activeGroup === 'decade_genre' ? 'Decade–Genre' : 'Collections';
    $: rankLabel = `Rank ${startRank}–${endRank}`;
    $: voicesSummary = summarizeVoices(selectedVoices);
    $: selectionSummary = summarizeSelection(activeGroup, decades, genres, collections);

    $: canLaunchDecadeGenre =
        activeGroup === 'decade_genre' && decades.length > 0 && genres.length > 0;

    $: canLaunchCollection = activeGroup === 'collection' && collections.length > 0;
</script>

{#if import.meta.env.DEV}
    <div style="position:fixed;top:4px;right:6px;font-size:11px;opacity:.5">
        ROUTE: /options-v2
    </div>
{/if}


<div class="page-shell">
    <HeroHeader/>

    <div class="page">
        <!-- SUMMARY STRIP -->
        <div class="breadcrumb">
            <span class="crumb crumb--label">Now configuring:</span>
            <span class="crumb crumb--strong">{modeLabel}</span>
            <span class="crumb-sep">›</span>
            <span class="crumb">{selectionSummary}</span>
            <span class="crumb-sep">›</span>
            <span class="crumb">{rankLabel}</span>
            <span class="crumb-sep">›</span>
            <span class="crumb">{language.toUpperCase()}</span>
            <span class="crumb-sep">›</span>
            <span class="crumb">{voicesSummary}</span>
        </div>

        <!-- TOP CONFIG GRID (Purdue layout: 4 + 4) -->
        <section class="options-grid">
            <!-- Row 1: Mode, Category Mode, Language, Voice Content -->
            <div class="opt-cell opt-cell--row1">
                <ModeToggle
                        modeType={activeGroup}
                        setMode={(mode) => {
            activeGroup = mode;
            if (mode === 'decade_genre') {
              collections = [];
            } else {
              decades = [];
              genres = [];
            }
          }}
                />
            </div>

            <div class="opt-cell opt-cell--row1">
                <CategoryModeSelector bind:categoryMode/>
            </div>

            <div class="opt-cell opt-cell--row1">
                <LanguageSelector bind:language/>
            </div>

            <div class="opt-cell opt-cell--row1">
                <VoiceContentSelector bind:selectedVoices/>
            </div>

            <!-- Row 2: Track Range, Playback Order, Voice Playback, Pause Mode -->
            <div class="opt-cell opt-cell--row2">
                <TrackRangeSelector bind:startRank bind:endRank/>
            </div>

            <div class="opt-cell opt-cell--row2">
                <PlaybackOrderSelector bind:playbackOrder {globalMode}/>
            </div>

            <div class="opt-cell opt-cell--row2">
                <VoicePlaybackSelector bind:voicePlayMode/>
            </div>

            <div class="opt-cell opt-cell--row2">
                <PauseModeSelector bind:pauseMode/>
            </div>
        </section>

        <!-- MAIN GRID -->
        <div class="grid">
            <!-- LEFT: Decades/Genres -->
            <div class="col col--left">
                <section class="picker-group" data-active={activeGroup === 'decade_genre'}>
                    <header class="picker-group__header">
                        <h3>Decade–Genre Selection</h3>

                        {#if categoryMode === 'multiple' && activeGroup === 'decade_genre'}
                            <div class="picker-controls">
                                <button type="button" class="toolbar-btn" on:click={selectAllDecadeGenre}>
                                    Select All
                                </button>
                                <button
                                        type="button"
                                        class="toolbar-btn toolbar-btn--ghost"
                                        on:click={clearDecadeGenre}
                                >
                                    Unselect All
                                </button>
                            </div>
                        {/if}
                    </header>

                    <div class="picker-group__body picker-group__body--decade-genre">
                        <ListPicker
                                title="Decades"
                                group="decade"
                                mode={categoryMode}
                                activeGroup={activeGroup === 'decade_genre' ? 'decade' : null}
                                options={decadeOptions}
                                bind:selected={decades}
                                on:activate={handleActivate}
                                on:change={handleChange}
                        />

                        <ListPicker
                                title="Genres"
                                group="genre"
                                mode={categoryMode}
                                activeGroup={activeGroup === 'decade_genre' ? 'genre' : null}
                                options={genreOptions}
                                bind:selected={genres}
                                on:activate={handleActivate}
                                on:change={handleChange}
                        />
                    </div>
                </section>
            </div>

            <!-- RIGHT: Collections -->
            <div class="col col--right">
                <section class="picker-group" data-active={activeGroup === 'collection'}>
                    <header class="picker-group__header">
                        <h3>Collection Group Selection</h3>

                        <div class="expand-controls">
                            <button type="button" class="toolbar-btn" on:click={expandAll}>
                                Expand All
                            </button>
                            <button type="button" class="toolbar-btn toolbar-btn--ghost" on:click={collapseAll}>
                                Collapse All
                            </button>

                            {#if categoryMode === 'multiple' && activeGroup === 'collection'}
                                <button type="button" class="toolbar-btn" on:click={selectAllCollections}>
                                    Select All
                                </button>
                                <button
                                        type="button"
                                        class="toolbar-btn toolbar-btn--ghost"
                                        on:click={clearCollections}
                                >
                                    Unselect All
                                </button>
                            {/if}
                        </div>
                    </header>

                    <div class="picker-group__body picker-group__body--collections">
                        {#if status !== 'Ready'}
                            <p>{status}</p>
                        {:else}
                            {#each collectionGroups as group (group.slug)}
                                <details bind:open={group.open} class="collection-group">
                                    <summary>
                                        <span class="group-expander" aria-hidden="true">▸</span>
                                        <span class="group-name">{group.name}</span>
                                    </summary>


                                    <ul>
                                        {#each group.items as col (col.slug + ':' + collections.join(','))}
                                            <li>
                                                <button
                                                        type="button"
                                                        class="collection-row"
                                                        data-selected={isCollectionSelected(col.slug)}
                                                        aria-pressed={isCollectionSelected(col.slug)}
                                                        on:click={() => toggleCollection(col.slug)}
                                                >
                                                    <span class="collection-dot"></span>
                                                    <span class="collection-name">{col.name}</span>
                                                </button>
                                            </li>
                                        {/each}
                                    </ul>
                                </details>
                            {/each}

                        {/if}
                    </div>
                </section>
            </div>
        </div>

        <PlaybackHistoryPanel/>


        <!-- LAUNCH BUTTONS -->
        <div class="launch-modes">
            <button class="launch-btn launch-btn--reset" type="button" on:click={resetOptions}>
                ⏮ Reset
            </button>

            {#if canLaunchDecadeGenre}
                <!-- ✅ FIXED: Decade–Genre Car Mode -->
                <button
                        class="launch-btn"
                        type="button"
                        on:click={async () => {
				const url = await launchWithPlayback({
					layoutMode: 'car',
					decade: decades[0],
					genre: genres[0],
					language,
					voices: selectedVoices,
					startRank,
					endRank,
					playbackOrder,
					voicePlayMode,
					pauseMode
				});

				if (!url) return;

                const key = buildProgramKey();
                const label = buildProgramLabel();


                if (browser) {
                  upsertProgram(key, label, getTotalTracks());
                }

                await goto(url);

			}}
                >
                    🚗 Load in Car Mode
                </button>

            {/if}

            {#if canLaunchCollection}
                <!-- ✅ FIXED: Collection Car Mode (WAS BROKEN BEFORE) -->
                <button
                        class="launch-btn"
                        type="button"
                        on:click={async () => {
				const url = await launchWithPlayback({
					layoutMode: 'car',
					collection: collections[0],   // ✅ CRITICAL FIX
					language,
					voices: selectedVoices,
					startRank,
					endRank,
					playbackOrder,
					voicePlayMode,
					pauseMode
				});

				if (!url) return;
await goto(url);

			}}
                >
                    🚗 Load in Car Mode
                </button>

            {/if}
        </div>
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

    .breadcrumb {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
        padding: 0.75rem 1rem;
        border-radius: 999px;
        background: linear-gradient(
                90deg,
                rgba(10, 10, 10, 0.96),
                rgba(18, 18, 18, 0.96),
                rgba(32, 32, 32, 0.96)
        );
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
        border: 1px solid rgba(207, 184, 124, 0.35);
        backdrop-filter: blur(14px);
    }

    .crumb {
        color: #d8d8d8;
    }

    .crumb--label {
        opacity: 0.7;
    }

    .crumb--strong {
        font-weight: 600;
        color: #cfb87c;
    }

    .crumb-sep {
        opacity: 0.5;
    }

    /* TOP GRID: 4 + 4 layout, responsive */
    .options-grid {
        display: grid;
        gap: 1.2rem;
        grid-template-columns: repeat(4, minmax(200px, 1fr));
        margin-bottom: 2rem;
    }

    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        transition: transform 0.18s ease-out,
        box-shadow 0.18s ease-out,
        border-color 0.18s ease-out,
        background-color 0.18s ease-out;
    }

    .opt-cell:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.55);
        border-color: rgba(207, 184, 124, 0.8);
        background: rgba(24, 24, 24, 0.98);
    }

    @media (max-width: 1100px) {
        .options-grid {
            grid-template-columns: repeat(2, minmax(240px, 1fr));
        }
    }

    @media (max-width: 700px) {
        .options-grid {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    /* MAIN GRID: decades/genres vs collections */
    .grid {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 2rem;
        margin-top: 2rem;
    }

    @media (max-width: 960px) {
        .grid {
            grid-template-columns: 1fr;
        }
    }

    .picker-group {
        background: rgba(14, 14, 14, 0.96);
        border-radius: 16px;
        padding: 1.25rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.65);
    }

    .picker-group__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        position: sticky;
        top: 3.75rem;
        padding-bottom: 0.35rem;
        background: linear-gradient(
                to bottom,
                rgba(14, 14, 14, 0.98),
                rgba(14, 14, 14, 0.9),
                transparent
        );
        z-index: 10;
    }

    .picker-group__header h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #fdfaf3;
    }

    .picker-controls,
    .expand-controls {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .toolbar-btn {
        padding: 0.28rem 0.7rem;
        font-size: 0.8rem;
        border-radius: 999px;
        border: 1px solid rgba(207, 184, 124, 0.7);
        background: rgba(207, 184, 124, 0.08);
        color: #f9f5e8;
        cursor: pointer;
        transition: background-color 0.16s ease-out,
        color 0.16s ease-out,
        border-color 0.16s ease-out,
        transform 0.12s ease-out;
    }

    .toolbar-btn:hover {
        background: #cfb87c;
        color: #111;
        border-color: #f5e7b5;
        transform: translateY(-0.5px);
    }

    .toolbar-btn--ghost {
        background: transparent;
    }

    .picker-group__body {
        margin-top: 0.5rem;
    }

    /* Decade + Genre side-by-side */
    .picker-group__body--decade-genre {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
    }

    @media (max-width: 800px) {
        .picker-group__body--decade-genre {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    .picker-group__body--collections {
        max-height: 420px;
        overflow-y: auto;
        padding-right: 0.25rem;
    }

    .picker-group__body--collections::-webkit-scrollbar {
        width: 6px;
    }

    .picker-group__body--collections::-webkit-scrollbar-thumb {
        background: rgba(207, 184, 124, 0.6);
        border-radius: 999px;
    }

    .collection-group summary {
        cursor: pointer;
        list-style: none;
        padding: 0.4rem 0.5rem;
        border-radius: 8px;
        transition: background-color 0.16s ease-out,
        color 0.16s ease-out;
    }

    .group-expander {
        display: inline-block;
        margin-right: 0.4rem;
        font-size: 0.8rem;
        transform: translateY(-1px);
        transition: transform 0.16s ease-out;
        opacity: 0.85;
    }

    /* Rotate the arrow when the group is open */
    .collection-group[open] .group-expander {
        transform: rotate(90deg) translateY(-1px);
    }

    .collection-group[open] summary {
        background: rgba(207, 184, 124, 0.22);
        color: #fdfaf3;
    }

    .collection-group summary:hover .group-expander {
        opacity: 1;
        transform: scale(1.1) translateY(-1px);
    }


    .collection-row {
        width: 100%;
        text-align: left;
        padding: 0.4rem 0.5rem;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: inherit;
        cursor: pointer;
        transition: background-color 0.16s ease-out,
        transform 0.12s ease-out;
    }

    .collection-row:hover {
        background: rgba(207, 184, 124, 0.14);
        transform: translateX(1px);
    }

    .collection-row[aria-pressed='true'] {
        background: rgba(207, 184, 124, 0.3);
    }

    .launch-modes {
        margin-top: 3rem;
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
    }

    .launch-btn {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #cfb87c, #e1d29a);
        color: #111;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 600;
        border: 1px solid #f2e6b7;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
        transition: transform 0.16s ease-out,
        box-shadow 0.16s ease-out,
        filter 0.16s ease-out;
    }

    .launch-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
        filter: brightness(1.05);
    }

    .launch-btn--reset {
        background: #262626;
        color: #f5f5f5;
        border-color: rgba(255, 255, 255, 0.15);
    }

    .launch-btn--reset:hover {
        filter: none;
        background: #333;
    }

    /* Grey-out + disable inactive picker group */
    .picker-group[data-active='false'] {
        opacity: 0.35;
        filter: grayscale(80%);
        pointer-events: none;
    }

    .collection-dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 8px;
        border: 1px solid rgba(207, 184, 124, 0.7);
        background: transparent;
        transition: background-color 0.2s ease, box-shadow 0.2s ease;
    }

    /* ✅ IMPORTANT: must be :global or Svelte will block it */
    :global(.collection-row[data-selected='true'] .collection-dot) {
        background: #cfb87c;
        box-shadow: 0 0 6px rgba(207, 184, 124, 0.9);
    }


</style>
