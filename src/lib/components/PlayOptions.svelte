<script lang="ts" context="module">
  // Export the type from the module script so other files can import it.
  export type PlayOption = 'Track only' | 'Intro + Track' | 'Intro + Detail + Track';
</script>

<script lang="ts">
  // When importing elsewhere, you'd use:
  // import type { PlayOption } from './PlayOptions.svelte';

  export let open = false;
  export let selected: PlayOption = 'Track only';
  export let onToggle: () => void;
  export let onSelect: (opt: PlayOption) => void;

  const options: PlayOption[] = ['Track only', 'Intro + Track', 'Intro + Detail + Track'];
</script>

<div class="dropdown">
  <button
    class="dropdown-btn"
    type="button"
    on:click={onToggle}
    aria-expanded={open}
    aria-haspopup="menu"
  >
    Play Options {open ? '▴' : '▾'}
  </button>

  {#if open}
    <div class="dropdown-content" role="menu" aria-label="Play options">
      {#each options as opt (opt)}
        <button
          type="button"
          role="menuitem"
          aria-current={selected === opt ? 'true' : 'false'}
          on:click={() => onSelect(opt)}
          on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(opt)}
        >
          {opt}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .dropdown { position: relative; margin-bottom: 2.5rem; }
  .dropdown-btn {
    background: #1db954; color: #fff; border: none; border-radius: 9999px;
    padding: .6rem 1.5rem; font-weight: 600; cursor: pointer;
  }
  .dropdown-content {
    position: absolute; top: 110%; left: 0; background: #282828; border-radius: .5rem;
    box-shadow: 0 4px 10px rgba(0,0,0,.3); overflow: hidden; z-index: 10; width: 100%;
  }
  .dropdown-content button {
    padding: .75rem 1rem; color: #fff; width: 100%; text-align: left; cursor: pointer;
  }
  .dropdown-content button:hover { background: #3e3e3e; }
</style>
