<script lang="ts">
    console.log('🚗 MODULE LOADED');
    import {onMount, onDestroy} from 'svelte';
    import CarModePlayerPanel from '$lib/components/car/CarModePlayerPanel.svelte';

    import {get} from 'svelte/store';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

    import CarModeHeader from '$lib/components/car/CarModeHeader.svelte';
    import type {ResumeState} from '$lib/utils/smartResume';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        programHistoryStore,
        markRankPlayed,
        type ProgramKey
    } from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';
    import {
        startPlaybackPolling,
        stopPlaybackPolling,
        markUserStartedPlayback
    } from '$lib/carmode/CarMode.poller';


    import {
        currentSelection,
        currentTrack,
        tracks,
        currentRank,
        status,
        showNarrationModal,
        playbackPhase,
        elapsed,
        duration,
        progress,
        isPlaying
    } from '$lib/carmode/CarMode.store';

    import {loadForSelection} from '$lib/carmode/CarMode.loader';


    import {buildSelectionFromUrl} from '$lib/carmode/CarMode.url';
    import {saveResumeState} from '$lib/utils/smartResume';
    import {fetchGroupedCatalog} from '$lib/api/catalog';
    import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';

    let debugParams: Record<string, string> | null = null;
    let collectionNameMap: Record<string, string> = {};
    let shuffleOrder: number[] = [];
    let shuffleIndex = 0;
    let lastProgramKey: string | null = null;
    let programKey: ProgramKey | null = null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    console.log('🌍 Car page API_BASE =', API_BASE);

    $: settings = $playbackSettingsStore;

    function shuffleArray<T>(arr: T[]): T[] {
        const copy = [...arr];

        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }

        return copy;
    }

    function stopNarrationAudio() {
        // Kill any browser-side narration audio still playing
        const audios = document.querySelectorAll('audio');
        audios.forEach(a => {
            a.pause();
            a.currentTime = 0;
        });
    }

    function setNarrationModalOpen(v: boolean): void {
        showNarrationModal.set(v);
    }


    async function playTrackByRank(rank: number) {
        const sel = $currentSelection;
        if (!sel) return;

        const settings = get(playbackSettingsStore);

        // ⭐ FAVORITES MODE (FAV_DG / FAV_COL) → single-track backend
        if (sel.programType === 'FAV_DG' || sel.programType === 'FAV_COL') {
            const trackObj = $tracks.find(t => t.rank === rank);
            if (!trackObj) {
                console.error("No track found for rank:", rank);
                return;
            }

            if (trackObj.rankingId == null) {
                console.error("Favorites playback requires trackObj.rankingId (TrackRanking.id) but it is null");
                return;
            }

            const favPayload = {
                track: {
                    track_id: trackObj.id,
                    spotify_track_id: trackObj.spotifyTrackId,
                    ranking_id: trackObj.rankingId, // ✅ favorites key
                    rank: trackObj.rank,
                    track_name: trackObj.trackName,
                    artist_name: trackObj.artistName
                },
                selection: {
                    language: sel.language, // program-level for now
                    voices: settings.voices,
                    voicePlayMode: settings.voicePlayMode,
                    pauseMode: settings.pauseMode,
                    continuous: settings.pauseMode === 'continuous'
                },
                context: {
                    type: 'favorites',
                    program: sel.programType,          // 'FAV_DG' | 'FAV_COL'
                    decade: sel.context?.decade ?? null,
                    collection_slug: sel.context?.collection_slug ?? null
                }
            };

            console.log('⭐ FAVORITES play-track payload:', favPayload);

            const res = await fetch(`${API_BASE}/playback/play-track`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(favPayload)
            });

            const result = await res.json().catch(() => null);
            console.log('🎬 favorites play-track response:', result);
            return;
        }


        // 🟢 COLLECTION MODE: start a SEQUENCE, not a single track
        if (sel.mode === 'collection') {
            const slug = sel.context?.collection_slug;
            if (!slug) {
                console.error('Missing collection_slug context:', sel.context);
                return;
            }

            const params = new URLSearchParams({
                collection_slug: slug,
                start_rank: String(rank),
                end_rank: String(sel.endRank),
                mode:
                    settings.playbackOrder === 'up'
                        ? 'count_up'
                        : settings.playbackOrder === 'down'
                            ? 'count_down'
                            : 'random',
                continuous: settings.pauseMode === 'continuous' ? 'true' : 'false',
                play_intro: settings.voices.includes('intro') ? 'true' : 'false',
                play_detail: settings.voices.includes('detail') ? 'true' : 'false',
                play_artist_description: settings.voices.includes('artist') ? 'true' : 'false',
                voice_style: settings.voicePlayMode
            });


            console.log('🚀 COLLECTION SEQUENCE:', params.toString());

            const res = await fetch(
                `${API_BASE}/supabase/collections/play-collection-sequence?${params.toString()}`,
                {method: 'GET'}
            );

            const result = await res.json().catch(() => null);
            console.log('📦 collection-sequence response:', result);
            return;
        }

