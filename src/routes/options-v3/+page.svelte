<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */

    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {buildSelectionFromResume} from '$lib/options/applyResume';
    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import {loadResumeState} from '$lib/utils/smartResume';

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
    let endRank = 40;


    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    const playbackSettings = playbackSettingsStore;

    $: selectedVoices = $playbackSettings.voices as VoicePart[];
    $: playbackOrder = $playbackSettings.playbackOrder as PlaybackOrder;
    $: pauseMode = $playbackSettings.pauseMode as 'pause' | 'continuous';
    $: skipPlayed = !!$playbackSettings.skipPlayed;

    // Options
    let decadeOptions: OptionItem[] = [];
    let genreOptions: OptionItem[] = [];

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

    function applySelection(
        selection: ReturnType<typeof buildSelectionFromResume>
    ) {
        if (!selection) return;

        activeGroup = selection.mode;
        language = selection.language;

        selectedVoices = (selection.voices ?? ['intro']) as VoicePart[];
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
    // Mount: load resume → catalog → apply
    // ─────────────────────────────────────────────
    onMount(async () => {
        pendingSelection = buildSelectionFromResume(loadResumeState());
        console.log('📍 OPTIONS PAGE MOUNTED');

        try {


            const normalized = await loadCatalogOnce();

            decadeOptions = mapOptions(normalized.decades);
            genreOptions = mapOptions(normalized.genres);


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


        <!-- TOP CONFIG GRID (4 + 4) -->
        <section class="options-grid options-grid--compact">

            <div class="opt-cell opt-cell--content">
                <h3 class="section-title">Content</h3>

                <div class="compact-block compact-block--content">
                    <LanguageSelector bind:language/>
                    <VoiceContentSelector bind:selectedVoices/>
                </div>
            </div>

            <div class="opt-cell opt-cell--playback">
                <h3 class="section-title">Playback</h3>

                <div class="compact-block">

                    <!-- ORDER -->
                    <div class="compact-row">
                        <span class="label">Order</span>

                        <button class:selected={playbackOrder === 'up'} on:click={() => playbackOrder = 'up'}>
                            Up
                        </button>
                        <button class:selected={playbackOrder === 'down'} on:click={() => playbackOrder = 'down'}>
                            Down
                        </button>
                        <button class:selected={playbackOrder === 'shuffle'} on:click={() => playbackOrder = 'shuffle'}>
                            Shuffle
                        </button>
                    </div>

                    <!-- TRACK STRATEGY -->
                    <div class="compact-row">
                        <span class="label">Tracks</span>

                        <button class:selected={skipPlayed} on:click={() => skipPlayed = true}>
                            Favor New
                        </button>

                        <button class:selected={!skipPlayed} on:click={() => skipPlayed = false}>
                            All Equal
                        </button>
                    </div>

                    <!-- FLOW -->
                    <div class="compact-row">
                        <span class="label">Flow</span>

                        <button class:selected={pauseMode === 'pause'} on:click={() => pauseMode = 'pause'}>
                            Pause
                        </button>

                        <button class:selected={pauseMode === 'continuous'} on:click={() => pauseMode = 'continuous'}>
                            Continuous
                        </button>
                    </div>

                </div>
            </div>

        </section>

        <!-- ✅ Playback History now at top -->
        <PlaybackHistoryPanel/>


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
        grid-template-columns: 1.35fr 0.95fr;
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

    .compact-row {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
    }

    /* compact buttons */
    .compact-row button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .compact-row button:hover {
        border-color: #666;
    }

    /* SELECTED */
    .compact-row button.selected {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }


    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }

    .compact-row button {
        margin-right: 2px;
    }
</style>
