<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import CarModePlayerPanel from '$lib/components/car/CarModePlayerPanel.svelte';
    import {derived} from 'svelte/store';

    import {get} from 'svelte/store';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';

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

    let debugParams: Record<string, string> | null = null;
    let collectionNameMap: Record<string, string> = {};
    let lastProgramKey: string | null = null;
    let nextTrackLock = false;

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    $: settings = $playbackSettingsStore;

    function stopNarrationAudio() {
        // Kill any browser-side narration audio still playing
        const audios = document.querySelectorAll('audio');
        audios.forEach(a => {
            a.pause();
            a.currentTime = 0;
        });
    }


    const pauseMessage = derived(
        [playbackPhase, isPlaying],
        ([$phase, $playing]) => {
            if ($playing) return '';

            if ($phase === 'track') {
                return '⏸ Paused — Press ▶ to resume track';
            }

            if ($phase === 'intro' || $phase === 'detail' || $phase === 'artist') {
                return '⏸ Paused — Press ▶ to restart narration';
            }

            return '';
        }
    );


    function setNarrationModalOpen(v: boolean): void {
        showNarrationModal.set(v);
    }

    async function playTrack(trackObj: CarModeTrack) {

        console.log("▶️ playTrack called for:", trackObj.trackName, trackObj.artistName);

        const sel = $currentSelection;
        if (!sel) return;

        const settings = get(playbackSettingsStore);

        let decadeForPlayback: string | undefined;
        let genreForPlayback: string | undefined;

        if (sel.mode !== 'collection') {
            const programDecade = sel.context?.decade;
            decadeForPlayback =
                programDecade === 'ALL'
                    ? trackObj.decadeSlug ?? programDecade
                    : programDecade;

            const programGenre = sel.context?.genre;
            genreForPlayback =
                programGenre === 'ALL'
                    ? trackObj.genreSlug ?? programGenre
                    : programGenre;

            console.log("🎯 Playback decade resolution:", {
                programDecade,
                trackDecade: trackObj.decadeSlug,
                decadeForPlayback
            });

            console.log("🎯 Playback bucket:", {
                decadeForPlayback,
                genreForPlayback
            });
        }


        const payload = {
            track: {
                track_id: trackObj.id,
                ranking_id: trackObj.rankingId,
                spotify_track_id: trackObj.spotifyTrackId,
                rank: trackObj.rank,
                track_name: trackObj.trackName,
                artist_name: trackObj.artistName
            },
            selection: {
                ...sel,

                // 🔥 ADD THIS (critical)
                playbackOrder: settings.playbackOrder,

                voices: settings.voices,
                voicePlayMode: settings.voicePlayMode,
                pauseMode: settings.pauseMode,
                continuous: settings.pauseMode === 'continuous'
            },
            context:
                sel.mode === 'collection'
                    ? {
                        type: 'collection',
                        collection_slug: sel.context?.collection_slug
                    }
                    : {
                        type: 'decade_genre',
                        decade: decadeForPlayback,
                        genre: genreForPlayback
                    }
        };

        console.log("🚀 PLAY TRACK REQUEST", payload);


        if (
            sel?.mode === 'decade_genre' &&
            sel?.context?.decade === 'ALL' &&
            trackObj.rank === 0
        ) {
            console.log('📻 Starting ALL/ALL radio station');

            const settings = get(playbackSettingsStore);

            const params = new URLSearchParams({
                decade: 'ALL',
                genre: sel.context?.genre ?? 'ALL',
                play_intro: String(settings.voices.includes('intro')),
                play_detail: String(settings.voices.includes('detail')),
                play_artist_description: String(settings.voices.includes('artist'))
            });

            console.log("🚀 FINAL SELECTION SENT:", {
                playbackOrder: settings.playbackOrder,
                selection: {
                    ...sel,
                    playbackOrder: settings.playbackOrder
                }
            });

            const res = await fetch(
                `${API_BASE}/supabase/decade-genre/play-sequence?${params.toString()}`,
                {method: 'GET'}
            );

            const data = await res.json();
            console.log('📻 radio response:', data);

            return;
        }

        console.log('🎯 CALLING BACKEND play-track for:', trackObj.trackName);

        console.log('🚀 FINAL PAYLOAD:', payload);

        const res = await fetch(`${API_BASE}/playback/play-track`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await res.json().catch(() => null);
        console.log("🎬 play-track response:", result);
    }


    // Backend owns playback now. Frontend only signals stop.
    async function clearAllPlayback() {
        try {
            await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});
        } catch {
            console.warn("Backend stop failed (probably already stopped)");
        }
    }

    async function stopPlayback() {
        stopNarrationAudio();
        await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});
    }

    async function nextTrack() {

        console.log('⏭ NEXT BUTTON CLICKED');

        if (nextTrackLock) return;
        nextTrackLock = true;

        if (!$currentTrack || $tracks.length === 0) return;

        // await stopPlayback();
        const rankingId = $currentTrack.rankingId;
        const rank = $currentTrack.rank;

// Only block if BOTH are missing (should never happen)
        if (rankingId == null && rank == null) return;

        // track played ranks using rankingId (safer for ALL mode)
        const playedKey = rankingId ?? rank;

        if (playedKey != null && !playedRanks.includes(playedKey)) {
            playedRanks.push(playedKey);
        }

        const sel = $currentSelection;

        if (sel) {
            let key: ProgramKey | null = null;

            if (sel.mode === 'collection') {
                const slug = sel.context?.collection_slug;
                const group = sel.context?.collection_group_slug;

                if (slug && group) {
                    key = `COL|${slug}|${group}` as ProgramKey;
                }
            } else if (sel.mode === 'decade_genre') {
                const decade = $currentTrack.decadeSlug;
                const genre = $currentTrack.genreSlug;

                if (decade && genre) {
                    key = `DG|${decade}|${genre}` as ProgramKey;
                }
            }

            if (key) {
                markRankPlayed(key, $currentTrack.rank);
            }
        }
        //
        // const currentIndex =
        //     $tracks.findIndex(t => t.rankingId === rankingId);
        //
        // if (currentIndex === -1) return;

        if (isRadioMode) {
            console.log('📻 RADIO → NEXT SET');

            const res = await fetch(`${API_BASE}/supabase/decade-genre/next`, {
                method: 'POST'
            });

            const data = await res.json().catch(() => null);
            console.log('⏭ BACKEND NEXT RESPONSE:', data);

        } else {
            console.log('🎵 NORMAL → NEXT TRACK (local)');

            const currentIndex =
                rankingId != null
                    ? $tracks.findIndex(t => t.rankingId === rankingId)
                    : $tracks.findIndex(t => t.rank === rank);

            if (currentIndex === -1) return;

            const nextIndex = (currentIndex + 1) % $tracks.length;
            const next = $tracks[nextIndex];

            currentRank.set(next.rank);
            currentTrack.set(next);

            await new Promise(r => setTimeout(r, 50));

            await playTrack(next);
        }

        setTimeout(() => {
            nextTrackLock = false;
        }, 500);
    }

    async function prevTrack() {
        if (!$currentTrack || $tracks.length === 0) return;

        await stopPlayback();

        const rankingId = $currentTrack.rankingId;
        if (rankingId == null) return;

        const currentIndex =
            $tracks.findIndex(t => t.rankingId === rankingId);

        if (currentIndex === -1) return;

        const prevIndex = (currentIndex - 1 + $tracks.length) % $tracks.length;
        const prev = $tracks[prevIndex];

        currentRank.set(prev.rank);
        currentTrack.set(prev);

        await new Promise(r => setTimeout(r, 50));

        await playTrack(prev);
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    const toTitleCase = (text: string | null | undefined): string =>
        text ? text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : '';


    let playedRanks: number[] = [];

    $: {
        const sel = $currentSelection;

        if (!sel) {
            lastProgramKey = null;
            playedRanks = [];
        } else {
            let key: ProgramKey | null = null;

            if (sel.mode === 'collection') {
                const slug = sel.context?.collection_slug;
                const group = sel.context?.collection_group_slug;

                if (slug && group) {
                    key = `COL|${slug}|${group}` as ProgramKey;
                }
            } else {
                const decade = sel.context?.decade;
                const genre = sel.context?.genre;

                if (decade && genre) {
                    key = `DG|${decade}|${genre}` as ProgramKey;
                }
            }

            if (key !== lastProgramKey) {
                lastProgramKey = key;
            }

            const history = $programHistoryStore.find(p => p.key === key);
            playedRanks = history?.playedRanks ?? [];
        }
    }

    const isRadioMode =
        $currentSelection?.mode === 'decade_genre' &&
        $currentSelection?.context?.decade === 'ALL';

    $: uiDecade =
        $currentSelection?.mode === 'decade_genre'
            ? (
                isRadioMode
                    ? ($currentTrack?.decadeName ?? '')
                    : ($currentTrack?.decadeName ?? toTitleCase($currentSelection.context?.decade ?? ''))
            )
            : collectionNameMap[$currentSelection?.context?.collection_slug ?? ''] ??
            toTitleCase($currentSelection?.context?.collection_slug ?? '');

    $: uiGenre =
        $currentSelection?.mode === 'decade_genre'
            ? (
                isRadioMode
                    ? ($currentTrack?.genreName ?? '')
                    : ($currentTrack?.genreName ?? toTitleCase($currentSelection.context?.genre ?? ''))
            )
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

        window.location.href = '/options-v4';
    }


    async function handleAutoNextTrack() {
        console.log('🎯 EVENT → nextTrack()');

        await new Promise(r => setTimeout(r, 300)); // 🔥 try 300–500ms

        await nextTrack();
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    onMount(async () => {

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

        window.addEventListener('ts-next-track', handleAutoNextTrack);


        const url = new URL(window.location.href);
        const hasParams = url.searchParams.toString().length > 0;

        let sel;
        let initialRank: number | null = null;

        if (hasParams) {
            sel = buildSelectionFromUrl(url);
            console.log('🔥 BUILT SELECTION FROM URL (raw):', sel);

            // 🔥 Normalize programType based on selection
            if (sel.mode === 'decade_genre') {
                const isRadio =
                    sel.context?.decade === 'ALL';

                sel.programType = isRadio ? 'RADIO_DG' : 'DG';
            }

            if (sel.mode === 'collection') {
                const isRadio =
                    sel.context?.collection === 'ALL';

                sel.programType = isRadio ? 'RADIO_COL' : 'COL';
            }

            currentSelection.set(sel);

            const cr = url.searchParams.get('currentRank');
            initialRank = cr ? Number(cr) : null;
        } else {
            // If we got here without params, treat it as invalid navigation.
            // This prevents stale store state from causing wrong modes.
            console.warn('⚠️ Car page opened without params — redirecting to Options');
            await goto('/options-v4');
            return;
        }


        try {
            const normalized = await loadCatalogOnce();

            const map: Record<string, string> = {};
            for (const group of normalized.collectionGroups ?? []) {
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

        /// ─────────────────────────────────────────────
        // Prepare Spotify playback (warmup)
        // ─────────────────────────────────────────────


        if (url.searchParams.get('debug') === '1') {
            debugParams = Object.fromEntries(url.searchParams.entries());
        }
    });


    onDestroy(() => {
        window.removeEventListener('ts-next-track', handleAutoNextTrack);
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

    const playing = get(isPlaying);

    if (playing) {
        console.log('⏸ PAUSE requested');

        await fetch(`${API_BASE}/playback/pause`, {
            method: 'POST'
        });

        return;
    }

    // If NOT playing → decide resume vs new play
    const phase = get(playbackPhase);

if (
    phase === 'track' ||
    phase === 'paused' ||
    phase === 'intro' ||
    phase === 'detail' ||
    phase === 'artist'
) {
    console.log('▶️ RESUME requested');

    const res = await fetch(`${API_BASE}/playback/resume`, {
        method: 'POST'
    });

    const data = await res.json().catch(() => null);


    if (data?.restart_track && $currentTrack) {
        console.log('🔁 Restarting track after narration pause');
        markUserStartedPlayback();
        await playTrack($currentTrack);
    }

    return;
}

console.log('▶️ FRESH PLAY requested');

markUserStartedPlayback();

// 🚀 Always start from logical beginning, not selected track
const firstTrack = $tracks[0];

if (firstTrack) {
    await playTrack(firstTrack);
}
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

    {#if $pauseMessage}
        <div class="pause-banner">
            {$pauseMessage}
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

    .pause-banner {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);

        background: rgba(0, 0, 0, 0.7);
        color: white;

        padding: 10px 16px;
        border-radius: 10px;

        font-size: 14px;
    }

    .pause-banner {
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
        }
    }

</style>




