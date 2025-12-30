<script lang="ts">
  // make it local (no `export`)
  type TextOption = 'Intro Text' | 'Detail Text' | 'Intro + Detail Text';

  export let open = false;
  export let selected: TextOption | null = null;
  export let onToggle: () => void;
  export let onSelect: (opt: TextOption) => void;

  const options: TextOption[] = ['Intro Text', 'Detail Text', 'Intro + Detail Text'];
</script>

<div class="dropdown" style="margin-bottom:2rem;">
  <button
    class="dropdown-btn"
    on:click={onToggle}
    aria-expanded={open}
    aria-haspopup="menu">
    {selected ?? 'Text Options'} {open ? '▴' : '▾'}
  </button>

  {#if open}
    <div class="dropdown-content" role="menu" aria-label="Text options">
      {#each options as opt (opt)}
<button
  type="button"
  role="menuitemradio"
  aria-checked={selected === opt}
  class:selected={selected === opt}
  on:click={() => onSelect(opt)}
>
  {opt}
</button>

      {/each}
    </div>
  {/if}
</div>
