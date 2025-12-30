<script lang="ts">
  // FIXED: align with page.svelte
  type Language = 'en' | 'es' | 'ptbr';
  export let language: Language = 'en';
</script>

<div class="card">
  <h3>Track Preview Language</h3>
  <p class="hint">Choose the language for intros and details.</p>

  <div class="options">
    <button
      type="button"
      class:selected={language === 'en'}
      on:click={() => (language = 'en')}
    >
      English
    </button>

    <button
      type="button"
      class:selected={language === 'es'}
      on:click={() => (language = 'es')}
    >
      Español
    </button>

    <button
      type="button"
      class:selected={language === 'ptbr'}
      on:click={() => (language = 'ptbr')}
    >
      Português (BR)
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
    flex-wrap: wrap;
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
