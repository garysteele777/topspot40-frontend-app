<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        favoritesStore,
        isFavorite,
        toggleFavorite,
        type ProgramType
    } from '$lib/favorites/favorites';

    export let tracks: CarModeTrack[] = [];
    export let currentTrack: CarModeTrack | null = null;
    export let onJumpToTrack: ((track: CarModeTrack) => void) | undefined;
    export let onClose: () => void;
    export let isPlayed: (rank: number) => boolean = () => false;
    export let programType: ProgramType | null = null;
    export let programGroup: string | null = null;

    const PAGE_SIZE = 5;

    let pageIndex = 0;
    let selectedTrack: CarModeTrack | null = currentTrack;
    let lastCurrentIdentity = '';

    $: favoriteRefresh = $favoritesStore;
    $: sortedTracks = [...tracks].sort((a, b) => a.rank - b.rank);
    $: pageCount = Math.max(1, Math.ceil(sortedTracks.length / PAGE_SIZE));
    $: visibleTracks = sortedTracks.slice(
        pageIndex * PAGE_SIZE,
        pageIndex * PAGE_SIZE + PAGE_SIZE
    );
    $: selectedIdentity = selectedTrack ? trackIdentity(selectedTrack) : '';

    $: {
        const identity = currentTrack ? trackIdentity(currentTrack) : '';

        if (identity !== lastCurrentIdentity) {
            lastCurrentIdentity = identity;
            selectedTrack = currentTrack;

            const currentIndex = currentTrack
                ? sortedTracks.findIndex(
                    track => trackIdentity(track) === identity
                )
                : -1;

            if (currentIndex >= 0) {
                pageIndex = Math.floor(currentIndex / PAGE_SIZE);
            }
        }
    }

    function trackIdentity(track: CarModeTrack): string {
        return track.rankingId != null
            ? `ranking-${track.rankingId}`
            : `rank-${track.rank}`;
    }

    function isCurrent(track: CarModeTrack): boolean {
        return currentTrack != null &&
            trackIdentity(track) === trackIdentity(currentTrack);
    }

    function selectionCode(index: number): string {
        const pageLetter = String.fromCharCode(65 + pageIndex);
        return `${pageLetter}${index + 1}`;
    }

    function previousPage(): void {
        if (pageIndex > 0) {
            pageIndex -= 1;
            selectedTrack = null;
        }
    }

    function nextPage(): void {
        if (pageIndex < pageCount - 1) {
            pageIndex += 1;
            selectedTrack = null;
        }
    }

    function chooseTrack(track: CarModeTrack): void {
        selectedTrack = track;
    }

    function playSelected(): void {
        if (!selectedTrack) return;
        onJumpToTrack?.(selectedTrack);
        onClose();
    }

    function handleKeyDown(event: KeyboardEvent): void {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            previousPage();
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextPage();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        } else if (event.key === 'Enter' && selectedTrack) {
            event.preventDefault();
            playSelected();
        }
    }

    onMount(() => window.addEventListener('keydown', handleKeyDown));
    onDestroy(() => window.removeEventListener('keydown', handleKeyDown));
</script>

<div
    class="jukebox-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="TopSpot40 jukebox track selector"
