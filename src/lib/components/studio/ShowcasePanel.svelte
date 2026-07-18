<script lang="ts">
    import {onDestroy} from 'svelte';
    import {
        currentTrack,
        playbackPhase
    } from '$lib/carmode/CarMode.store';

    const FLIP_INTERVAL_MS = 14000;

    let showArtistArt = false;
    let timer: number | null = null;

    $: albumArtwork = $currentTrack?.albumArtwork;
    $: artistArtwork = $currentTrack?.artistArtwork;

    $: shouldAlternate =
        $playbackPhase === 'track' &&
        !!albumArtwork &&
        !!artistArtwork;

    $: activeImage =
        shouldAlternate
            ? (showArtistArt ? artistArtwork : albumArtwork)
            : $playbackPhase === 'artist'
                ? (artistArtwork ?? albumArtwork)
                : albumArtwork;

    $: {
        if (shouldAlternate && timer === null) {
            timer = window.setInterval(() => {
                showArtistArt = !showArtistArt;
            }, FLIP_INTERVAL_MS);
        }

        if (!shouldAlternate && timer !== null) {
            clearInterval(timer);
            timer = null;
            showArtistArt = false;
        }
    }

    onDestroy(() => {
        if (timer !== null) {
            clearInterval(timer);
        }
    });
</script>

<section class="showcase-panel">
    {#if shouldAlternate}
        <div class="artwork-stack" class:show-artist={showArtistArt}>
            <img
                    class="artwork artwork-album"
                    src={albumArtwork}
                    alt="Album artwork"
            />

            <img
                    class="artwork artwork-artist"
                    src={artistArtwork}
                    alt="Artist artwork"
            />
        </div>
    {:else if activeImage}
        <div class="artwork-stack">
            <img
                    class="artwork artwork-static"
                    src={activeImage}
                    alt="Now playing artwork"
            />
        </div>
    {:else}
        <div class="placeholder">No Artwork</div>
    {/if}
</section>

<style>
    .showcase-panel {
        border: 1px solid rgba(207, 184, 124, 0.35);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
        display: grid;
        place-items: center;
        min-height: 400px;
        padding: 1rem;
        overflow: hidden;
        perspective: 1400px;
    }

    .artwork-stack {
        position: relative;
        width: min(94%, 680px);
        height: min(92%, 680px);
        display: grid;
        place-items: center;
        transform-style: preserve-3d;
    }

    .artwork {
        position: absolute;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        backface-visibility: hidden;
        transform-style: preserve-3d;
        transition: opacity 3.5s ease-in-out,
        transform 3.5s cubic-bezier(0.22, 0.61, 0.36, 1),
        filter 3.5s ease-in-out;
    }

    .artwork-album {
        opacity: 1;
        transform: rotateY(0deg) scale(1);
        filter: brightness(1);
        z-index: 2;
    }

    .artwork-artist {
        opacity: 0;
        transform: rotateY(14deg) scale(0.97);
        filter: brightness(0.82);
        z-index: 1;
    }

    .show-artist .artwork-album {
        opacity: 0;
        transform: rotateY(-14deg) scale(0.97);
        filter: brightness(0.82);
        z-index: 1;
    }

    .show-artist .artwork-artist {
        opacity: 1;
        transform: rotateY(0deg) scale(1);
        filter: brightness(1);
        z-index: 2;
    }

    .artwork-static {
        opacity: 1;
        transform: rotateY(0deg) scale(1);
    }

    .placeholder {
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.14em;
    }
</style>