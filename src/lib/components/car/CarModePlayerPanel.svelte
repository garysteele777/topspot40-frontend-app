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
        currentTrack && currentTrack.rankingId != null
            ? tracks.findIndex(t => t.rankingId === currentTrack.rankingId)
            : -1;

    $: nextTrack =
        sessionTotal > 0 && currentIndex >= 0
            ? tracks[(currentIndex + 1) % sessionTotal]
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
            programTotal = tracks.length;
            completed = program?.playedRanks.length ?? 0;
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


    $: isRadioMode =
        $currentSelection?.mode === 'decade_genre' &&
        $currentSelection?.context?.decade === 'ALL';


    let lastTrackKey: string | null = null;

    $: {
        const key =
            currentTrack
                ? `${currentTrack.trackName}|${currentTrack.artistName}`
                : null;

        if (key !== lastTrackKey) {
            console.log('Current track v3:', currentTrack);
            lastTrackKey = key;
        }
    }

    $: {
        console.log("SELECTION FULL", $currentSelection);
    }

    $: isFavoritesProgram =
        $currentSelection?.programType === 'FAV_DG' ||
        $currentSelection?.programType === 'FAV_COL';


    $: favoriteTickerText =
        isFavoritesProgram && currentTrack
            ? `From Rank #${currentTrack.sourceRank ?? currentTrack.rank}
           • Decade: ${currentTrack.decadeName ?? currentTrack.decadeSlug ?? ''}
           • Genre: ${currentTrack.genreName ?? currentTrack.genreSlug ?? ''}`
            : null;

    async function nextSet() {
        await fetch('/supabase/decade-genre/next-set', {
            method: 'POST'
        });
    }


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

    <!--    <p style="color: yellow;">-->
    <!--        DEBUG → {$currentSelection?.programType} | radio={isRadioMode ? 'YES' : 'NO'}-->
    <!--    </p>-->


    {#if !isRadioMode}
        <div class="progress-line">
            Completed {completed} of {programTotal} ({Math.round(percent)}%)
            <span class="dot">•</span>
            Remaining {remaining}
        </div>

        <div class="overall-progress">
            <div class="overall-bar" style="width: {percent}%"></div>
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

    .next-line {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-weight: 500;
    }

    .progress-line {
        display: flex;
        justify-content: center; /* centers horizontally */
        align-items: center;
        text-align: center;
        gap: 8px;
        margin-top: 8px;
        width: 100%;
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
