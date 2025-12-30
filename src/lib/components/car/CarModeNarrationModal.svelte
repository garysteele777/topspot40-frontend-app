<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import type { LoadedTrack } from '$lib/utils/normalizeTrack';

  export let track: LoadedTrack | null = null;
  export let open = false;
  export let onClose: () => void;

  // Swipe / drag physics
  let startY = 0;
  let currentY = 0;
  let translateY = 0;
  let isDragging = false;

  let modalEl: HTMLDivElement | null = null;

  // Parallax state
  let scrollY = 0;

  function handleScroll() {
    if (!modalEl) return;
    scrollY = modalEl.scrollTop;
  }

  function onTouchStart(e: TouchEvent) {
    isDragging = true;
    startY = e.touches[0].clientY;
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging) return;

    currentY = e.touches[0].clientY;
    translateY = Math.max(0, currentY - startY);

    if (modalEl) {
      modalEl.style.transform = `translateY(${translateY}px)`;
    }
  }

  function onTouchEnd() {
    if (!isDragging) return;
    isDragging = false;

    if (translateY > 120) {
      onClose();
    } else {
      if (modalEl) {
        modalEl.style.transition = 'transform 0.25s ease-out';
        modalEl.style.transform = 'translateY(0)';
        setTimeout(() => {
          if (modalEl) modalEl.style.transition = '';
        }, 260);
      }
    }

    translateY = 0;
  }

  // Expandable sections
  let showDetail = false;
  let showArtist = false;
</script>

{#if open}
  <!-- Backdrop -->
  <div class="modal-backdrop" on:click={onClose} transition:fade />

  <!-- Modal -->
  <div
    bind:this={modalEl}
    class="modal"
    transition:fly={{ y: 30, duration: 160 }}
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
    on:scroll={handleScroll}
  >
    <!-- Grab handle -->
    <div class="grab-handle"></div>

    <!-- Album Header w/ Parallax -->
    <div
      class="album-header"
      style="transform: translateY({scrollY * 0.12}px);"
    >
      {#if track?.albumArtwork}
        <img src={track.albumArtwork} alt="Album Art" class="album-art" />
      {/if}

      <div class="album-text">
        <h2 class="track-title">{track?.trackName}</h2>
        <p class="track-artist">{track?.artistName}</p>
      </div>
    </div>

    <!-- Intro Section -->
    <div class="modal-section">
      <div class="section-header">
        <h3>Intro</h3>
      </div>
      <p>{track?.intro ?? '—'}</p>
    </div>

    <!-- Detail Section -->
    <div class="modal-section expandable" on:click={() => (showDetail = !showDetail)}>
      <div class="section-header">
        <h3>Detail</h3>
        <span class="arrow {showDetail ? 'rotate' : ''}">▶</span>
      </div>

      {#if showDetail}
        <p transition:fade>{track?.detail ?? '—'}</p>
      {/if}
    </div>

    <!-- Artist Section -->
    <div class="modal-section expandable" on:click={() => (showArtist = !showArtist)}>
      <div class="section-header">
        <h3>Artist</h3>
        <span class="arrow {showArtist ? 'rotate' : ''}">▶</span>
      </div>

      {#if showArtist}
        <p transition:fade>{track?.artistDescription ?? '—'}</p>
      {/if}
    </div>

    <!-- Close Button -->
    <button class="close-btn" on:click={onClose}>✕</button>
  </div>
{/if}

<style>
  /* Backdrop */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 900;
  }

  /* Modal wrapper */
  .modal {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 80vh;
    background: #111;
    color: #fff;
    padding: 0.75rem 1rem 2rem;
    border-radius: 16px 16px 0 0;
    overflow-y: auto;
    z-index: 999;
    touch-action: pan-y;
  }

  /* Grab Handle */
  .grab-handle {
    width: 48px;
    height: 5px;
    background: #444;
    border-radius: 3px;
    margin: 0.35rem auto 0.7rem;
    opacity: 0.85;
  }

  /* Album Header */
  .album-header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1.2rem;
    transition: transform 0.18s ease-out;
  }

  .album-art {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    box-shadow: 0 0 6px rgba(0,0,0,0.5);
  }

  .album-text {
    display: flex;
    flex-direction: column;
  }

  .track-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .track-artist {
    margin: 0;
    margin-top: 2px;
    opacity: 0.8;
    font-size: 0.9rem;
  }

  /* Sections */
  .modal-section {
    margin-bottom: 1.3rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
  }

  .section-header h3 {
    font-size: 0.9rem;
    opacity: 0.9;
    margin: 0;
  }

  /* Arrow animation */
  .arrow {
    display: inline-block;
    transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
    transform-origin: center;
    font-size: 1.1rem;
    opacity: 0.8;
  }

  .arrow.rotate {
    transform: rotate(90deg);
  }

  p {
    opacity: 0.92;
    line-height: 1.45;
    margin-top: 0.5rem;
  }

  /* Close button */
  .close-btn {
    position: absolute;
    top: 0.4rem;
    right: 0.75rem;
    background: none;
    border: none;
    color: #aaa;
    font-size: 1.25rem;
    cursor: pointer;
  }
</style>