// 🟢 DECADE-GENRE MODE
        if (sel.mode === 'decade_genre') {

            const decade = sel.context?.decade;
            const genre = sel.context?.genre;

            if (!decade || !genre) {
                console.error('Missing decade/genre context:', sel.context);
                return;
            }

            // ⭐ NORMAL decades → single-track playback
            const trackObj = $tracks.find(t => t.rank === rank);
            if (!trackObj) {
                console.error("No track found for rank:", rank);
                return;
            }

            const payload = {
                track: {
                    track_id: trackObj.id,
                    spotify_track_id: trackObj.spotifyTrackId,
                    rank: trackObj.rank,
                    track_name: trackObj.trackName,
                    artist_name: trackObj.artistName
                },
                selection: {
                    language: sel.language,
                    voices: settings.voices,
                    voicePlayMode: settings.voicePlayMode,
                    pauseMode: settings.pauseMode,
                    continuous: settings.pauseMode === 'continuous'
                },
                context: {
                    type: 'decade_genre',
                    decade,
                    genre
                }
            };

            console.log('▶️ SINGLE TRACK payload:', payload);
            console.log('🚀 PLAY TRACK REQUEST', payload);

            const res = await fetch(`${API_BASE}/playback/play-track`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });

            const result = await res.json().catch(() => null);
            console.log('🎬 play-track response:', result);
        }
    }

    // Backend owns playback now. Frontend only signals stop.
    async function clearAllPlayback() {
        try {
            await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});
        } catch {
            console.warn("Backend stop failed (probably already stopped)");
        }
    }


    async function nextTrack() {

        console.log("TRACK COUNT:", $tracks.length);
        console.log("TRACK RANKS:", $tracks.map(t => t.rank));

        if (!$currentTrack || $tracks.length === 0) return;

        const settings = get(playbackSettingsStore);

        stopNarrationAudio();

        // 1. Stop backend playback and WAIT
        await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});

        if (!playedRanks.includes($currentTrack.rank)) {
            playedRanks.push($currentTrack.rank);
        }

        const sel = $currentSelection;

        if (sel) {
            const key: ProgramKey =
                sel.mode === 'collection'
                    ? `COL|${sel.context?.collection_slug}`
                    : `DG|${sel.context?.decade}|${sel.context?.genre}`;

            markRankPlayed(key, $currentTrack.rank);
        }

        // 2. Compute next rank locally
        const {nextRank, skipped} = resolveNextRank(
            $tracks,
            $currentTrack.rank,
            settings.playbackOrder,
            settings.skipPlayed,
            playedRanks
        );

        if (nextRank == null) {
            console.log('⏭ No valid next track (maybe all played)');
            return;
        }

        const next = $tracks.find(t => t.rank === nextRank);
        if (!next) return;

        currentRank.set(next.rank);

        if (skipped > 0) {
            status.set(`🎵 Already heard that one… jumping ahead! (${skipped} skipped)`);
        }

        currentTrack.set(next);

        await new Promise(r => setTimeout(r, 50));

        await playTrackByRank(next.rank);
    }

    async function prevTrack() {
        if (!$currentTrack || $tracks.length === 0) return;

        const settings = get(playbackSettingsStore);

        stopNarrationAudio();
        await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});

        const {prevRank, skipped} = resolvePreviousRank(
            $tracks,
            $currentTrack.rank,
            settings.playbackOrder,
            false, // ignore skipPlayed for Previous navigation
            playedRanks
        );

        if (prevRank == null) {
            console.log('⏮ No valid previous track');
            status.set('⏮ Already at the beginning');
            return;
        }

        const prev = $tracks.find(t => t.rank === prevRank);
        if (!prev) return;

        currentRank.set(prev.rank);
        currentTrack.set(prev);

        if (skipped > 0) {
            status.set(`⏮ Skipped ${skipped} already-played track(s)`);
        }

        await new Promise(r => setTimeout(r, 50));
        await playTrackByRank(prev.rank);
    }


    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    const toTitleCase = (text: string | null | undefined): string =>
        text ? text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : '';

    function resolveNextRank(
        list: CarModeTrack[],
        currentRankValue: number,
        order: 'up' | 'down' | 'shuffle',
        skipPlayedEnabled: boolean,
        playedRanks: number[]
    ): { nextRank: number | null; skipped: number } {

        if (!list.length) return {nextRank: null, skipped: 0};

        const currentIndex = list.findIndex(t => t.rank === currentRankValue);
        if (currentIndex === -1) return {nextRank: null, skipped: 0};

        const isPlayed = (rank: number) =>
            skipPlayedEnabled && playedRanks.includes(rank);

        let skipped = 0;

        if (order === 'up') {
            for (let i = currentIndex + 1; i < list.length; i++) {
                const r = list[i].rank;
                if (!isPlayed(r)) return {nextRank: r, skipped};
                skipped++;
            }
            return {nextRank: null, skipped};
        }

        if (order === 'down') {
            for (let i = currentIndex - 1; i >= 0; i--) {
                const r = list[i].rank;
                if (!isPlayed(r)) return {nextRank: r, skipped};
                skipped++;
            }
            return {nextRank: null, skipped};
        }

// shuffle
        const candidates = skipPlayedEnabled
            ? list.filter(t => !playedRanks.includes(t.rank))
            : list;

        if (!candidates.length) return {nextRank: null, skipped: 0};

// if only one candidate remains, just return it
        if (candidates.length === 1) {
            return {
                nextRank: candidates[0].rank,
                skipped: skipPlayedEnabled ? list.length - candidates.length : 0
            };
        }

// create shuffle order if needed
        if (shuffleOrder.length !== candidates.length || shuffleIndex >= shuffleOrder.length) {
            shuffleOrder = shuffleArray(candidates.map(t => t.rank));
            shuffleIndex = 0;
        }

        const nextRank = shuffleOrder[shuffleIndex++];

        const nextTrack = candidates.find(t => t.rank === nextRank);

        if (!nextTrack) return {nextRank: null, skipped: 0};

        return {
            nextRank: nextTrack.rank,
            skipped: skipPlayedEnabled ? list.length - candidates.length : 0
        };
    }


    let playedRanks: number[] = [];

    $: {
        const sel = $currentSelection;

        if (!sel) {
            shuffleOrder = [];
            shuffleIndex = 0;
            playedRanks = [];
            lastProgramKey = null;
            programKey = null;
        } else {
            const key: ProgramKey =
                sel.mode === 'collection'
                    ? `COL|${sel.context?.collection_slug}`
                    : `DG|${sel.context?.decade}|${sel.context?.genre}`;

            programKey = key;

            if (key !== lastProgramKey) {
                shuffleOrder = [];
                shuffleIndex = 0;
                lastProgramKey = key;
            }

            const history = $programHistoryStore.find(p => p.key === key);
            playedRanks = history?.playedRanks ?? [];
        }
    }


    function resolvePreviousRank(
        list: CarModeTrack[],
        currentRankValue: number,
        order: 'up' | 'down' | 'shuffle',
        skipPlayedEnabled: boolean,
        playedRanks: number[]
    ): { prevRank: number | null; skipped: number } {

        if (!list.length) return {prevRank: null, skipped: 0};

        const currentIndex = list.findIndex(t => t.rank === currentRankValue);
        if (currentIndex === -1) return {prevRank: null, skipped: 0};

        const isPlayed = (rank: number) =>
            skipPlayedEnabled && playedRanks.includes(rank);

        let skipped = 0;

        if (order === 'up') {
            for (let i = currentIndex - 1; i >= 0; i--) {
                const r = list[i].rank;
                if (!isPlayed(r)) return {prevRank: r, skipped};
                skipped++;
            }
            return {prevRank: null, skipped};
        }

        if (order === 'down') {
            for (let i = currentIndex + 1; i < list.length; i++) {
                const r = list[i].rank;
                if (!isPlayed(r)) return {prevRank: r, skipped};
                skipped++;
            }
            return {prevRank: null, skipped};
        }

        // shuffle has no true "previous"
        return {prevRank: null, skipped: 0};
    }

    function resolveInitialRank(
        list: CarModeTrack[],
        order: 'up' | 'down' | 'shuffle',
        skipPlayedEnabled: boolean,
        playedRanks: number[]
    ): { nextRank: number | null; skipped: number } {

        if (!list.length) return {nextRank: null, skipped: 0};

        const sorted = [...list].sort((a, b) => a.rank - b.rank);

        const isPlayed = (rank: number) =>
            skipPlayedEnabled && playedRanks.includes(rank);

        let skipped = 0;

        if (order === 'up') {
            for (const track of sorted) {
                if (!isPlayed(track.rank)) {
                    return {nextRank: track.rank, skipped};
                }
                skipped++;
            }
            return {nextRank: null, skipped};
        }

        if (order === 'down') {
            for (let i = sorted.length - 1; i >= 0; i--) {
                const r = sorted[i].rank;
                if (!isPlayed(r)) {
                    return {nextRank: r, skipped};
                }
                skipped++;
            }
            return {nextRank: null, skipped};
        }

        // shuffle
        const candidates = skipPlayedEnabled
            ? sorted.filter(t => !playedRanks.includes(t.rank))
            : sorted;

        if (!candidates.length) return {nextRank: null, skipped: 0};

        const pick = candidates[Math.floor(Math.random() * candidates.length)];

        return {
            nextRank: pick.rank,
            skipped: skipPlayedEnabled
                ? sorted.length - candidates.length
                : 0
        };
    }

    $: uiDecade =
        $currentSelection?.mode === 'decade_genre'
            ? toTitleCase($currentSelection.context?.decade ?? '')
            : collectionNameMap[$currentSelection?.context?.collection_slug ?? ''] ??
            toTitleCase($currentSelection?.context?.collection_slug ?? '');


    $: uiGenre =
        $currentSelection?.mode === 'decade_genre'
            ? toTitleCase($currentSelection.context?.genre ?? '')
            : '';

    $: headerMode =
        $currentSelection?.mode === 'decade_genre' ||
        $currentSelection?.mode === 'collection'
            ? $currentSelection.mode
            : 'decade_genre';


    function backToOptions() {
        if ($currentSelection && $currentTrack) {

            const settings = get(playbackSettingsStore);

            const resume: ResumeState = {
                // program identity (from selection)
                mode: $currentSelection.mode,
                context: $currentSelection.context ?? {},
                language: $currentSelection.language, // keep language with the program for now

                // progress (from selection)
                startRank: $currentSelection.startRank,
                endRank: $currentSelection.endRank,
                currentRank: $currentRank,

                // playback behavior (from settings store)
                playbackOrder: settings.playbackOrder,
                pauseMode: settings.pauseMode,
                voices: settings.voices,
                skipPlayed: settings.skipPlayed,

                // add if ResumeState includes it
                // voicePlayMode: settings.voicePlayMode,
            };

            // ⭐ THIS LINE WAS MISSING
            saveResumeState(resume);
        }

        window.location.href = '/options-v2';
    }


    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    onMount(async () => {

        console.log('🚗 CarMode onMount START');
        console.log('API BASE:', import.meta.env.VITE_API_BASE_URL);
        console.log('🔥 FULL URL:', window.location.href);

        // 🧹 Step 0: Reset backend transport safely
        try {
            const res = await fetch(`${API_BASE}/playback/reset`, {method: 'POST'});
            const data = await res.json();
            console.log('🧹 Backend playback reset:', data);
        } catch (err) {
            console.warn('⚠️ Backend reset failed (continuing anyway):', err);
        }

        // ⏱ Step 1: Start polling AFTER reset
        startPlaybackPolling();
        console.log('⏱ Playback polling started from onMount');


        const url = new URL(window.location.href);
        const hasParams = url.searchParams.toString().length > 0;

        let sel;
        let initialRank: number | null = null;

        if (hasParams) {
            sel = buildSelectionFromUrl(url);
            console.log('🔥 BUILT SELECTION FROM URL (raw):', sel);

            currentSelection.set(sel);

            console.log('✅ SELECTION AFTER MERGE (store wins):', sel);

            currentSelection.set(sel);

            const cr = url.searchParams.get('currentRank');
            initialRank = cr ? Number(cr) : null;
        } else {
            // If we got here without params, treat it as invalid navigation.
            // This prevents stale store state from causing wrong modes.
            console.warn('⚠️ Car page opened without params — redirecting to Options');
            await goto('/options-v2');
            return;
        }


        try {
            const data = await fetchGroupedCatalog();
            const normalized = normalizeCatalog(data);

            const map: Record<string, string> = {};
            for (const group of normalized.collectionGroups) {
                for (const item of group.items) {
                    map[item.slug] = item.name;
                }
            }

            collectionNameMap = map;
        } catch (err) {
            console.error('Failed to load collection names:', err);
        }

        if (!sel) {
            console.error('No selection available for loadForSelection');
            return;
        }
        await loadForSelection(sel, initialRank);

        // 🧠 Adjust initial track if skipPlayed is enabled
// 🧠 Adjust initial track if skipPlayed is enabled
        const settings = get(playbackSettingsStore);

        /// ─────────────────────────────────────────────
// Prepare Spotify playback (warmup)
// ─────────────────────────────────────────────


        if (url.searchParams.get('debug') === '1') {
            debugParams = Object.fromEntries(url.searchParams.entries());
        }
        console.log('🚗 CarMode onMount END');
    });


    onDestroy(() => {
        stopPlaybackPolling();
        void clearAllPlayback();
    });

