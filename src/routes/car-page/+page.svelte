<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {fade} from 'svelte/transition';

    // ✅ Playback trigger
    // import { startPlayback } from '$lib/carmode/startPlayback';

    import CarModeHeader from '$lib/components/car/CarModeHeader.svelte';
    import CarModeTrackMeta from '$lib/components/car/CarModeTrackMeta.svelte';
    import CarModeNarration from '$lib/components/car/CarModeNarration.svelte';
    import CarModeNarrationModal from '$lib/components/car/CarModeNarrationModal.svelte';
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';

    import {
        startPlaybackPolling,
        stopPlaybackPolling
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
    import {nextTrack, prevTrack, clearAllPlayback} from '$lib/carmode/CarMode.player';
    import {buildSelectionFromUrl} from '$lib/carmode/CarMode.url';
    import {saveResumeState} from '$lib/utils/smartResume';
    import {fetchGroupedCatalog} from '$lib/api/catalog';
    import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';

    let debugParams: Record<string, string> | null = null;
    let collectionNameMap: Record<string, string> = {};
    let playbackReady = false;
    let playbackError: string | null = null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL;


    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    const toTitleCase = (text: string | null | undefined): string =>
        text ? text.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1)) : '';

    $: titleCased = toTitleCase($currentTrack?.trackName ?? '');
    $: artistCased = toTitleCase($currentTrack?.artistName ?? '');

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
            saveResumeState({
                mode:
                    $currentSelection?.mode === 'collection'
                        ? 'collection'
                        : 'decade_genre',
                context: $currentSelection.context ?? {},
                language: $currentSelection.language,
                startRank: $currentSelection.startRank,
                endRank: $currentSelection.endRank,
                playbackOrder: $currentSelection.playbackOrder,
                currentRank: $currentRank,
                autoAdvance: $currentSelection.pauseMode === 'continuous',

                voices: $currentSelection.voices
            });
        }

        if (typeof window !== 'undefined') {
            window.location.href = '/options-v2';
        }
    }

    // ─────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────
    onMount(async () => {
        console.log('🚗 CarMode onMount START');

        const url = new URL(window.location.href);
        const sel = buildSelectionFromUrl(url);
        currentSelection.set(sel);

        const cr = url.searchParams.get('currentRank');
        const initialRank = cr ? Number(cr) : null;

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

        await loadForSelection(sel, initialRank);

        // ─────────────────────────────────────────────
// Prepare Spotify playback (warmup)
// ─────────────────────────────────────────────
// TEMP: allow playback if backend is reachable
        playbackReady = true;
        playbackError = null;


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


{#if $currentSelection}
    <CarModeHeader
            decade={uiDecade}
            genre={uiGenre}
            collection={headerMode === 'collection' ? uiDecade : undefined}
            mode={headerMode}
            language={$currentSelection.language}
            voices={$currentSelection.voices}
            startRank={$currentSelection.startRank}
            endRank={$currentSelection.endRank}
            playbackOrder={$currentSelection.playbackOrder}
            voicePlayMode={$currentSelection.voicePlayMode}
            pauseMode={$currentSelection.pauseMode}
            categoryMode="single"
    />

{/if}

{#if $currentTrack}
    {#key $currentTrack?.spotifyTrackId ?? $currentTrack?.rank}
        <div class="w-full flex flex-col items-center" in:fade={{ duration: 150 }} out:fade={{ duration: 100 }}>
            <!-- MiniPlayer -->
            <div class="w-full max-w-xl mx-auto">
                {#if playbackError}
                    <p class="text-yellow-400 text-sm text-center mt-2">
                        🎧 {playbackError}
                    </p>
                {/if}


                <MiniPlayer
                        coverUrl={$currentTrack.albumArtwork ?? '/default_album.png'}
                        trackTitle={titleCased}
                        artistName={artistCased}
                        isPlaying={$isPlaying}
                        onPrev={prevTrack}
                        onPlayPause={async () => {

    // 👇 ADD THIS LINE (FIRST LINE)
    console.log('🔥 PLAY BUTTON CLICKED');

		if (!playbackReady) {
			console.warn('Play blocked: Spotify not ready');
			return;
		}

		if ($isPlaying) return;
		if (!$currentTrack || !$currentSelection) return;

		const context =
			$currentSelection.mode === 'decade_genre'
				? {
						type: 'decade_genre',
						decade: $currentSelection.context?.decade,
						genre: $currentSelection.context?.genre
					}
				: {
						type: 'collection',
						collection_slug: $currentSelection.context?.collection_slug
					};

		if (context.type === 'decade_genre' && (!context.decade || !context.genre)) {
			console.error('Missing decade/genre context:', context);
			return;
		}

		if (context.type === 'collection' && !context.collection_slug) {
			console.error('Missing collection_slug context:', context);
			return;
		}

		const payload = {
			track: {
				track_id: $currentTrack.id,
				spotify_track_id: $currentTrack.spotifyTrackId,
				rank: $currentTrack.rank,
				track_name: $currentTrack.trackName,
				artist_name: $currentTrack.artistName
			},
			selection: {
				language: $currentSelection.language,
				voices: $currentSelection.voices,
				voicePlayMode: $currentSelection.voicePlayMode,
				pauseMode: $currentSelection.pauseMode
			},
			context
		};

		console.log('▶️ PLAY clicked, payload:', payload);

        const res = await fetch(`${API_BASE}/playback/play-track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });


		const result = await res.json();
		console.log('🎬 play-track response:', result);

		if (!res.ok || result?.ok !== true) {
			console.error('❌ play-track failed:', result);
			return;
		}

		startPlaybackPolling();
	}}
                        onNext={nextTrack}
                        hideMeta={true}
                />


            </div>

            <!-- Meta + Progress Bar -->
            <div class="w-full flex justify-center px-4 mt-4">
                <div class="w-full max-w-xl">
                    <CarModeTrackMeta
                            currentTrack={$currentTrack}
                            tracks={$tracks}
                            elapsed={$elapsed}
                            duration={$duration}
                            progress={$progress}
                            phase={$playbackPhase}
                    />
                </div>
            </div>

            <!-- STEP 3.1 TEMP DEBUG (REMOVE LATER) -->
            <div style="font-family: monospace; font-size: 12px; opacity: 0.8; margin-top: 6px;">
                phase={$playbackPhase}
                elapsedMs={$elapsed}
                durationMs={$duration}
            </div>


            <!-- Narration + Buttons -->
            <div class="w-full flex justify-center px-4 mt-4">
                <CarModeNarration
                        track={$currentTrack}
                        onOpenModal={() => showNarrationModal.set(true)}
                        onBackToOptions={backToOptions}
                />
            </div>

            <CarModeNarrationModal
                    track={$currentTrack}
                    open={$showNarrationModal}
                    onClose={() => showNarrationModal.set(false)}
            />
        </div>
    {/key}
{:else}
    <p class="text-gray-400 italic text-center mt-10">{$status}</p>
{/if}

{#if debugParams}
    <div class="debug-panel">
        <h4>Debug Params</h4>
        <pre>{JSON.stringify({urlParams: debugParams, selection: $currentSelection}, null, 2)}</pre>
    </div>
{/if}

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
</style>
