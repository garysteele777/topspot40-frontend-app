<script lang="ts">
    export let trackName: string | null | undefined = null;
    export let artistName: string | null | undefined = null;
    export let yearReleased: number | null | undefined = null;
    export let rank: number | null | undefined = null;
    export let totalTracks: number = 0;
    export let progress: number = 0;
</script>

<section class="playback-banner">
    <div class="track-title">{trackName ?? 'No track selected'}</div>
    <div class="track-artist">{artistName ?? 'Unknown Artist'}</div>

    <div class="track-meta">
        {#if yearReleased}
            <span>{yearReleased}</span>
        {/if}

        {#if rank}
            <span>Track {rank}{totalTracks ? ` of ${totalTracks}` : ''}</span>
        {/if}
    </div>

    <div class="progress-shell">
        <div class="progress-fill" style={`width: ${Math.max(0, Math.min(progress, 100))}%`}></div>
    </div>
</section>

<style>
    .playback-banner {
        border-top: 1px solid rgba(207, 184, 124, 0.35);
        padding: 0.75rem 2rem 0.8rem;
        text-align: center;
    }

    .track-title {
        font-size: clamp(1.35rem, 2.5vw, 2.5rem);
        font-weight: 800;
        line-height: 1.05;
    }

    .track-artist {
        margin-top: 0.15rem;
        font-size: clamp(0.95rem, 1.4vw, 1.3rem);
        color: rgba(255, 255, 255, 0.85);
    }

    .track-meta {
        margin-top: 0.3rem;
        display: flex;
        justify-content: center;
        gap: 1rem;
        color: #cfb87c;
        font-size: 0.85rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .progress-shell {
        margin: 0.55rem auto 0;
        width: min(720px, 80vw);
        height: 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.12);
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        border-radius: inherit;
        background: #cfb87c;
        transition: width 0.25s ease;
    }
</style>