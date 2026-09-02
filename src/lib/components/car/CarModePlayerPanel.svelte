<script lang="ts">
    import MiniPlayer from '$lib/components/MiniPlayer.svelte';
    import CarModeTrackMeta from './CarModeTrackMeta.svelte';
    import CarModeNarration from './CarModeNarration.svelte';
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import CarModeTicker from './CarModeTicker.svelte';
    import ReportProblemButton from './ReportProblemButton.svelte';
    import {favoritesStore} from '$lib/favorites/favorites';
    import TrackListPanel from '$lib/components/shared/TrackListPanel.svelte';

    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {PlaybackPhase} from '$lib/helpers/car/types';

    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistoryStore} from '$lib/carmode/programHistory';
    import {PROGRAM_TYPES} from '$lib/types/program';
    import {createTrackListCsv, downloadCsv} from '$lib/program/trackListCsv';
    import {
        buildProgramHistoryKey,
        calculateProgramProgress,
        isProgramRankPlayed
    } from '$lib/program/history';


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
    export let activePlayMode: 'guided' | 'auto' | null = null;

    export let isPlaying: boolean;
    export let elapsed: number;
    export let duration: number;
    export let progress: number;

    export let onPrev: () => void;
    export let onNext: () => void;
    export let onPlayPause: () => void;
    export let onBackToOptions: () => void;

    export let showNarrationModal: boolean;
    export let narrationModalInitialMode: 'intro' | 'detail' | 'artist' = 'intro';
    export let setShowNarrationModal: (v: boolean) => void;
    export let onReportProblem: (() => void) | undefined;
    export let onReportNarration: ((mode: 'intro' | 'detail' | 'artist') => void) | undefined;

    let isFav = false;
    let favBurst = false;
    let showTrackList = false;

    $: favoriteRefresh = $favoritesStore;

    /* ─────────────────────────────────────────────
       Derived values (Next + Progress)
    ───────────────────────────────────────────── */

    let completed = 0;
    let programTotal = 0;
    let programProgress = {completed: 0, total: 0, remaining: 0, percent: 0};

    $: isArtistSpotlight = $currentSelection?.mode === 'artist_spotlight';

    $: {
        programProgress = calculateProgramProgress(
            $programHistoryStore,
            buildProgramHistoryKey($currentSelection),
            tracks.length
        );
        completed = programProgress.completed;
        programTotal = programProgress.total;
    }

    $: remaining = programProgress.remaining;

    $: percent = programProgress.percent;

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

    function displayName(value: string): string {
        return value
            .replaceAll('_', ' ')
            .replaceAll('-', ' ')
            .replace(/\b\w/g, letter => letter.toUpperCase());
    }

    $: trackListProgramLabel =
        $currentSelection?.mode === 'decade_genre'
            ? `Nostalgia: ${$currentSelection?.context?.decade ?? ''} ${displayName($currentSelection?.context?.genre ?? '')}`.trim()
            : $currentSelection?.mode === 'collection'
                ? `Collections: ${$currentSelection?.context?.collection_slug ?? ''}`
                : $currentSelection?.mode === 'artist_spotlight'
                    ? `Artist Spotlight: ${
                        $currentSelection?.context?.artist_name ??
                        currentTrack?.artistName ??
                        ''
                    }`
                    : '';

    $: trackListExportName =
        trackListProgramLabel
            ? `TopSpot40 ${trackListProgramLabel.replace(':', '')}.csv`
            : 'TopSpot40 Track List.csv';

    function exportCsv(): void {
        if (tracks.length === 0) return;

        downloadCsv(createTrackListCsv(tracks), trackListExportName);
    }


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
        return isProgramRankPlayed(
            $programHistoryStore,
            buildProgramHistoryKey($currentSelection),
            rank
        );
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
                {activePlayMode}
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


    {#if !isRadioMode && !isArtistSpotlight}
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
    <div class="report-slot"><ReportProblemButton language={$currentSelection?.language ?? 'en'} onReport={() => onReportProblem?.()} /></div>

    <CarModeNarrationModal
            track={currentTrack}
            languages={$currentSelection?.languages ?? [$currentSelection?.language ?? 'en']}
            open={showNarrationModal}
            initialMode={narrationModalInitialMode}
            onClose={() => setShowNarrationModal(false)}
            onReport={(mode) => onReportNarration?.(mode)}
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

                    <div class="tracklist-actions">
                        <button
                                class="export-btn"
                                on:click={exportCsv}
                                type="button"
                        >
                            ↓ Export CSV
                        </button>

                        <button
                                class="close-btn"
                                on:click={() => showTrackList = false}
                                type="button"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <TrackListPanel
                        {tracks}
                        {currentTrack}
                        {onJumpToTrack}
                        {isPlayed}
                        {programType}
                        {programGroup}
                        closeOnJump={() => showTrackList = false}
                />
            </div>
        </div>
    {/if}


</div>
<style>
    .report-slot { display:flex; justify-content:center; margin-top:12px; }
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
        padding: 8px 14px 4px;
        border-bottom: 1px solid rgba(207, 184, 124, 0.25);
    }

    .tracklist-header h3 {
        margin: 0;
        line-height: 1.1;
    }

    .tracklist-subtitle {
        margin-top: 2px;
        font-size: 0.8rem;
        opacity: 0.7;
    }

    .close-btn {
        border: none;
        border-radius: 999px;
        background: #333;
        color: #eee;
        cursor: pointer;
        padding: 4px 10px;
    }


    .tracklist-subtitle {
        margin-top: 2px;
        font-size: 0.72rem;
        color: #d1d5db;
        opacity: 0.72;
    }

    .tracklist-actions {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .export-btn {
        padding: 7px 11px;
        color: #f7dc82;
        background: #1c1a16;
        border: 1px solid #8b6d24;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
    }

    .export-btn:hover,
    .export-btn:focus-visible {
        border-color: #d9b84f;
        color: #fff2b2;
    }

</style>
