<script lang="ts">
  type LayoutMode = 'car' | 'list';

  export let layoutMode: LayoutMode = 'car';
</script>

<div class="card">
  <h3>Display Mode</h3>
  <p class="hint">Pick how you want to see your tracks.</p>

  <div class="options">
    <button
      type="button"
      class:selected={layoutMode === 'car'}
      on:click={() => (layoutMode = 'car')}
    >
      🚗 Car Mode
    </button>
    <button
      type="button"
      class:selected={layoutMode === 'list'}
      on:click={() => (layoutMode = 'list')}
    >
      📋 List Mode
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
</style>
