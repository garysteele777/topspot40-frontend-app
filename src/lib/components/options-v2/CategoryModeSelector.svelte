<script lang="ts">
  // Local union type – no imports needed
  export let categoryMode: 'single' | 'multiple' = 'single';
</script>

<div class="card">
  <h3>Category Mode</h3>
  <p class="hint">Choose whether to focus on one category or mix several.</p>

  <div class="options">
    <button
      type="button"
      class:selected={categoryMode === 'single'}
      on:click={() => (categoryMode = 'single')}
    >
      Single Category
    </button>

    <button
      type="button"
      class:selected={categoryMode === 'multiple'}
      on:click={() => (categoryMode = 'multiple')}
    >
      Multiple Categories
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
    border-radius: 999px;
    border: 0;
    padding: 0.4rem 0.5rem;
    font-size: 0.9rem;
    cursor: pointer;
    background: #282828;
    color: #e0e0e0;
    transition: all 0.15s ease-in-out;
  }

  button:hover {
    background: #3a3a3a;
  }

  button.selected {
    background: #1db954;
    color: #000;
    font-weight: 600;
    transform: scale(1.02);
  }
</style>
