<script lang="ts">
    /* eslint-disable svelte/no-navigation-without-resolve */

    import {onMount} from 'svelte';
    import {browser} from '$app/environment';
    import {get} from 'svelte/store';

    import HeroHeader from '$lib/components/options/HeroHeader.svelte';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';

    import PlaybackHistoryPanel from '$lib/components/options-v2/PlaybackHistoryPanel.svelte';
    import ListeningLibraryPanel from '$lib/components/options-v2/ListeningLibraryPanel.svelte';
    import MusicJourneyPanel from '$lib/components/options-v2/MusicJourneyPanel.svelte';
    import PlaybackPreferencesPanel from '$lib/components/options-v2/PlaybackPreferencesPanel.svelte';

    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {selection} from '$lib/stores/selection';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

    import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
    import {buildSelectionFromResume} from '$lib/options/applyResume';

    import {programHistoryStore} from '$lib/carmode/programHistory';

    import type {
        ModeType,
        VoicePart,
        PlaybackOrder,
        Language
    } from '$lib/types/playback';

    type OptionItem = {
        id: string;
        label: string;
        mp3?: string;
    };

    let activeGroup: ModeType = 'decade_genre';

    let language: Language = 'en';
    let languages: Language[] = ['en'];

    let startRank = 1;
    let endRank = 1;

    let playbackOrder: PlaybackOrder = 'up';

    let pauseMode: 'pause' | 'continuous' = 'pause';

    let skipPlayed = false;

    let selectedVoices: VoicePart[] = ['intro'];

    let decades: string[] = [];
    let genres: string[] = [];
    let collections: string[] = [];

    let radioMode:
        | 'nostalgia'
        | 'collections'
        | 'artist_spotlight'
        | null = null;

    let decadeOptions: OptionItem[] = [];
    let genreOptions: OptionItem[] = [];

    let collectionGroups: {
        name: string;
        slug: string;
        items: { name: string; slug: string }[];
    }[] = [];

    let hydrated = false;

    let pendingSelection:
        ReturnType<typeof buildSelectionFromResume> | null = null;


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

        return {
            id,
            label,
            mp3: getStringProp(x, 'mp3') ?? undefined
        };
    }

    function mapOptions(list: unknown): OptionItem[] {
        if (!Array.isArray(list)) return [];

        return list.map(toOptionItem).filter(Boolean) as OptionItem[];
    }

    function resolveOptionId(
        saved: string | undefined,
        options: OptionItem[]
    ): string[] {
        if (!saved) return [];

        const match = options.find(
            (o) =>
                o.id === saved ||
                o.id.toLowerCase() === saved.toLowerCase() ||
                o.label.toLowerCase() === saved.toLowerCase()
        );

        return match ? [match.id] : [];
    }

    function setPlaybackOrder(order: PlaybackOrder) {
        playbackOrder = order;

        selection.update((current) => ({
            ...current,
            playbackOrder: order
        }));
    }

    function applySelection(
        selectionData: ReturnType<typeof buildSelectionFromResume>
    ) {
        if (!selectionData) return;

        activeGroup = selectionData.mode;

        language = selectionData.language;

        languages =
            selectionData.languages ?? [selectionData.language];

        selectedVoices =
            (selectionData.voices ?? ['intro']) as VoicePart[];

        startRank = selectionData.startRank ?? 1;

        const totalTracks = getTotalTracksForSelection(
            selectionData.mode,
            decades,
            genres,
            collections
        );

        endRank = selectionData.endRank ?? totalTracks;

        playbackOrder = selectionData.playbackOrder ?? 'up';

        pauseMode =
            selectionData.pauseMode === 'continuous'
                ? 'continuous'
                : 'pause';

        skipPlayed = !!selectionData.skipPlayed;

        if (selectionData.mode === 'decade_genre') {
            decades = resolveOptionId(
                selectionData.context?.decade,
                decadeOptions
            );

            genres = resolveOptionId(
                selectionData.context?.genre,
                genreOptions
            );

            collections = [];
        } else {
            collections = selectionData.context?.collection_slug
                ? [selectionData.context.collection_slug]
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

        const entry = historyList.find(
            (p) => p.key === programKey
        );

        return entry?.total ?? 0;
    }

    onMount(async () => {
        pendingSelection = null;

        try {
            const normalized = await loadCatalogOnce();

            decadeOptions = mapOptions(normalized.decades);

            genreOptions = mapOptions(normalized.genres);

            collectionGroups =
                normalized.collectionGroups ?? [];

            if (pendingSelection) {
                applySelection(pendingSelection);
                pendingSelection = null;
            }

            hydrated = true;
        } catch {
            console.error('❌ Error loading catalog.');
        }
    });

    $: if (browser && hydrated) {
        saveResumeFromLocal({
            activeGroup,
            context:
                activeGroup === 'decade_genre'
                    ? {
                        ...(decades[0]
                            ? {decade: decades[0]}
                            : {}),
                        ...(genres[0]
                            ? {genre: genres[0]}
                            : {})
                    }
                    : {
                        ...(collections[0]
                            ? {
                                collection_slug:
                                    collections[0]
                            }
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
        ROUTE: /options-v4
    </div>
{/if}

<div class="page-shell">
    <HeroHeader/>

    <div class="page">

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
                collapsed={radioMode !== null}
                onActivate={() => {
                    radioMode = null;
                }}
        />

        <MusicJourneyPanel/>

        <PlaybackPreferencesPanel/>

        <!-- ✅ Playback History now at top -->
        <PlaybackHistoryPanel {language} {languages}/>

        <!-- TOP CONFIG GRID (4 + 4) -->
        <section class="options-grid options-grid--compact">

            <!-- LEFT: CONTENT -->
            <div class="opt-cell opt-cell--content">
                <h3 class="section-title">Settings</h3>

                <div class="compact-block compact-block--content">
                    <LanguageSelector bind:language bind:languages/>
                    <VoiceContentSelector bind:selectedVoices/>
                </div>

                <div class="opt-cell opt-cell--playback">
                    <h3 class="section-title">Playback</h3>

                    <div class="playback-section">

                        <!-- ORDER -->
                        <div class="playback-group">
                            <div class="label">Order</div>
                            <div class="grid">
                                <button class:selected={playbackOrder === 'up'}
                                        on:click={() => setPlaybackOrder('up')}>
                                    Up
                                </button>
                                <button class:selected={playbackOrder === 'down'}
                                        on:click={() => setPlaybackOrder('down')}>
                                    Down
                                </button>
                                <button class:selected={playbackOrder === 'shuffle'}
                                        on:click={() => setPlaybackOrder('shuffle')}>
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
        background: radial-gradient(
                circle at top,
                #1f1f1f 0,
                #121212 45%,
                #050505 100%
        );

        min-height: 100vh;
    }

    .page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 4rem;
        color: #f5f5f5;
    }
</style>