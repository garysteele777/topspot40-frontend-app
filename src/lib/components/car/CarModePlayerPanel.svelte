<script lang="ts">
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';
    import CarModeTrackMeta from './CarModeTrackMeta.svelte';
    import CarModeNarration from './CarModeNarration.svelte';
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import CarModeTicker from './CarModeTicker.svelte';

    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {PlaybackPhase} from '$lib/helpers/car/types';
    import {skipToNextTrack} from '$lib/carmode/CarMode.poller';

    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistoryStore} from '$lib/carmode/programHistory';


    import {
        isFavorite,
        toggleFavorite,
        type ProgramType
    } from '$lib/favorites/favorites';

    /* ─────────────────────────────────────────────
       Props
    ───────────────────────────────────────────── */
    export let currentTrack: CarModeTrack | null = null;
    export let tracks: CarModeTrack[] = [];
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

    let isFav = false;


    /* ─────────────────────────────────────────────
       Derived values (Next + Progress)
    ───────────────────────────────────────────── */

    $: sessionTotal = tracks.length;

    let completed = 0;
    let programTotal = 0;

    $: currentIndex =
        currentTrack?.rankingId != null
            ? tracks.findIndex(t => t.rankingId === currentTrack.rankingId)
            : -1;


    $: nextTrack =
        currentIndex >= 0 && currentIndex < sessionTotal - 1
            ? tracks[currentIndex + 1]
            : null;

    $: {
        const sel = $currentSelection;
        let key: string | null = null;

        if (sel?.mode === 'decade_genre') {
            const d = sel.context?.decade;
            const g = sel.context?.genre;
            if (d && g) key = `DG|${d}|${g}`;
        }

        if (!key) {
            completed = 0;
            programTotal = 0;
        } else {
            const program = $programHistoryStore.find(p => p.key === key);
            completed = program?.playedRanks.length ?? 0;
            programTotal = program?.total ?? 0;
        }
    }

    $: remaining = Math.max(0, programTotal - completed);

    $: percent =
        programTotal > 0
            ? (completed / programTotal) * 100
            : 0;

    /* ─────────────────────────────────────────────
       Favorites logic (Decade only)
    ───────────────────────────────────────────── */

    let programType: ProgramType | null = null;

    $: programType =
        $currentSelection?.mode === 'decade_genre'
            ? 'DG'
            : null;


    $: programGroup =
        programType === 'DG'
            ? $currentSelection?.context?.decade ?? null
            : null;

    import {favoritesStore} from '$lib/favorites/favorites';

    $: {
        void $favoritesStore; // 👈 force reactive dependency (no unused var)


        isFav =
            !!(
                programType &&
                programGroup &&
                currentTrack?.rankingId != null &&
                isFavorite(
                    programType,
                    programGroup,
                    currentTrack.rankingId
                )
            );
    }


    $: console.log('Current track:', currentTrack);

    $: isFavoritesProgram =
        $currentSelection?.programType === 'FAV_DG' ||
        $currentSelection?.programType === 'FAV_COL';


    $: favoriteTickerText =
        isFavoritesProgram && currentTrack
            ? `From Rank #${currentTrack.sourceRank ?? currentTrack.rank}
           • Decade: ${currentTrack.decadeName ?? currentTrack.decadeSlug ?? ''}
           • Genre: ${currentTrack.genreName ?? currentTrack.genreSlug ?? ''}`
            : null;


    function onToggleFavorite() {
        if (
            !programType ||
            !programGroup ||
            currentTrack?.rankingId == null
        ) {
            return;
        }

        const {added} = toggleFavorite(
            programType,
            programGroup,
            currentTrack.rankingId
        );

        console.log(
            added
                ? `⭐ Saved to ${programGroup} favorites`
                : `❌ Removed from ${programGroup} favorites`
        );
    }
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

    {#if currentTrack?.rankingId != null && $currentSelection?.programType !== 'FAV_DG' && $currentSelection?.programType !== 'FAV_COL'}
        <div class="fav-wrapper">
            <button
                    class="fav-btn"
                    on:click={onToggleFavorite}
                    aria-pressed={isFav}
            >
                {#if isFav}
                    ⭐ Saved to {$currentSelection?.context?.decade} Favorites
                {:else}
                    ☆ Save to {$currentSelection?.context?.decade} Favorites
                {/if}
            </button>
        </div>
    {/if}


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
    <CarModeTicker
            text={
        favoriteTickerText ??
        phase ??
        ''
    }
    />


    {#if programTotal > 0}
        <div class="car-extra-info">
            {#if nextTrack}
                <div class="next-line">
                    <span>
                        {#if $currentSelection?.programType === 'FAV_DG' || $currentSelection?.programType === 'FAV_COL'}
                            Next: Favorite #{currentIndex + 2} – {nextTrack.trackName} – {nextTrack.artistName}
                        {:else}
                            Next: #{nextTrack.rank} – {nextTrack.trackName} – {nextTrack.artistName}
                        {/if}
                    </span>


                    <button class="next-btn" on:click={skipToNextTrack}>
                        ⏭ Next
                    </button>
                </div>
            {/if}

            <div class="progress-line">
                Completed {completed} of {programTotal}
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
    /* ─────────────────────────────────────────────
       Progress + Next Section
    ───────────────────────────────────────────── */

    .car-extra-info {
        margin-top: 0.75rem;
        text-align: center;
        opacity: 0.8;
        font-size: 0.8rem;
    }

    .next-line {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: 500;
    }

    .progress-line {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 2px;
    }

    .dot {
        padding: 0 6px;
    }

    .next-btn {
        background: #222;
        color: #fff;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 4px 10px;
        font-size: 0.7rem;
        cursor: pointer;
        transition: background 150ms ease, border-color 150ms ease;
    }

    .next-btn:hover {
        background: #333;
        border-color: #666;
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

    /* ─────────────────────────────────────────────
       Favorites Button
    ───────────────────────────────────────────── */

    .fav-btn {
        margin-top: 10px;
        padding: 6px 16px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.35);
        background: transparent;
        color: #fff;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 150ms ease;
    }

    .fav-btn:hover {
        border-color: gold;
        color: gold;
    }

    .fav-btn[aria-pressed='true'] {
        background: #cfb87c;
        color: #111;
        border-color: #cfb87c;
    }

    .fav-btn[aria-pressed='true']:hover {
        background: #e3cf98;
        border-color: #e3cf98;
    }

    .fav-wrapper {
        display: flex;
        justify-content: center;
        width: 100%;
        margin-top: 10px;
    }

</style>
