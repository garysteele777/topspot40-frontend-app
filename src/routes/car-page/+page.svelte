<script lang="ts">
    console.log('🚗 MODULE LOADED');
    import {onMount, onDestroy} from 'svelte';
    import CarModePlayerPanel from '$lib/components/car/CarModePlayerPanel.svelte';

    import CarModeHeader from '$lib/components/car/CarModeHeader.svelte';
    import type {ResumeState} from '$lib/utils/smartResume';
    import {get} from 'svelte/store';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {programHistoryStore} from '$lib/carmode/programHistory';

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

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    console.log('🌍 Car page API_BASE =', API_BASE);


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
                    language: sel.language,
                    voices: sel.voices,
                    voicePlayMode: sel.voicePlayMode,
                    pauseMode: sel.pauseMode,
                    continuous: false
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
                    sel.playbackOrder === 'up'
                        ? 'count_up'
                        : sel.playbackOrder === 'down'
                            ? 'count_down'
                            : 'random',
                continuous: sel.pauseMode === 'continuous' ? 'true' : 'false',   // 🔥 THIS IS THE SWITCH
                tts_language: sel.language,
                play_intro: sel.voices.includes('intro') ? 'true' : 'false',
                play_detail: sel.voices.includes('detail') ? 'true' : 'false',
                play_artist_description: sel.voices.includes('artist') ? 'true' : 'false',
                play_track: 'true',
                voice_style: sel.voicePlayMode
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

        // 🟢 DECADE / SINGLE TRACK MODE
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
                voices: sel.voices,
                voicePlayMode: sel.voicePlayMode,
                pauseMode: sel.pauseMode,
                continuous: sel.pauseMode === 'continuous'
            }
            ,
            context:
                sel.mode === 'decade_genre'
                    ? {
                        type: 'decade_genre',
                        decade: sel.context?.decade,
                        genre: sel.context?.genre
                    }
                    : {}
        };

        console.log('▶️ SINGLE TRACK payload:', payload);

        const res = await fetch(`${API_BASE}/playback/play-track`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await res.json().catch(() => null);
        console.log('🎬 play-track response:', result);
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
        if (!$currentTrack || !$tracks || !$currentSelection) return;

        stopNarrationAudio();

        // 1. Stop backend playback and WAIT
        await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});

        // 2. Compute next rank locally
        const {nextRank, skipped} = resolveNextRank(
            $tracks,
            $currentTrack.rank,
            $currentSelection.playbackOrder,
            $currentSelection.skipPlayed ?? false,
            playedRanks
        );

        if (nextRank == null) {
            console.log('⏭ No valid next track (maybe all played)');
            return;
        }

        const next = $tracks.find(t => t.rank === nextRank);
        if (!next) return;

        // 3. Update UI immediately
        currentRank.set(next.rank);

        if (skipped > 0) {
            status.set(`🎵 Already heard that one… jumping ahead! (${skipped} skipped)`);
        }
        currentTrack.set(next);

        console.log(`⏭ Switching to #${next.rank}: ${next.trackName}`);

        // 4. Give backend 50ms to clear old sequence (important)
        await new Promise(r => setTimeout(r, 50));

        // 5. Start new backend playback
        await playTrackByRank(next.rank);
    }


    async function prevTrack() {
        if (!$currentTrack || !$tracks || !$currentSelection) return;

        stopNarrationAudio();

        // 1. Stop backend playback and WAIT
        await fetch(`${API_BASE}/playback/stop`, {method: 'POST'});

        // 2. Compute previous rank locally
        const list = $tracks;
        const idx = list.findIndex(t => t.rank === $currentTrack.rank);
        const prev = list[idx - 1];
        if (!prev) {
            console.log('⏮ Already at first track');
            return;
        }

        // 3. Update UI immediately
        currentRank.set(prev.rank);
        currentTrack.set(prev);

        console.log(`⏮ Switching to #${prev.rank}: ${prev.trackName}`);

        // 4. Give backend time to clear old sequence
        await new Promise(r => setTimeout(r, 50));

        // 5. Start new backend playback
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

        const pick = candidates[Math.floor(Math.random() * candidates.length)];

        return {
            nextRank: pick.rank,
            skipped: skipPlayedEnabled
                ? list.length - candidates.length
                : 0
        };
    }


    let playedRanks: number[] = [];

    $: {
        const sel = $currentSelection;
        if (!sel) {
            playedRanks = [];
        } else {
            const key =
                sel.mode === 'collection'
                    ? `COL|${sel.context?.collection_slug}`
                    : `DG|${sel.context?.decade}|${sel.context?.genre}`;

            const history = $programHistoryStore.find(p => p.key === key);
            playedRanks = history?.playedRanks ?? [];
        }
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

            const resume: ResumeState = {
                mode: $currentSelection.mode,
                context: $currentSelection.context ?? {},

                language: $currentSelection.language,
                startRank: $currentSelection.startRank,
                endRank: $currentSelection.endRank,
                playbackOrder: $currentSelection.playbackOrder,
                pauseMode: $currentSelection.pauseMode,

                voices: $currentSelection.voices,
                skipPlayed: $currentSelection.skipPlayed ?? false,
                currentRank: $currentRank
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
            console.log('🔥 BUILT SELECTION FROM URL:', sel);

            currentSelection.set(sel);

            const cr = url.searchParams.get('currentRank');
            initialRank = cr ? Number(cr) : null;
        } else {
            // 🚀 FAVORITES / INTERNAL NAV CASE
            sel = get(currentSelection);
            console.log('🔥 USING EXISTING SELECTION:', sel);
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
        if (sel.skipPlayed && $currentTrack) {
            const alreadyPlayed = playedRanks.includes($currentTrack.rank);

            if (alreadyPlayed) {
                const {nextRank, skipped} = resolveNextRank(
                    $tracks,
                    $currentTrack.rank,
                    sel.playbackOrder,
                    true,
                    playedRanks
                );

                if (nextRank != null) {
                    const next = $tracks.find(t => t.rank === nextRank);
                    if (next) {
                        currentRank.set(next.rank);
                        currentTrack.set(next);

                        if (skipped > 0) {
                            status.set(`🎵 Already heard that one… jumping ahead! (${skipped} skipped)`);
                        }
                    }
                }
            }
        }

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
                voices={$currentSelection.voices}
                startRank={$currentSelection.startRank}
                endRank={$currentSelection.endRank}
                playbackOrder={$currentSelection.playbackOrder}
                voicePlayMode={$currentSelection.voicePlayMode}
                pauseMode={$currentSelection.pauseMode}
                skipPlayed={$currentSelection.skipPlayed}
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
        markUserStartedPlayback();
        if ($currentTrack) await playTrackByRank($currentTrack.rank);
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




