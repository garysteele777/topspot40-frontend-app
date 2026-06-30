<script lang="ts">
    import {
        currentTrack,
        playbackPhase
    } from '$lib/carmode/CarMode.store';

    $: title =
        $playbackPhase === 'artist'
            ? 'Meet the Artist'
            : $playbackPhase === 'detail'
                ? 'Behind the Music'
                : $playbackPhase === 'intro'
                    ? 'About This Song'
                    : 'Now Playing';

    $: body =
        $playbackPhase === 'artist'
            ? $currentTrack?.artistText
            : $playbackPhase === 'detail'
                ? $currentTrack?.detail
                : $playbackPhase === 'intro'
                    ? $currentTrack?.intro
                    : null;
</script>

<section class="context-panel">
    <div class="context-title">{title}</div>

    {#if body}
        <div class="context-body">{body}</div>
    {:else}
        <div class="placeholder">Waiting for narration...</div>
    {/if}
</section>

<style>
    .context-panel {
        border: 1px solid rgba(207, 184, 124, 0.35);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
        min-height: 270px;
        padding: 1.5rem;
        overflow: hidden;
    }

    .context-title {
        color: #cfb87c;
        font-size: 0.8rem;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        margin-bottom: 1rem;
    }

    .context-body {
        color: rgba(255, 255, 255, 0.86);
        font-size: 1rem;
        line-height: 1.55;
    }

    .placeholder {
        height: 100%;
        display: grid;
        place-items: center;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.14em;
    }
</style>