<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */

    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {goto} from '$app/navigation';

    // ─────────────────────────────────────────────
    // Stores
    // ─────────────────────────────────────────────
    import {resetSelection} from '$lib/stores/selection';
    import {upsertProgram} from '$lib/carmode/programHistory';

    // ─────────────────────────────────────────────
    // Modular helpers
    // ─────────────────────────────────────────────
    import {
        buildProgramKey,
        buildProgramLabel,
        getTotalTracks
    } from '$lib/options/programHelpers';

    import {loadCatalog} from '$lib/options/loadCatalog';
    import {buildSelectionFromResume} from '$lib/options/applyResume';
    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import {summarizeVoices, summarizeSelection} from '$lib/options/summaries';

    import {loadResumeState} from '$lib/utils/smartResume';
    import {launchWithPlayback} from '$lib/utils/buildLaunchUrl';

    // ─────────────────────────────────────────────
    // UI Components
    // ─────────────────────────────────────────────
    import HeroHeader from '$lib/components/options/HeroHeader.svelte';
    import ModeToggle from '$lib/components/options-v2/ModeToggle.svelte';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';
    import PlaybackOrderSelector from '$lib/components/options-v2/PlaybackOrderSelector.svelte';
    import PauseModeSelector from '$lib/components/options-v2/PauseModeSelector.svelte';
    import PlaybackHistoryPanel from '$lib/components/options-v2/PlaybackHistoryPanel.svelte';
    import ListPicker from '$lib/components/options/ListPicker.svelte';

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

    type CollectionItem = { slug: string; name: string };
    type CollectionGroup = {
        slug: string;
        name: string;
        items: CollectionItem[];
        open?: boolean;
    };

    // ─────────────────────────────────────────────
    // Core UI State
    // ─────────────────────────────────────────────
    let activeGroup: ModeType = 'decade_genre';
    let language: Language = 'en';
    let selectedVoices: VoicePart[] = ['intro'];

    let startRank = 1;
    let endRank = 40;

    let playbackOrder: PlaybackOrder = 'up';
    let pauseMode: 'pause' | 'continuous' = 'pause';

    const categoryMode = 'single' as const;
    const voicePlayMode = 'before' as const;
    // Selections
    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    // Options
    let decadeOptions: OptionItem[] = [];
    let genreOptions: OptionItem[] = [];
    let collectionGroups: CollectionGroup[] = [];
    let skipPlayed = false;
    let status: 'Loading…' | 'Ready' | '❌ Error loading catalog.' = 'Loading…';

    // Resume lifecycle guard
    let hydrated = false;
    let pendingSelection: ReturnType<typeof buildSelectionFromResume> | null = null;

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

    function applySelection(selection: any) {
        activeGroup = selection.mode;
        language = selection.language;
        selectedVoices = selection.voices ?? ['intro'];
        startRank = selection.startRank ?? 1;
        endRank = selection.endRank ?? 40;
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

    // ─────────────────────────────────────────────
    // Derived UI
    // ─────────────────────────────────────────────
    $: modeLabel = activeGroup === 'decade_genre' ? 'Decade–Genre' : 'Collection Group';
    $: rankLabel = `${startRank}–${endRank}`;

    $: voicesSummary = summarizeVoices(selectedVoices);
    $: selectionSummary = summarizeSelection(activeGroup, decades, genres, collections);

    $: canLaunchDecadeGenre =
        activeGroup === 'decade_genre' && decades.length && genres.length;

    $: canLaunchCollection =
        activeGroup === 'collection' && collections.length;

    // ─────────────────────────────────────────────
    // Mount: load resume → catalog → apply
    // ─────────────────────────────────────────────
    onMount(async () => {
        pendingSelection = buildSelectionFromResume(loadResumeState());

        try {
            const normalized = await loadCatalog();

            decadeOptions = mapOptions(normalized.decades);
            genreOptions = mapOptions(normalized.genres);
            collectionGroups = (normalized.collectionGroups ?? []).map((g: any) => ({
                ...g,
                open: false
            }));

            status = 'Ready';

            if (pendingSelection) {
                applySelection(pendingSelection);
                pendingSelection = null;
            }

            hydrated = true;
        } catch {
            status = '❌ Error loading catalog.';
        }
    });

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

    $: playbackOrderLabel =
        playbackOrder === 'up'
            ? 'Count Up'
            : playbackOrder === 'down'
                ? 'Count Down'
                : 'Shuffle';

    $: skipPlayedLabel = skipPlayed ? 'Skip Played' : null;

    $: betweenTracksLabel =
        pauseMode === 'pause' ? 'Pause Between' : 'Continuous';


    // ─────────────────────────────────────────────
    // UI actions / missing handlers
    // ─────────────────────────────────────────────

    function handleActivate(event: CustomEvent) {

        const {group, id} = event.detail ?? {};
        if (!group || !id) return;

        if (group === 'decade') decades = [id];
        if (group === 'genre') genres = [id];
    }

    function handleChange(event: CustomEvent) {

        const {group, selected} = event.detail ?? {};
        if (!group || !Array.isArray(selected)) return;

        if (group === 'decade') decades = selected;
        if (group === 'genre') genres = selected;
    }

    function isCollectionSelected(slug: string): boolean {
        return collections.includes(slug);
    }

    function toggleCollection(slug: string): void {
        activeGroup = 'collection';
        collections = collections[0] === slug ? [] : [slug];
    }

    function expandAll() {
        collectionGroups = collectionGroups.map(g => ({...g, open: true}));
    }

    function collapseAll() {
        collectionGroups = collectionGroups.map(g => ({...g, open: false}));
    }


    function findCollectionMeta(slug: string) {
        for (const group of collectionGroups) {
            const match = group.items.find(i => i.slug === slug);
            if (match) {
                return {
                    collectionGroup: group.name,
                    collectionGroupSlug: group.slug
                };
            }
        }
        return {};
    }


    // ─────────────────────────────────────────────
    // Actions
    // ─────────────────────────────────────────────
    async function launchCarMode() {
        const base = {
            layoutMode: 'car' as const,
            language,
            voices: selectedVoices,
            startRank,
            endRank,
            playbackOrder,
            pauseMode,
            voicePlayMode: 'before',
            skipPlayed
        };

        const payload =
            activeGroup === 'decade_genre'
                ? {...base, decade: decades[0], genre: genres[0]}
                : {
                    ...base,
                    collection: collections[0],
                    collectionCategory: findCollectionMeta(collections[0]).collectionGroupSlug
                };


        const url = await launchWithPlayback(
            payload as Parameters<typeof launchWithPlayback>[0]
        );

        if (!url) return;

        if (browser) {
            const key = buildProgramKey(activeGroup, decades, genres, collections);
            const label = buildProgramLabel(activeGroup, decades, genres, collections);

            if (activeGroup === 'collection' && collections[0]) {
                upsertProgram(
                    key,
                    label,
                    getTotalTracks(startRank, endRank),
                    findCollectionMeta(collections[0])   // ⭐ THIS IS IT
                );
            } else {
                upsertProgram(
                    key,
                    label,
                    getTotalTracks(startRank, endRank)
                );
            }
        }


        await goto(url);
    }

    function resetOptions() {
        resetSelection();
        activeGroup = 'decade_genre';
        decades = [];
        genres = [];
        collections = [];
        startRank = 1;
        endRank = 40;
        playbackOrder = 'up';
        pauseMode = 'pause';
        selectedVoices = ['intro'];
        skipPlayed = false;
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
            <span class="crumb-sep">›</span>
            <span class="crumb">{playbackOrderLabel}</span>

            {#if skipPlayedLabel}
                <span class="crumb-sep">›</span>
                <span class="crumb crumb--strong">{skipPlayedLabel}</span>
            {/if}

            <span class="crumb-sep">›</span>
            <span class="crumb">{betweenTracksLabel}</span>
        </div>

        <!-- ✅ Playback History now at top -->
        <PlaybackHistoryPanel/>


        <!-- TOP CONFIG GRID (4 + 4) -->
        <section class="options-grid">
            <div class="opt-cell opt-cell--row1">
                <ModeToggle
                        modeType={activeGroup}
                        setMode={(mode: ModeType) => {
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
                <LanguageSelector bind:language/>
            </div>

            <div class="opt-cell opt-cell--row1">
                <VoiceContentSelector bind:selectedVoices/>
            </div>

            <div class="opt-cell opt-cell--row2">
                <PlaybackOrderSelector bind:playbackOrder/>
                <div class="opt-cell opt-cell--row2">
                    <label class="checkbox-row">
                        <input
                                type="checkbox"
                                bind:checked={skipPlayed}
                        />
                        <span>Skip Played Tracks</span>
                    </label>
                </div>
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

                    </header>

                    <div class="picker-group__body picker-group__body--decade-genre">
                        <ListPicker
                                title="Decades"
                                group="decade"
                                mode="single"
                                activeGroup={activeGroup === 'decade_genre' ? 'decade' : null}
                                options={decadeOptions}
                                bind:selected={decades}
                                on:activate={handleActivate}
                                on:change={handleChange}
                        />

                        <ListPicker
                                title="Genres"
                                group="genre"
                                mode="single"
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

                        </div>
                    </header>

                    <div class="picker-group__body picker-group__body--collections">
                        {#if status !== 'Ready'}
                            <p>{status}</p>
                        {:else}
                            {#each collectionGroups as group (group.slug + '|' + collections[0])}

                                <details bind:open={group.open} class="collection-group">
                                    <summary>
                                        <span class="group-expander" aria-hidden="true">▸</span>
                                        <span class="group-name">{group.name}</span>
                                    </summary>

                                    <ul>
                                        {#each group.items as col (col.slug)}
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

        <!-- LAUNCH BUTTONS -->
        <div class="launch-modes">
            <button class="launch-btn launch-btn--reset" type="button" on:click={resetOptions}>
                ⏮ Reset
            </button>

            {#if canLaunchDecadeGenre || canLaunchCollection}
                <button class="launch-btn" type="button" on:click={launchCarMode}>
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
        background: linear-gradient(90deg, rgba(10, 10, 10, 0.96), rgba(18, 18, 18, 0.96), rgba(32, 32, 32, 0.96));
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
        transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out, background-color 0.18s ease-out;
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
        background: linear-gradient(to bottom, rgba(14, 14, 14, 0.98), rgba(14, 14, 14, 0.9), transparent);
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
        transition: background-color 0.16s ease-out, color 0.16s ease-out, border-color 0.16s ease-out, transform 0.12s ease-out;
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
        transition: background-color 0.16s ease-out, color 0.16s ease-out;
    }

    .group-expander {
        display: inline-block;
        margin-right: 0.4rem;
        font-size: 0.8rem;
        transform: translateY(-1px);
        transition: transform 0.16s ease-out;
        opacity: 0.85;
    }

    .collection-group[open] .group-expander {
        transform: rotate(90deg) translateY(-1px);
    }

    .collection-group[open] summary {
        background: rgba(207, 184, 124, 0.22);
        color: #fdfaf3;
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
        transition: background-color 0.16s ease-out, transform 0.12s ease-out;
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
        transition: transform 0.16s ease-out, box-shadow 0.16s ease-out, filter 0.16s ease-out;
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

    :global(.collection-row[data-selected='true'] .collection-dot) {
        background: #cfb87c;
        box-shadow: 0 0 6px rgba(207, 184, 124, 0.9);
    }

    .checkbox-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .checkbox-row input[type="checkbox"] {
        accent-color: #cfb87c;
        transform: scale(1.1);
    }
</style>
