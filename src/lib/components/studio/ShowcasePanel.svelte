<script lang="ts">
    import {
        currentTrack,
        playbackPhase
    } from '$lib/carmode/CarMode.store';

    $: image =
        $playbackPhase === 'artist'
            ? ($currentTrack?.artistArtwork ??
                $currentTrack?.albumArtwork)
            : $currentTrack?.albumArtwork;
</script>

<section class="showcase-panel">
    {#if image}
        <img class="artwork" src={image} alt="Now playing artwork"/>
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
    }

    .artwork {
        width: min(94%, 680px);
        height: auto;
        max-height: 92%;
        object-fit: contain;
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
        transition: opacity 0.25s ease, transform 0.25s ease;
    }

    .placeholder {
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.14em;
    }
</style>