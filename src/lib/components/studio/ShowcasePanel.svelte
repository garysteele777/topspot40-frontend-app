<script lang="ts">
    export let albumArtwork: string | null | undefined = null;
</script>

<section class="showcase-panel">
    {#if albumArtwork}
        <img class="artwork" src={albumArtwork} alt="Album artwork" />
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
        min-height: 460px;
        padding: 1.5rem;
        overflow: hidden;
    }

    .artwork {
        width: min(100%, 560px);
        max-height: 100%;
        object-fit: contain;
        border-radius: 18px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    }

    .placeholder {
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.14em;
    }
</style>