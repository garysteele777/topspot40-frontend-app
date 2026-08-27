<script lang="ts">
    export let coverUrl = "/default_album.png";
    export let trackTitle = "Unknown Track";
    export let artistName = "Unknown Artist";
    export let isPlaying = false;
    export let hideMeta = false; // ✅ NEW prop

    export let onPrev: () => void;
    export let onPlayPause: () => void;
    export let onNext: () => void;

    export let activePlayMode: 'guided' | 'auto' | null = null;

    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

    function handleImgError(e: Event) {
        const img = e.currentTarget as HTMLImageElement;
        img.src = "/default_album.png";
    }

    function handlePlayClick(): void {
        void fetch(`${API_BASE}/playback/client-diagnostic`, {
            method: 'POST',
            credentials: 'include',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                event: 'MiniPlayer play button tapped',
                phase: null,
                mode: null,
                programType: null,
                hasCurrentTrack: false,
                trackRank: null,
                decade: null,
                genre: null
            })
        }).catch(() => {
            // Temporary diagnostic only; never block playback.
        });

        onPlayPause();
    }
</script>

<div class="player-wrapper">
    <div class="cover-container">
        <img class="album-cover" src={coverUrl} alt="Album cover" on:error={handleImgError}/>
    </div>

    <div class="controls-overlay">
        <div class="control-item">
            <button class="btn" on:click={onPrev} aria-label="Previous">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M6 6h2v12H6V6zm11.5 6L10 18V6l7.5 6z"/>
                </svg>
            </button>
            <span>Previous</span>
        </div>

        <div class="control-item">
            <button
                    class="btn play"
                    on:click={handlePlayClick}
                    aria-label="Guided Play"
            >
                {#if isPlaying && activePlayMode === 'guided'}
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M6 5h4v14H6zM14 5h4v14h-4z"/>
                    </svg>
                {:else}
                    <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                {/if}
            </button>
            <span>
            {isPlaying && activePlayMode === 'guided'
                ? 'Pause'
                : 'Guided'}
        </span>
        </div>

        <div class="control-item">
            <button class="btn" on:click={onNext} aria-label="Next">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M16 6h2v12h-2V6zM6.5 12L14 18V6l-7.5 6z"/>
                </svg>
            </button>
            <span>Next</span>
        </div>
    </div>

    <!-- ✅ Hide these lines if hideMeta=true -->
    {#if !hideMeta}
        <div class="track-info">
            <h3 class="title" title={trackTitle}>{trackTitle}</h3>
            <p class="artist" title={artistName}>{artistName}</p>
        </div>
    {/if}
</div>

<style>
    .player-wrapper {
        text-align: center;
        max-width: 360px; /* was 440px */
        margin: 0 auto;
    }

    .cover-container {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        border-radius: 16px;
        overflow: hidden;
    }


    .album-cover {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        background: #111;
    }

    .controls-overlay {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        gap: 14px;
        margin-top: 12px;
    }

    .control-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 58px;
    }

    .control-item > span {
        color: #ddd;
        font-size: 0.72rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .btn {
        background: rgba(255, 255, 255, 0.88);
        color: #111;
        border: none;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: transform 0.12s ease, background 0.2s ease;
    }

    .btn:hover {
        transform: scale(1.06);
    }

    .btn.play {
        width: 50px;
        height: 50px;
    }

    .track-info {
        margin-top: 12px;
    }

    .title {
        margin: 0;
        font-weight: 700;
        line-height: 1.2;
        font-size: 1.05rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .artist {
        margin: 0;
        color: #b7b7b7;
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

</style>
