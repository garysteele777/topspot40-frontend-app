<script lang="ts">
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';
    import CarModeTrackMeta from './CarModeTrackMeta.svelte';
    import CarModeNarration from './CarModeNarration.svelte';
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import CarModeTicker from './CarModeTicker.svelte';
    import {favoritesStore} from '$lib/favorites/favorites';

    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {PlaybackPhase} from '$lib/helpers/car/types';

    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistoryStore} from '$lib/carmode/programHistory';
    import {PROGRAM_TYPES} from '$lib/types/program';


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
    export let onJumpToTrack: ((track: CarModeTrack) => void) | undefined;

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
    let favBurst = false;
    let showTrackList = false;

    $: favoriteRefresh = $favoritesStore;

    /* ─────────────────────────────────────────────
       Derived values (Next + Progress)
    ───────────────────────────────────────────── */

    let completed = 0;
    let programTotal = 0;

    $: {
        const sel = $currentSelection;
        let key: string | null = null;

        if (sel?.mode === 'decade_genre') {
            const d = sel.context?.decade;
            const g = sel.context?.genre;
            if (d && g) key = `DG|${d}|${g}`;
        }

        if (sel?.mode === 'collection') {
            const collection = sel.context?.collection_slug ?? sel.context?.collection;
            const group = sel.context?.collection_group_slug ?? sel.context?.collectionCategory;
            if (collection && group) key = `COL|${collection}|${group}`;
        }

        if (!key) {
            completed = 0;
            programTotal = 0;
        } else {
            const program = $programHistoryStore.find(p => p.key === key);
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
    let programGroup: string | null = null;

    $: programType =
        $currentSelection?.mode === 'decade_genre'
            ? 'DG'
            : $currentSelection?.mode === 'collection'
                ? 'COL'
                : null;

    $: programGroup =
        programType === 'DG'
            ? `${$currentSelection?.context?.decade}|${$currentSelection?.context?.genre}`
            : programType === 'COL'
                ? `${$currentSelection?.context?.collection_slug}|${$currentSelection?.context?.collection_group_slug}`
                : null;


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
        $currentSelection?.programType === 'RADIO_DG' ||
        $currentSelection?.programType === 'RADIO_COL';


    $: collectionNameLabel =
        currentTrack?.collection_name ?? '';

    $: collectionGroupLabel =
        currentTrack?.collection_group_name ?? 'Collections';

    $: isCollectionsRadio =
        $currentSelection?.programType === 'RADIO_COL';


    let lastTrackKey: string | null = null;

    $: {
        const key =
            currentTrack
                ? `${currentTrack.trackName}|${currentTrack.artistName}`
                : null;

        if (key !== lastTrackKey) {
            lastTrackKey = key;
        }
    }


    $: isFavoritesProgram =
        $currentSelection?.programType === PROGRAM_TYPES.FAVORITES_DG ||
        $currentSelection?.programType === PROGRAM_TYPES.FAVORITES_COL;


    $: favoriteTickerText =
        isFavoritesProgram && currentTrack
            ? `From Rank #${currentTrack.sourceRank ?? currentTrack.rank}
           • Decade: ${currentTrack.decadeName ?? currentTrack.decadeSlug ?? ''}
           • Genre: ${currentTrack.genreName ?? currentTrack.genreSlug ?? ''}`
            : null;

    function isPlayed(rank: number): boolean {
        const sel = $currentSelection;
        if (!sel) return false;

        let key: string | null = null;

        if (sel.mode === 'decade_genre') {
            const decade = sel.context?.decade;
            const genre = sel.context?.genre;
            if (decade && genre) key = `DG|${decade}|${genre}`;
        }

        if (sel.mode === 'collection') {
            const collection = sel.context?.collection_slug ?? sel.context?.collection;
            const group = sel.context?.collection_group_slug ?? sel.context?.collectionCategory;
            if (collection && group) key = `COL|${collection}|${group}`;
        }

        if (!key) return false;

        const program = $programHistoryStore.find(p => p.key === key);
        return program?.playedRanks.includes(rank) ?? false;
    }


    function onToggleFavorite() {
        if (
            !programType ||
            !programGroup ||
            currentTrack?.rankingId == null
        ) {
            return;
        }

        toggleFavorite(
            programType,
            programGroup,
            currentTrack.rankingId
        );

        // 🔥 trigger animation
        favBurst = false;
        requestAnimationFrame(() => {
            favBurst = true;
        });


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

    {#if isCollectionsRadio}
        <div class="radio-header">
            <div class="set-label">
                Set {currentTrack?.setNumber ?? 1} • Group: {collectionGroupLabel}
            </div>

            <div class="program-label">
                Collection: {collectionNameLabel}
            </div>

            <div class="track-label">
                Track {currentTrack?.blockPosition ?? 1} of {currentTrack?.blockSize ?? tracks.length}
            </div>
        </div>
    {/if}

    {#if currentTrack && !isRadioMode}
        <div class="rank-line">
            <button
                    class="fav-star"
                    class:active={isFav}
                    class:burst={favBurst}
                    on:click={onToggleFavorite}
                    on:animationend={() => favBurst = false}
                    aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
                ★
            </button>

            <span>
            {currentTrack.rank} of {tracks.length}
                {#if currentTrack.yearReleased}
                • {currentTrack.yearReleased}
            {/if}
        </span>
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
                onOpenTrackList={!isRadioMode ? (() => showTrackList = true) : undefined}
        />
    </div>

    <CarModeNarrationModal
            track={currentTrack}
            open={showNarrationModal}
            onClose={() => setShowNarrationModal(false)}
    />

    {#if showTrackList}
        <div class="tracklist-overlay">
            <div class="tracklist-panel">

                <div class="tracklist-header">
                    <div>
                        <h3>Track List</h3>
                        <div class="tracklist-subtitle">
                            Click ★ to add favorites • Click Track Title to Jump to that Track
                        </div>
                    </div>

                    <button
                            class="close-btn"
                            on:click={() => showTrackList = false}
                    >
                        ✕
                    </button>
                </div>

                <div class="tracklist-scroll">

                    <div class="track-row track-row-header">
                        <span>Played</span>
                        <span>Fav</span>
                        <span>Rank</span>
                        <span>Title</span>
                        <span>Artist</span>
                    </div>

                    {#each [...tracks].sort((a, b) => a.rank - b.rank) as t}

                        <div
                                class="track-row"
                                role="button"
                                tabindex="0"
                                class:active={currentTrack?.rankingId === t.rankingId}
                                on:click={() => {
                                    onJumpToTrack?.(t);
                                    showTrackList = false;
                                }}
                                on:keydown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onJumpToTrack?.(t);
                                        showTrackList = false;
                                    }
                                }}
                        >
    <span class="played-col">
        {#if isPlayed(t.rank)}
            ✓
        {/if}
    </span>

                            <button
                                    type="button"
                                    class="fav-col"
                                    class:active={
            favoriteRefresh &&
            programType &&
            programGroup &&
            t.rankingId != null &&
            isFavorite(programType, programGroup, t.rankingId)
        }
                                    on:click|stopPropagation={() => {
                                        console.log('FAV CLICK', {
                                            programType,
                                            programGroup,
                                            rankingId: t.rankingId,
                                            track: t
                                        });

                                        if (programType && programGroup && t.rankingId != null) {
                                            toggleFavorite(programType, programGroup, t.rankingId);
                                        }
                                    }}
                            >
                                ★
                            </button>

                            <span class="rank">#{t.rank}</span>
                            <span class="title">{t.trackName}</span>
                            <span class="artist">{t.artistName}</span>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}


</div>
<style>
    /* ─────────────────────────────────────────────
       Progress + Next Section
    ───────────────────────────────────────────── */

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


    .rank-line {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        font-size: 0.95rem;
        opacity: 0.9;
    }

    .fav-star {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        padding: 0;
        transition: transform 0.15s ease, color 0.15s ease;
    }

    .fav-star:hover {
        transform: scale(1.15);
        color: #cfb87c;
    }

    .fav-star.active {
        color: #cfb87c;
        transform: scale(1.1);
    }

    .fav-star {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
        padding: 0;
        transform-origin: center;
        transition: color 0.15s ease;
    }

    .fav-star.active {
        color: #cfb87c;
    }

    .fav-star.burst {
        animation: fav-pop 240ms ease-out;
    }

    @keyframes fav-pop {
        0% {
            transform: scale(1);
        }
        40% {
            transform: scale(1.35);
        }
        100% {
            transform: scale(1);
        }
    }

    .radio-header {
        text-align: center;
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .set-label {
        font-size: 0.9rem;
        opacity: 0.85;
    }

    .program-label {
        font-size: 1rem;
        font-weight: 500;
        margin-top: 2px;
    }

    .track-label {
        font-size: 0.85rem;
        opacity: 0.75;
        margin-top: 2px;
    }

    /* Prevent long text from wrecking layout */
    .set-label,
    .program-label,
    .track-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .tracklist-overlay {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(0, 0, 0, 0.72);
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: 16px;
    }

    .tracklist-panel {
        width: min(720px, 100%);
        max-height: 72vh;
        background: #121212;
        border: 1px solid rgba(207, 184, 124, 0.45);
        border-radius: 18px 18px 12px 12px;
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.65);
        overflow: hidden;
    }

    .tracklist-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(207, 184, 124, 0.25);
    }

    .tracklist-header h3 {
        margin: 0;
        color: #cfb87c;
        font-size: 1rem;
    }

    .close-btn {
        border: none;
        border-radius: 999px;
        background: #333;
        color: #eee;
        cursor: pointer;
        padding: 4px 10px;
    }

    .tracklist-scroll {
        max-height: 60vh;
        overflow-y: auto;
        padding: 8px;
    }

    .track-row {
        width: 100%;
        display: grid;
        grid-template-columns: 64px 44px 56px 1fr 1fr;
        gap: 8px;
        align-items: center;
        text-align: left;
        padding: 9px 10px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #eee;
        cursor: pointer;
    }

    .track-row:hover {
        background: rgba(207, 184, 124, 0.12);
    }

    .track-row.active {
        background: rgba(29, 185, 84, 0.18);
        outline: 1px solid rgba(29, 185, 84, 0.45);
    }

    .rank {
        color: #cfb87c;
        font-weight: 700;
    }

    .title {
        font-weight: 600;
    }

    .artist {
        opacity: 0.75;
    }

    .track-row-header {
        color: #cfb87c;
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.9;
        cursor: default;
    }

    .played-col,
    .fav-col {
        display: flex;
        align-items: center;
        justify-content: center;

        min-height: 24px;
    }

    .played-col {
        opacity: 0.7;
    }

    .fav-col {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        font-size: 1rem;
        width: 100%;
    }

    .fav-col.active {
        color: #cfb87c;
    }

    .tracklist-subtitle {
        margin-top: 2px;
        font-size: 0.72rem;
        color: #d1d5db;
        opacity: 0.72;
    }

</style>
