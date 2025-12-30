<script lang="ts">
  export let modeType: 'decade_genre' | 'collection' = 'decade_genre';
  export let setMode: (m: 'decade_genre' | 'collection') => void;
</script>

<div class="card">
  <h3>Browse Mode</h3>
  <p class="hint">Choose how you want to explore music.</p>

  <div class="options">
    <button
      type="button"
      class:selected={modeType === 'decade_genre'}
      title="Browse by decade and genre — classic TopSpot40 mode"
      on:click={() => setMode('decade_genre')}
    >
      <span class="icon">📀</span>
      <span>Decade + Genre</span>
    </button>

    <button
      type="button"
      class:selected={modeType === 'collection'}
      title="Browse curated collections, playlists, and themes"
      on:click={() => setMode('collection')}
    >
      <span class="icon">🎨</span>
      <span>Collections</span>
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
    color: #ffffff;
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
    border-radius: 12px;
    border: 0;
    padding: 0.55rem 0.6rem;
    font-size: 0.9rem;
    cursor: pointer;
    background: #2a2a2a;
    color: #e0e0e0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    justify-content: center;
    transition: all 0.18s ease-in-out;
  }

  button:hover {
    background: #3a3a3a;
    transform: translateY(-2px);
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
  }

  button.selected {
    background: #1db954;
    color: #000;
    font-weight: 600;
    transform: scale(1.03);
    box-shadow: 0px 0px 8px rgba(29, 185, 84, 0.45);
  }

  .icon {
    font-size: 1.1rem;
  }
</style>
