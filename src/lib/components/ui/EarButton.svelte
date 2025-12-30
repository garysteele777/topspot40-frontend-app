<script lang="ts">
  import { play, stop, playingId } from '$lib/utils/previewAudio';
  import { get } from 'svelte/store';

  export let id: string;
  export let src: string;
  export let label: string = '';

  async function toggle() {
    if (!src) return;
    const current = get(playingId);      // ✅ read store value safely
    if (current === id) {
      stop(id);
    } else {
      await play(id, src);
    }
  }
</script>

<button
  class="ear"
  class:active={$playingId === id}
  on:click|stopPropagation={toggle}
  aria-label={label}
  title={label}>
  <span class="icon">🎧</span>
</button>

<style>
  .ear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    width: 28px;
    border-radius: 50%;
    border: 0;
    background: #282828;
    color: #b3b3b3;
    cursor: pointer;
    transition: background .15s ease, transform .1s ease, color .15s ease;
  }
  .ear:hover { background: #333; color: #fff; }
  .ear.active { background: #1DB954; color: #000; }
  .icon { font-size: 14px; line-height: 1; }
</style>
