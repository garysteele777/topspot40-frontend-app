<script lang="ts">
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';
    import CarModeTrackMeta from './CarModeTrackMeta.svelte';
    import CarModeNarration from './CarModeNarration.svelte';
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import CarModeTicker from './CarModeTicker.svelte';

    import type {LoadedTrack} from '$lib/utils/normalizeTrack';
    import type {PlaybackPhase} from '$lib/helpers/car/types';
    import {skipToNextTrack} from '$lib/carmode/CarMode.poller';
    import {playedCount} from '$lib/carmode/CarMode.store';


    /* ─────────────────────────────────────────────
       Props
    ───────────────────────────────────────────── */
    export let currentTrack: LoadedTrack | null = null;
    export let tracks: LoadedTrack[] = [];
    export let phase: PlaybackPhase | null = null;


    export let isPlaying: boolean;
    export let elapsed: number;
    export let duration: number;
    export let progress: number;

    export let onPrev: () => void;
    export let onNext: () => void;
    export let onPlayPause: () => void;
    export let onBackToOptions: () => void;

    export let showNarrationModal: boolean;
    export let setShowNarrationModal: (v: boolean) => void;

    /* ─────────────────────────────────────────────
       Derived values (Next + Progress)
    ───────────────────────────────────────────── */
    $: total = tracks.length;

    $: currentIndex =
        currentTrack
            ? tracks.findIndex(t => t.rank === currentTrack.rank)
            : -1;

    $: nextTrack =
        currentIndex >= 0 && currentIndex < total - 1
            ? tracks[currentIndex + 1]
            : null;

    $: completed = $playedCount;

    $: remaining = total - completed;
    $: percent =
        total > 0
            ? (completed / total) * 100
            : 0;


</script>

<div class="w-full flex flex-col items-center">

    <!-- Player -->
    <div class="w-full max-w-xl mx-auto">
        <MiniPlayer
                coverUrl={currentTrack?.albumArtwork ?? '/default_album.png'}
                trackTitle={currentTrack?.trackName}
                artistName={currentTrack?.artistName}
                {isPlaying}
                onPrev={onPrev}
                onNext={onNext}
                onPlayPause={onPlayPause}
                hideMeta={true}
        />
    </div>

    <!-- Track Meta -->
    <div class="w-full flex justify-center px-4 mt-4">
        <div class="w-full max-w-xl">
            <CarModeTrackMeta
                    {currentTrack}
                    {tracks}
                    {elapsed}
                    {duration}
                    {progress}
                    {phase}
            />
        </div>
    </div>

    <!-- Phase ticker -->
    <CarModeTicker text={phase ?? ''}/>


    <!-- ⭐ NEW: Next + Progress info -->
    {#if total > 0}
        <div class="car-extra-info">
            {#if nextTrack}
                <div class="next-line">
    <span>
        Next: #{nextTrack.rank} – {nextTrack.trackName} – {nextTrack.artistName}
    </span>

                    <button class="next-btn" on:click={skipToNextTrack}>
                        ⏭ Next
                    </button>
                </div>

            {/if}

            <div class="progress-line">
                Completed {completed} of {total}
                <span class="dot">•</span>
                Remaining {remaining}
            </div>

            <div class="overall-progress">
                <div
                        class="overall-bar"
                        style="width: {percent}%">
                </div>
            </div>

        </div>
    {/if}

    <!-- Narration -->
    <div class="w-full flex justify-center px-4 mt-4">
        <CarModeNarration
                track={currentTrack}
                onBackToOptions={onBackToOptions}
                onOpenModal={() => setShowNarrationModal(true)}
        />
    </div>

    <CarModeNarrationModal
            track={currentTrack}
            open={showNarrationModal}
            onClose={() => setShowNarrationModal(false)}
    />

</div>

<style>
    .car-extra-info {
        margin-top: 0.75rem;
        text-align: center;
        opacity: 0.75;
        font-size: 0.8rem;
    }

    .next-line {
        font-weight: 500;
    }

    .progress-line {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .dot {
        padding: 0 6px;
    }


    .next-line {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .next-btn {
        background: #222;
        color: #fff;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 0.7rem;
        cursor: pointer;
    }

    .next-btn:hover {
        background: #333;
    }

    .overall-progress {
        margin-top: 6px;
        height: 6px;
        width: 180px;
        background: #222;
        border-radius: 6px;
        overflow: hidden;
        margin-left: auto;
        margin-right: auto;
    }

    .overall-bar {
        height: 100%;
        background: gold;
        transition: width 250ms ease;
    }


</style>
