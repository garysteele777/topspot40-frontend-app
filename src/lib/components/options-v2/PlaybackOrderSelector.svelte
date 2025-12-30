<script lang="ts">
  type PlaybackOrder = 'up' | 'down' | 'shuffle';

  export let playbackOrder: PlaybackOrder = 'up';
  export let globalMode: 'single' | 'multiple' = 'single';
</script>


<div class="card">
  <h3>Playback Order</h3>
  <p class="hint">
    {#if globalMode === 'single'}
      Play tracks in order, reverse, or shuffle.
    {:else}
      Multiple categories selected — shuffle only.
    {/if}
  </p>

  <div class="options">
    <button
      type="button"
      class:selected={playbackOrder === 'up'}
      disabled={globalMode === 'multiple'}
      on:click={() => (playbackOrder = 'up')}
    >
      Count Up
    </button>
    <button
      type="button"
      class:selected={playbackOrder === 'down'}
      disabled={globalMode === 'multiple'}
      on:click={() => (playbackOrder = 'down')}
    >
      Count Down
    </button>
    <button
      type="button"
      class:selected={playbackOrder === 'shuffle'}
      on:click={() => (playbackOrder = 'shuffle')}
    >
      Shuffle
    </button>
  </div>
</div>

<style>
  .card {
    background: #181818;
    border-radius: 10px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
  }

  .hint {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: #b3b3b3;
  }

  .options {
    display: flex;
    gap: 0.4rem;
  }

  button {
    flex: 1;
    border-radius: 999px;
    border: 0;
    padding: 0.35rem 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    background: #282828;
    color: #e0e0e0;
  }

  button.selected {
    background: #1db954;
    color: #000;
    font-weight: 600;
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