</script>


<div class="car-mode-root">
    {#if $currentSelection}
        <CarModeHeader
                decade={uiDecade}
                genre={uiGenre}
                collection={headerMode === 'collection' ? uiDecade : undefined}
                mode={headerMode}
                programType={$currentSelection.programType}
                language={$currentSelection.language}
                voices={settings.voices}
                playbackOrder={$currentSelection.playbackOrder}
                voicePlayMode={settings.voicePlayMode}
                pauseMode={settings.pauseMode}
                skipPlayed={settings.skipPlayed}
                categoryMode="single"
        />
    {/if}

    {#if $currentTrack}

        <CarModePlayerPanel
                currentTrack={$currentTrack}
                tracks={$tracks}
                isPlaying={$isPlaying}
                elapsed={$elapsed}
                duration={$duration}
                progress={$progress}
                phase={$playbackPhase}
                showNarrationModal={$showNarrationModal}
                setShowNarrationModal={setNarrationModalOpen}
                onPrev={prevTrack}
                onNext={nextTrack}
                onPlayPause={async () => {
                if (!$currentTrack) return;

                markUserStartedPlayback();

                currentRank.set($currentTrack.rank);

                await playTrackByRank($currentTrack.rank);
            }}
                onBackToOptions={backToOptions}
        />


    {:else}
        <p class="text-gray-400 italic text-center mt-10">{$status}</p>
    {/if}

    {#if debugParams}
        <div class="debug-panel">
            <h4>Debug Params</h4>
            <pre>{JSON.stringify({urlParams: debugParams, selection: $currentSelection}, null, 2)}</pre>
        </div>
    {/if}

</div>

<style>
    .debug-panel {
        background: rgba(0, 0, 0, 0.45);
        padding: 1rem;
        border-radius: 10px;
        margin: 1rem auto;
        max-width: 900px;
        font-size: 0.85rem;
        color: #ccc;
    }

    .car-mode-root {
        min-height: 100vh;
        width: 100%;
        background: radial-gradient(
                circle at top,
                #1a1a1f 0%,
                #0e0e11 45%,
                #08080a 100%
        );
        color: #fff;
    }

</style>




