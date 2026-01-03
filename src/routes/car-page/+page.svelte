<script lang="ts">
    import {onMount, onDestroy} from 'svelte';

    import CarModeHeader from '$lib/components/car/CarModeHeader.svelte';

    import {
        currentSelection,
        status
    } from '$lib/carmode/CarMode.store';

    import {buildSelectionFromUrl} from '$lib/carmode/CarMode.url';
    import {loadForSelection} from '$lib/carmode/CarMode.loader';
    import {stopPlaybackPolling} from '$lib/carmode/CarMode.poller';
    import {clearAllPlayback} from '$lib/carmode/CarMode.player';

    import CarModeTrackMeta from '$lib/components/car/CarModeTrackMeta.svelte';
    import {currentTrack} from '$lib/carmode/CarMode.store';


    onMount(async () => {
        console.log('🚗 CarMode bootstrap START');

        const url = new URL(window.location.href);
        const sel = buildSelectionFromUrl(url);

        currentSelection.set(sel);
        await loadForSelection(sel);

        console.log('🚗 CarMode bootstrap DONE');
    });

    onDestroy(() => {
        stopPlaybackPolling();
        void clearAllPlayback();
    });
</script>

{#if $currentSelection}
    <CarModeHeader
            decade={$currentSelection.context?.decade}
            genre={$currentSelection.context?.genre}
            collection={$currentSelection.context?.collection_slug}
            mode={$currentSelection.mode ?? 'decade_genre'}
            language={$currentSelection.language}
            voices={$currentSelection.voices}
            startRank={$currentSelection.startRank}
            endRank={$currentSelection.endRank}
            playbackOrder={$currentSelection.playbackOrder}
            voicePlayMode={$currentSelection.voicePlayMode}
            pauseMode={$currentSelection.pauseMode}
            categoryMode="single"
    />
{:else}
    <p class="text-gray-400 italic text-center mt-10">
        {$status}
    </p>
{/if}

{#if $currentTrack}
    <CarModeTrackMeta currentTrack={$currentTrack}/>

{:else}
    <p class="text-gray-500 text-center mt-6">
        Waiting for track…
    </p>
{/if}
