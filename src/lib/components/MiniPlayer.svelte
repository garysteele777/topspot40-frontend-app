<script lang="ts">
  export let coverUrl = "/default_album.png";
  export let trackTitle = "Unknown Track";
  export let artistName = "Unknown Artist";
  export let isPlaying = false;
  export let hideMeta = false; // ✅ NEW prop

  export let onPrev: () => void;
  export let onPlayPause: () => void;
  export let onNext: () => void;

  function handleImgError(e: Event) {
    const img = e.currentTarget as HTMLImageElement;
    img.src = "/default_album.png";
  }
</script>

<div class="player-wrapper">
  <div class="cover-container">
    <img class="album-cover" src={coverUrl} alt="Album cover" on:error={handleImgError} />

    <div class="controls-overlay">
      <button class="btn" on:click={onPrev} aria-label="Previous">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M6 6h2v12H6V6zm11.5 6L10 18V6l7.5 6z" />
        </svg>
      </button>

      <button class="btn play" on:click={onPlayPause} aria-label="Play/Pause">
        {#if isPlaying}
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>

      <button class="btn" on:click={onNext} aria-label="Next">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M16 6h2v12h-2V6zM6.5 12L14 18V6l-7.5 6z" />
        </svg>
      </button>
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
    max-width: 440px;
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
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    opacity: 0;
    transition: opacity 0.25s ease;
    background: rgba(0, 0, 0, 0.35);
  }
  .cover-container:hover .controls-overlay,
  .cover-container:focus-within .controls-overlay {
    opacity: 1;
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
    width: 56px;
    height: 56px;
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

  @media (hover: none) and (pointer: coarse) {
    .controls-overlay {
      opacity: 1;
      background: rgba(0, 0, 0, 0.25);
    }
  }
</style>
