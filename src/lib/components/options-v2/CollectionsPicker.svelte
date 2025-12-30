<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { PickerGroup } from '$lib/types/pickers';

  type CollectionsGroup = {
    open: boolean;
    name: string;
    slug: string;
    items: { id: number | string; name: string; slug: string }[];
  };

  export let groups: CollectionsGroup[] = [];

  // This WAS the bug: parent was not sending the current mode
  export let mode: 'single' | 'multiple' = 'single';

  // Whether this picker is currently active (UI state from parent)
  export let active = false;

  // Selected slugs (comes from parent store)
  export let selected: string[] = [];

  const dispatch = createEventDispatcher<{
    change: { group: PickerGroup; selected: string[] };
    activate: { group: PickerGroup };
  }>();

  function isSelected(slug: string): boolean {
    return selected.includes(slug);
  }

  function toggleCollection(slug: string): void {
    dispatch('activate', { group: 'collection' });

    // 🟢 Single-select (radio button behavior)
    if (mode === 'single') {
      const next = selected.includes(slug) ? [] : [slug];
      dispatch('change', { group: 'collection', selected: next });
      return;
    }

    // 🟢 Multi-select (checkbox behavior)
    const next = isSelected(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];

    dispatch('change', { group: 'collection', selected: next });
  }

  // Return appropriate icon for current mode
  function iconFor(slug: string): 'radio' | 'radioChecked' | 'box' | 'boxChecked' {
    const sel = isSelected(slug);
    if (mode === 'single') {
      return sel ? 'radioChecked' : 'radio';
    }
    return sel ? 'boxChecked' : 'box';
  }

  // Group controls
  function expandAll(): void {
    groups = groups.map((g) => ({ ...g, open: true }));
  }

  function collapseAll(): void {
    groups = groups.map((g) => ({ ...g, open: false }));
  }

  function selectAll(): void {
    const allSlugs = groups.flatMap((g) => g.items.map((i) => i.slug));
    dispatch('change', { group: 'collection', selected: allSlugs });
  }

  function clearAll(): void {
    dispatch('change', { group: 'collection', selected: [] });
  }
</script>

<section class="picker-group" data-active={active}>
  <header class="picker-group__header">
    <h3>Collections</h3>

    <div class="expand-controls">
      <button type="button" class="toolbar-btn" on:click={expandAll}>Expand All</button>
      <button type="button" class="toolbar-btn toolbar-btn--ghost" on:click={collapseAll}>
        Collapse All
      </button>

      {#if mode === 'multiple' && active}
        <button type="button" class="toolbar-btn" on:click={selectAll}>Select All</button>
        <button type="button" class="toolbar-btn toolbar-btn--ghost" on:click={clearAll}>
          Unselect All
        </button>
      {/if}
    </div>
  </header>

  <div class="picker-group__body">
    {#if !groups.length}
      <p>No collections available.</p>
    {:else}
      {#each groups as group (group.slug)}
        <details bind:open={group.open} class="collection-group">
          <summary>{group.name}</summary>

          <ul>
            {#each group.items as col (col.slug)}
              {#if col}
                <li>
                  <button
                    type="button"
                    class="collection-row"
                    on:click={() => toggleCollection(col.slug)}
                    aria-pressed={isSelected(col.slug)}
                  >
                    <span class="select-icon" class:active={isSelected(col.slug)}>
                      {#if iconFor(col.slug) === 'radio'}
                        <svg viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" />
                        </svg>
                      {:else if iconFor(col.slug) === 'radioChecked'}
                        <svg viewBox="0 0 20 20">
                          <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" />
                          <circle cx="10" cy="10" r="5" fill="currentColor" />
                        </svg>
                      {:else if iconFor(col.slug) === 'box'}
                        <svg viewBox="0 0 20 20">
                          <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                        </svg>
                      {:else}
                        <svg viewBox="0 0 20 20">
                          <rect x="3" y="3" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2" />
                          <path
                            d="M6 10l3 3 5-6"
                            stroke="currentColor"
                            stroke-width="2"
                            fill="none"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      {/if}
                    </span>

                    <span class="collection-name">{col.name}</span>
                  </button>
                </li>
              {/if}
            {/each}
          </ul>
        </details>
      {/each}
    {/if}
  </div>
</section>

<style>
  /* same CSS as yours */
</style>