>
    <div class="jukebox-cabinet">
        <button
            type="button"
            class="close-button"
            on:click={onClose}
            aria-label="Close jukebox"
        >
            ✕
        </button>

        <div class="jukebox-display">
            <header>
                <div>
                    <span class="eyebrow">TopSpot40 Drive-In</span>
                    <h2>Choose Your Favorite</h2>
                </div>
                <div class="page-label">
                    Page {pageIndex + 1} of {pageCount}
                </div>
            </header>

            <div class="selection-list">
                {#each visibleTracks as track, index}
                    <div
                        class="selection-card"
                        class:current={isCurrent(track)}
                        class:selected={selectedIdentity === trackIdentity(track)}
                        role="button"
                        tabindex="0"
                        on:click={() => chooseTrack(track)}
                        on:keydown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                chooseTrack(track);
                            }
                        }}
                        aria-pressed={selectedIdentity === trackIdentity(track)}
                    >
                        <span class="selection-code">
                            {selectionCode(index)}
                        </span>

                        <img
                            src={track.albumArtwork ?? '/default_album.png'}
                            alt=""
                        />

                        <span class="track-copy">
                            <strong>#{track.rank} {track.trackName}</strong>
                            <span>{track.artistName}</span>
                        </span>

                        <span class="status-icons">
                            {#if isCurrent(track)}
                                <span class="now-playing">Playing</span>
                            {:else if isPlayed(track.rank)}
                                <span class="played" title="Already played">✓</span>
                            {/if}

                            <button
                                type="button"
                                class="favorite"
                                class:active={
                                    favoriteRefresh &&
                                    programType &&
                                    programGroup &&
                                    track.rankingId != null &&
                                    isFavorite(
                                        programType,
                                        programGroup,
                                        track.rankingId
                                    )
                                }
                                on:click|stopPropagation={() => {
                                    if (
                                        programType &&
                                        programGroup &&
                                        track.rankingId != null
                                    ) {
                                        toggleFavorite(
                                            programType,
                                            programGroup,
                                            track.rankingId
                                        );
                                    }
                                }}
                                aria-label={`Favorite ${track.trackName}`}
                            >
                                ★
                            </button>
                        </span>
                    </div>
                {/each}
            </div>

            <footer>
                <button
                    type="button"
                    class="page-turn"
                    on:click={previousPage}
                    disabled={pageIndex === 0}
                    aria-label="Previous five tracks"
                >
                    ‹
                    <span>Previous</span>
                </button>

                <button
                    type="button"
                    class="play-selected"
                    on:click={playSelected}
                    disabled={!selectedTrack}
                >
                    <span aria-hidden="true">▶</span>
                    {selectedTrack
                        ? `Play #${selectedTrack.rank}`
                        : 'Select a Track'}
                </button>

                <button
                    type="button"
                    class="page-turn"
                    on:click={nextPage}
                    disabled={pageIndex === pageCount - 1}
                    aria-label="Next five tracks"
                >
                    <span>Next</span>
                    ›
                </button>
            </footer>
        </div>
    </div>
</div>

<style>
    .jukebox-overlay {
        position: fixed;
        z-index: 100;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 8px;
        background: rgba(0, 0, 0, 0.88);
    }

    .jukebox-cabinet {
        position: relative;
        width: min(98vw, calc(98dvh * 1.7768));
        max-width: 1672px;
        aspect-ratio: 1672 / 941;
        background: url('/images/car/drive-in-jukebox-frame.png')
            center / contain no-repeat;
        color: #f9edc7;
        font-family: Arial, Helvetica, sans-serif;
    }

    .close-button {
        position: absolute;
        z-index: 3;
        top: 5.5%;
        right: 7%;
        width: clamp(42px, 3.6vw, 62px);
        height: clamp(42px, 3.6vw, 62px);
        border: 2px solid #e2bc68;
        border-radius: 50%;
        background: rgba(22, 10, 5, 0.94);
        color: #fff5d3;
        font-size: clamp(20px, 1.8vw, 30px);
        cursor: pointer;
        box-shadow: 0 0 18px rgba(255, 174, 55, 0.5);
    }

    .jukebox-display {
        position: absolute;
        left: 16.5%;
        top: 22.3%;
        width: 69%;
        height: 59%;
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: clamp(4px, 0.55vw, 10px);
        padding: clamp(8px, 1vw, 17px);
        border: 1px solid rgba(244, 194, 91, 0.45);
        border-radius: 8px;
        background:
            linear-gradient(rgba(10, 5, 3, 0.93), rgba(21, 9, 4, 0.93)),
            repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.025) 0,
                rgba(255, 255, 255, 0.025) 1px,
                transparent 1px,
                transparent 4px
            );
        box-shadow: inset 0 0 30px #000;
        overflow: hidden;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 0;
        padding: 0 clamp(2px, 0.5vw, 8px);
    }

    .eyebrow {
        color: #dfad49;
        font-size: clamp(8px, 0.72vw, 13px);
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    h2 {
        margin: 0.05em 0 0;
        color: #fff6d5;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(14px, 1.45vw, 26px);
        line-height: 1;
        text-shadow: 0 0 10px rgba(255, 187, 54, 0.45);
    }

    .page-label {
        border: 1px solid rgba(231, 183, 84, 0.65);
        border-radius: 999px;
        padding: 0.35em 0.8em;
        color: #f2ce82;
        font-size: clamp(9px, 0.78vw, 14px);
        font-weight: 800;
        white-space: nowrap;
    }

    .selection-list {
        min-height: 0;
        display: grid;
        grid-template-rows: repeat(5, minmax(0, 1fr));
        gap: clamp(3px, 0.45vw, 8px);
    }

    .selection-card {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns:
            clamp(32px, 3.2vw, 54px)
            clamp(42px, 4.8vw, 76px)
            minmax(0, 1fr)
            auto;
        align-items: center;
        gap: clamp(6px, 0.75vw, 13px);
        padding: clamp(3px, 0.35vw, 6px) clamp(7px, 0.8vw, 14px);
        border: 1px solid rgba(202, 153, 66, 0.45);
        border-radius: 8px;
        background: linear-gradient(
            90deg,
            rgba(61, 24, 12, 0.88),
            rgba(24, 12, 8, 0.92)
        );
        color: #f5e7c4;
        text-align: left;
        cursor: pointer;
        overflow: hidden;
    }

    .selection-card:hover,
    .selection-card:focus-visible {
        border-color: #f4c55f;
        outline: none;
    }

    .selection-card.current {
        border-color: #31d875;
        box-shadow: inset 4px 0 0 #31d875;
    }

    .selection-card.selected {
        border-color: #ffd568;
        background: linear-gradient(
            90deg,
            rgba(111, 47, 18, 0.96),
            rgba(49, 23, 10, 0.97)
        );
        box-shadow:
            inset 0 0 12px rgba(255, 198, 72, 0.22),
            0 0 9px rgba(255, 177, 42, 0.28);
    }

    .selection-code {
        color: #ffe08c;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: clamp(15px, 1.45vw, 25px);
        font-weight: 900;
        text-align: center;
    }

    .selection-card > img {
        width: 100%;
        height: 100%;
        max-height: clamp(38px, 5.4dvh, 68px);
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border: 1px solid rgba(255, 224, 148, 0.55);
        border-radius: 5px;
        background: #1b110c;
    }

    .track-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.15em;
    }

    .track-copy strong,
    .track-copy span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .track-copy strong {
        color: #fff8e5;
        font-size: clamp(11px, 1vw, 18px);
    }

    .track-copy span {
        color: #d5b875;
        font-size: clamp(9px, 0.85vw, 15px);
        font-weight: 700;
    }

    .status-icons {
        display: flex;
        align-items: center;
        gap: clamp(5px, 0.55vw, 9px);
    }

    .now-playing {
        color: #46e784;
        font-size: clamp(8px, 0.7vw, 12px);
        font-weight: 900;
        text-transform: uppercase;
    }

    .played {
        color: #70e49b;
        font-size: clamp(15px, 1.3vw, 22px);
        font-weight: 900;
    }

    .favorite {
        width: clamp(34px, 3vw, 48px);
        height: clamp(34px, 3vw, 48px);
        border: 1px solid rgba(232, 188, 93, 0.55);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.3);
        color: #766246;
        font-size: clamp(16px, 1.45vw, 25px);
        cursor: pointer;
    }

    .favorite.active {
        color: #ffd55f;
        text-shadow: 0 0 8px #ffad25;
    }

    footer {
        display: grid;
        grid-template-columns: 1fr minmax(140px, 1.35fr) 1fr;
        align-items: center;
        gap: clamp(6px, 0.8vw, 14px);
    }

    footer button {
        min-height: clamp(38px, 5dvh, 58px);
        border: 1px solid #c58d35;
        border-radius: 999px;
        font-weight: 900;
        cursor: pointer;
    }

    footer button:disabled {
        cursor: default;
        opacity: 0.35;
    }

    .page-turn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.4em;
        background: linear-gradient(#462213, #1b0c07);
        color: #f8d886;
        font-size: clamp(18px, 1.8vw, 31px);
    }

    .page-turn span {
        font-size: clamp(9px, 0.8vw, 14px);
        text-transform: uppercase;
    }

    .play-selected {
        background: linear-gradient(#f0c45d, #a86318);
        color: #1a0b04;
        font-size: clamp(11px, 1vw, 18px);
        box-shadow: 0 0 15px rgba(255, 175, 42, 0.38);
    }

    @media (max-width: 900px) {
        .jukebox-overlay {
            padding: 2px;
        }

        .jukebox-cabinet {
            width: min(100vw, calc(100dvh * 1.7768));
        }

        .jukebox-display {
            left: 13%;
            top: 17%;
            width: 74%;
            height: 67%;
        }
    }

    @media (orientation: portrait) {
        .jukebox-cabinet {
            width: 100vw;
        }

        .jukebox-display {
            left: 7%;
            top: 9%;
            width: 86%;
            height: 82%;
            background: rgba(16, 8, 4, 0.97);
        }

        .close-button {
            top: 2%;
            right: 2%;
        }
    }
</style>
