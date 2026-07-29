<script lang="ts">
    import CarModeNarrationModal from './CarModeNarrationModal.svelte';
    import TrackListPanel from '$lib/components/shared/TrackListPanel.svelte';
    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistoryStore} from '$lib/carmode/programHistory';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {PlaybackPhase} from '$lib/helpers/car/types';
    import type {ProgramType} from '$lib/favorites/favorites';

    export let currentTrack: CarModeTrack | null = null;
    export let tracks: CarModeTrack[] = [];
    export let phase: PlaybackPhase | null = null;
    export let isPlaying = false;
    export let elapsed = 0;
    export let duration = 0;
    export let progress = 0;
    export let programTitle = '';

    export let onPrev: () => void;
    export let onNext: () => void;
    export let onPlayPause: () => void;
    export let onBackToOptions: () => void;
    export let onUseClassicView: () => void;
    export let onJumpToTrack: ((track: CarModeTrack) => void) | undefined;

    export let showNarrationModal = false;
    export let narrationModalInitialMode: 'intro' | 'detail' | 'artist' = 'intro';
    export let setShowNarrationModal: (value: boolean) => void;

    let showTrackList = false;

    $: narrationActive = [
        'prelude',
        'set_intro',
        'collection_intro',
        'liner',
        'intro',
        'detail',
        'artist'
    ].includes(phase ?? '');

    $: phaseLabel =
        phase === 'intro'
            ? 'Track Intro'
            : phase === 'detail'
                ? 'More About the Song'
                : phase === 'artist'
                    ? 'Artist Bio'
                    : phase === 'collection_intro'
                        ? 'Collection Introduction'
                        : phase === 'set_intro'
                            ? 'Program Introduction'
                            : phase === 'liner'
                                ? 'TopSpot40'
                                : '';

    $: effectiveDuration =
        phase === 'track' && currentTrack?.durationMs
            ? Math.floor(currentTrack.durationMs / 1000)
            : duration;

    $: programType =
        $currentSelection?.mode === 'decade_genre'
            ? ('DG' as ProgramType)
            : $currentSelection?.mode === 'collection'
                ? ('COL' as ProgramType)
                : null;

    $: programGroup =
        programType === 'DG'
            ? `${$currentSelection?.context?.decade}|${$currentSelection?.context?.genre}`
            : programType === 'COL'
                ? `${$currentSelection?.context?.collection_slug}|${$currentSelection?.context?.collection_group_slug}`
                : null;

    function formatTime(seconds: number): string {
        if (!seconds || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${remainder}`;
    }

    function isPlayed(rank: number): boolean {
        const selection = $currentSelection;
        if (!selection) return false;

        let key: string | null = null;

        if (selection.mode === 'decade_genre') {
            const decade = selection.context?.decade;
            const genre = selection.context?.genre;
            if (decade && genre) key = `DG|${decade}|${genre}`;
        } else if (selection.mode === 'collection') {
            const collection =
                selection.context?.collection_slug ??
                selection.context?.collection;
            const group =
                selection.context?.collection_group_slug ??
                selection.context?.collectionCategory;

            if (collection && group) key = `COL|${collection}|${group}`;
        }

        const program = key
            ? $programHistoryStore.find(item => item.key === key)
            : null;

        return program?.playedRanks.includes(rank) ?? false;
    }

    function jumpToTrack(track: CarModeTrack): void {
        showTrackList = false;
        onJumpToTrack?.(track);
    }
</script>

<section class="drive-in-shell" aria-label="TopSpot40 Drive-In View">
    <div class="drive-in-stage">
        <img
            class="drive-in-background"
            src="/images/car/drive-in-background.png"
            alt=""
        />

        <div class="movie-screen">
            <img
                src={currentTrack?.albumArtwork ?? '/default_album.png'}
                alt={currentTrack?.trackName
                    ? `${currentTrack.trackName} album artwork`
                    : 'Album artwork'}
            />
        </div>

        <div class="marquee-copy">
            <span>Now Playing</span>
            <strong>{programTitle}</strong>
        </div>

        <div
            class:narrating={narrationActive}
            class="speaker-pulse"
            aria-hidden="true"
        >
            <span class="pulse-ring ring-one"></span>
            <span class="pulse-ring ring-two"></span>
            <span class="pulse-ring ring-three"></span>
            <span class="speaker-glow"></span>
        </div>

        <div class="track-copy">
            <h1>{currentTrack?.trackName ?? 'Ready to begin'}</h1>
            <h2>{currentTrack?.artistName ?? 'TopSpot40'}</h2>

            {#if currentTrack}
                <div class="rank">
                    Track {currentTrack.rank} of {tracks.length}
                    {#if currentTrack.yearReleased}
                        <span>•</span>
                        {currentTrack.yearReleased}
                    {/if}
                </div>
            {/if}

            {#if phaseLabel}
                <div class="phase-label">{phaseLabel}</div>
            {/if}
        </div>

        <div class="track-progress">
            <span>{formatTime(elapsed)}</span>
            <div class="progress-rail" aria-label="Playback progress">
                <div class="progress-fill" style={`width: ${progress}%`}></div>
            </div>
            <span>{formatTime(effectiveDuration)}</span>
        </div>

        <div class="primary-controls">
            <button type="button" on:click={onPrev} aria-label="Previous track">
                <span class="control-icon">|◀</span>
                <span>Previous</span>
            </button>

            <button
                type="button"
                class="play-control"
                class:playing={isPlaying}
                on:click={onPlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                <span class="control-icon">{isPlaying ? 'Ⅱ' : '▶'}</span>
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button type="button" on:click={onNext} aria-label="Next track">
                <span class="control-icon">▶|</span>
                <span>Next</span>
            </button>

            <button
                type="button"
                class="gold-control"
                on:click={() => setShowNarrationModal(true)}
            >
                <span class="control-icon">ⓘ</span>
                <span>More Info</span>
            </button>

            <button
                type="button"
                class="gold-control"
                on:click={() => (showTrackList = true)}
            >
                <span class="control-icon">☷</span>
                <span>Track List</span>
            </button>
        </div>

        <div class="secondary-controls">
            <button type="button" class="back-button" on:click={onBackToOptions}>
                ← Back to Options
            </button>

            <div class="view-switch" aria-label="Playback view">
                <button type="button" on:click={onUseClassicView}>Car View</button>
                <span aria-hidden="true"></span>
                <button type="button" class="active" aria-current="true">
                    Drive-In View
                </button>
            </div>
        </div>
    </div>
</section>

<CarModeNarrationModal
    track={currentTrack}
    languages={$currentSelection?.languages ?? [
        $currentSelection?.language ?? 'en'
    ]}
    open={showNarrationModal}
    initialMode={narrationModalInitialMode}
    onClose={() => setShowNarrationModal(false)}
/>

{#if showTrackList}
    <div class="tracklist-overlay">
        <div class="tracklist-panel">
            <div class="tracklist-header">
                <div>
                    <h3>Track List</h3>
                    <div>Choose a track to continue your journey.</div>
                </div>

                <button
                    type="button"
                    class="close-button"
                    on:click={() => (showTrackList = false)}
                    aria-label="Close track list"
                >
                    ✕
                </button>
            </div>

            <TrackListPanel
                {tracks}
                {currentTrack}
                onJumpToTrack={jumpToTrack}
                {isPlayed}
                {programType}
                {programGroup}
                closeOnJump={() => (showTrackList = false)}
            />
        </div>
    </div>
{/if}

<style>
    .drive-in-shell {
        width: 100%;
        overflow: hidden;
        background: #030303;
    }

    .drive-in-stage {
        position: relative;
        width: min(94vw, calc((100dvh - 28px) * 1.780618));
        max-width: 1672px;
        aspect-ratio: 1672 / 939;
        margin: -2.8rem auto 0;
        overflow: visible;
        color: #fff;
        font-family: Arial, Helvetica, sans-serif;
    }

    .drive-in-background {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center top;
        user-select: none;
        pointer-events: none;
    }

    .movie-screen {
        position: absolute;
        z-index: 2;
        left: 30.25%;
        top: 10.8%;
        width: 38.7%;
        height: 37.2%;
        display: grid;
        place-items: center;
        overflow: hidden;
    }

    .movie-screen img {
        display: block;
        width: 54%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        filter: brightness(0.96) contrast(1.03);
    }

    .marquee-copy {
        position: absolute;
        z-index: 3;
        left: 74.9%;
        top: 40.1%;
        width: 21.2%;
        height: 7.25%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #17110b;
        text-align: center;
        text-transform: uppercase;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
        overflow: hidden;
    }

    .marquee-copy span {
        font-size: clamp(7px, 0.8vw, 15px);
        font-weight: 800;
        letter-spacing: 0.08em;
        line-height: 1;
    }

    .marquee-copy strong {
        width: 94%;
        margin-top: 0.22em;
        font-size: clamp(8px, 1.05vw, 19px);
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .speaker-pulse {
        position: absolute;
        z-index: 4;
        left: 22.45%;
        top: 35.5%;
        width: 1px;
        height: 1px;
        pointer-events: none;
    }

    .pulse-ring,
    .speaker-glow {
        position: absolute;
        left: 50%;
        top: 50%;
        border-radius: 50%;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
    }

    .speaker-glow {
        width: clamp(28px, 3.5vw, 62px);
        height: clamp(28px, 3.5vw, 62px);
        background: radial-gradient(
            circle,
            rgba(255, 226, 139, 0.98) 0%,
            rgba(255, 170, 48, 0.58) 52%,
            rgba(236, 154, 55, 0) 75%
        );
    }

    .pulse-ring {
        width: clamp(36px, 4.7vw, 86px);
        height: clamp(36px, 4.7vw, 86px);
        border: 3px solid rgba(255, 205, 102, 0.96);
        box-shadow:
            0 0 12px rgba(255, 185, 64, 0.9),
            0 0 26px rgba(255, 137, 25, 0.58);
    }

    .speaker-pulse.narrating .speaker-glow {
        animation: speaker-breathe 1.35s ease-in-out infinite;
    }

    .speaker-pulse.narrating .pulse-ring {
        animation: speaker-wave 2.4s ease-out infinite;
    }

    .speaker-pulse.narrating .ring-two {
        animation-delay: 0.8s;
    }

    .speaker-pulse.narrating .ring-three {
        animation-delay: 1.6s;
    }

    @keyframes speaker-wave {
        0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.25);
        }
        14% {
            opacity: 0.96;
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(2.7);
        }
    }

    @keyframes speaker-breathe {
        0%,
        100% {
            opacity: 0.35;
            transform: translate(-50%, -50%) scale(0.8);
        }
        50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.35);
        }
    }

    .track-copy,
    .track-progress,
    .primary-controls,
    .secondary-controls {
        transform: translateY(0);
    }

    .track-copy {
        position: absolute;
        z-index: 5;
        left: 31%;
        top: 57.5%;
        width: 38%;
        text-align: center;
        text-shadow: 0 2px 7px #000, 0 0 20px #000;
    }

    .track-copy h1,
    .track-copy h2 {
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .track-copy h1 {
        font-size: clamp(15px, 1.7vw, 30px);
        line-height: 1;
    }

    .track-copy h2 {
        margin-top: 0.25em;
        color: #e0bd68;
        font-size: clamp(11px, 1.15vw, 20px);
        line-height: 1;
    }

    .rank {
        margin-top: 0.45em;
        font-size: clamp(10px, 1.08vw, 20px);
    }

    .rank span {
        margin: 0 0.35em;
        color: #d6bd7e;
    }

    .phase-label {
        display: inline-block;
        margin-top: 0.45em;
        padding: 0.2em 0.75em;
        border: 1px solid rgba(255, 198, 92, 0.58);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.58);
        color: #ffe3a0;
        font-size: clamp(8px, 0.83vw, 15px);
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
    }

    .track-progress {
        position: absolute;
        z-index: 5;
        left: 12.9%;
        top: 74%;
        width: 74.2%;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: clamp(6px, 0.9vw, 16px);
        color: #e8c86f;
        font-size: clamp(9px, 1vw, 18px);
        text-shadow: 0 2px 5px #000;
    }

    .progress-rail {
        height: clamp(4px, 0.62vw, 10px);
        overflow: hidden;
        border-radius: 999px;
        background: rgba(219, 219, 219, 0.35);
        box-shadow: 0 1px 5px #000;
    }

    .progress-fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #e8c866, #f4df94);
        transition: width 200ms linear;
    }

    .primary-controls {
        position: absolute;
        z-index: 6;
        left: 12%;
        top: 81%;
        width: 76%;
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2.7%;
    }

    .primary-controls button {
        border: 0;
        background: transparent;
        color: #fff;
        cursor: pointer;
        font: inherit;
        text-shadow: 0 2px 5px #000;
    }

    .primary-controls button > span:last-child {
        display: block;
        margin-top: 0.25em;
        font-size: clamp(8px, 0.8vw, 14px);
        font-weight: 700;
    }

    .control-icon {
        display: grid;
        width: clamp(24px, 2.8vw, 48px);
        aspect-ratio: 1;
        margin: 0 auto;
        place-items: center;
        border: 2px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.48);
        font-size: clamp(12px, 1.4vw, 23px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
        transition: transform 140ms ease, box-shadow 140ms ease;
    }

    .primary-controls button:hover .control-icon,
    .primary-controls button:focus-visible .control-icon {
        transform: scale(1.06);
        box-shadow: 0 0 18px rgba(41, 210, 100, 0.65);
    }

    .play-control .control-icon {
        border-color: #21c55d;
        color: #21c55d;
    }

    .gold-control .control-icon {
        border-color: #e4c365;
        color: #e4c365;
    }

    .secondary-controls {
        position: absolute;
        z-index: 6;
        left: 27%;
        bottom: 0.4%;
        width: 46%;
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 6%;
    }

    .back-button,
    .view-switch {
        min-height: clamp(28px, 2.9vw, 46px);
        border: 2px solid #22c55e;
        border-radius: 999px;
        background: rgba(3, 8, 5, 0.77);
        color: #28d66b;
        box-shadow: 0 6px 19px rgba(0, 0, 0, 0.5);
    }

    .back-button {
        cursor: pointer;
        font-size: clamp(10px, 1.15vw, 20px);
        font-weight: 700;
    }

    .view-switch {
        display: grid;
        grid-template-columns: 1fr 1px 1fr;
        align-items: center;
        overflow: hidden;
    }

    .view-switch span {
        width: 1px;
        height: 55%;
        background: rgba(255, 255, 255, 0.6);
    }

    .view-switch button {
        height: 100%;
        border: 0;
        background: transparent;
        color: #eee;
        cursor: pointer;
        font-size: clamp(9px, 1.05vw, 18px);
    }

    .view-switch button.active {
        color: #2bd469;
    }

    .tracklist-overlay {
        position: fixed;
        z-index: 80;
        inset: 0;
        display: grid;
        place-items: end center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.78);
    }

    .tracklist-panel {
        width: min(760px, 100%);
        max-height: 76vh;
        overflow: hidden;
        border: 1px solid rgba(207, 184, 124, 0.55);
        border-radius: 18px;
        background: #111;
        box-shadow: 0 18px 50px rgba(0, 0, 0, 0.7);
    }

    .tracklist-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11px 15px;
        border-bottom: 1px solid rgba(207, 184, 124, 0.3);
    }

    .tracklist-header h3 {
        margin: 0;
    }

    .tracklist-header div div {
        margin-top: 2px;
        color: #bbb;
        font-size: 0.78rem;
    }

    .close-button {
        border: 0;
        border-radius: 999px;
        background: #333;
        color: #fff;
        cursor: pointer;
        padding: 7px 11px;
    }

    @media (max-width: 820px) {
        .drive-in-stage {
            width: min(100%, calc((100dvh - 86px) * 1.780618));
        }

        .secondary-controls {
            left: 20%;
            width: 60%;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .speaker-pulse.narrating .speaker-glow,
        .speaker-pulse.narrating .pulse-ring {
            animation: none;
        }

        .speaker-pulse.narrating .speaker-glow {
            opacity: 0.72;
            transform: translate(-50%, -50%) scale(1);
        }
    }
</style>
