<script lang="ts">
  import EarButton from '$lib/components/ui/EarButton.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { PickerGroup } from '$lib/types/pickers';

  export let title: string;
  export let group: PickerGroup;
  export let options: { id: string; label: string; mp3?: string }[] = [];
  export let mode: 'single' | 'multiple' = 'single';
  export let activeGroup: PickerGroup | null = 'decade';
  export let selected: string[] = [];

  const dispatch = createEventDispatcher<{
    change: { group: PickerGroup; selected: string[] };
    activate: { group: PickerGroup };
  }>();

  $: isMulti = mode === 'multiple';
  $: isActive = isMulti || activeGroup === group;

  function onActivate() {
    if (!isMulti && !isActive) {
      dispatch('activate', { group });
    }
  }

  function onHeaderKey(e: KeyboardEvent) {
    // Make header “clickable” via keyboard for a11y
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate();
    }
  }

  function toggleSingle(id: string) {
    if (!isActive) return;
    selected = [id];
    dispatch('change', { group, selected });
  }

  function toggleMulti(id: string) {
    if (!isActive) return;
    selected = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    dispatch('change', { group, selected });
  }

  function selectAll() {
    if (!isActive || !isMulti) return;
    selected = options.map((o) => o.id);
    dispatch('change', { group, selected });
  }

  function clearAll() {
    if (!isActive || !isMulti) return;
    selected = [];
    dispatch('change', { group, selected });
  }

  // Default mp3 path if not provided
  function mp3For(opt: { id: string; mp3?: string }) {
    return opt.mp3 ?? `/audio/${group}s/${opt.id}.mp3`;
  }

  function idFor(optId: string) {
    return `${group}_${optId}`;
  }
</script>

<section class="picker" data-disabled={isActive ? 'false' : 'true'}>
  <header
    class="picker__header"
    role="button"
    tabindex="0"
    aria-pressed={isActive ? 'true' : 'false'}
    on:click={onActivate}
    on:keydown={onHeaderKey}
  >
    <h3 class="picker__title">{title}</h3>

    {#if isMulti}
      <div class="picker__tools">
        <button type="button" on:click|stopPropagation={selectAll}>Select All</button>
        <button type="button" on:click|stopPropagation={clearAll}>Unselect All</button>
      </div>
    {/if}
  </header>

  <ul class="picker__list">
    {#each options as opt (opt.id)}
      <li class="picker__item">
        <label class="picker__label">
          {#if isMulti}
            <input
              type="checkbox"
              disabled={!isActive}
              checked={selected.includes(opt.id)}
              on:change={() => toggleMulti(opt.id)}
            />
          {:else}
            <input
              type="radio"
              name={group}
              disabled={!isActive}
              checked={selected[0] === opt.id}
              on:change={() => toggleSingle(opt.id)}
            />
          {/if}
          <span class="picker__text">{opt.label}</span>
        </label>

        <EarButton id={idFor(opt.id)} src={mp3For(opt)} label={`Preview ${opt.label}`} />
      </li>
    {/each}
  </ul>
</section>

<style>
  .picker {
    background: #181818;
    border-radius: 12px;
    padding: 0.75rem 0.75rem 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  }

  .picker[data-disabled="true"] {
    opacity: 0.5;
    filter: grayscale(0.2);
    /* still allow focus for a11y, but no click-through via JS logic */
  }

  .picker__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    cursor: pointer; /* acts like a button */
    user-select: none;
  }

  .picker__title {
    color: #1db954;
    font-size: 1.15rem;
    margin: 0;
  }

  .picker__tools {
    display: flex;
    gap: 0.4rem;
  }

  .picker__tools button {
    background: #282828;
    color: #b3b3b3;
    border: 0;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-size: 0.95rem;
  }

  .picker__tools button:hover {
    background: #333;
    color: #fff;
  }

  .picker__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.4rem;
    max-height: 250px;
    overflow-y: auto;
  }

  .picker__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    background: #1a1a1a;
    border-radius: 8px;
    padding: 0.5rem 0.6rem;
  }

  .picker__label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .picker__text {
    color: #e6e6e6;
    white-space: normal;
    font-size: 1rem;
  }

  input[type='checkbox'],
  input[type='radio'] {
    accent-color: #1db954;
  }

  /* svelte-ignore css-unused-selector */
  .picker + .picker {
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    margin-top: 1rem;
    padding-top: 1rem;
  }
</style>
