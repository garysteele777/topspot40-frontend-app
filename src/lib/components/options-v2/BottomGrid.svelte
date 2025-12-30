<script lang="ts">
  // Existing components (you already have these)
  import DecadeGenrePane from '$lib/components/options-v2/DecadeGenrePane.svelte';
  import CollectionsPane from '$lib/components/options-v2/CollectionsPane.svelte';

  // Parent-provided props
  export let decades: string[] = [];
  export let genres: string[] = [];
  export let collections: any[] = [];

  export let selectedDecades: string[] = [];
  export let selectedGenres: string[] = [];
  export let selectedCollections: string[] = [];

  // Callbacks from parent page
  export let onSelectDecade: (d: string) => void;
  export let onSelectGenre: (g: string) => void;
  export let onSelectCollection: (c: string) => void;
</script>

<!-- ───────────────────────────────────────────── -->
<!--               BOTTOM OPTIONS GRID             -->
<!-- ───────────────────────────────────────────── -->

<div class="bottom-grid">

  <!-- LEFT (Decade + Genre take 50%) -->
  <div class="left-side">
    <DecadeGenrePane
      {decades}
      {genres}
      {selectedDecades}
      {selectedGenres}
      onSelectDecade={onSelectDecade}
      onSelectGenre={onSelectGenre}
    />
  </div>

  <!-- RIGHT (Collections takes 50%) -->
  <div class="right-side">
    <CollectionsPane
      {collections}
      {selectedCollections}
      onSelectCollection={onSelectCollection}
    />
  </div>
</div>

<style>
  /* Full Row: 2 columns (50/50) */
  .bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }

  /* Purdue theme containers */
  .left-side,
  .right-side {
    background: #181818;
    border: 1px solid rgba(207, 184, 124, 0.25);
    padding: 1rem;
    border-radius: 10px;
  }

  /* MOBILE: stack the panes */
  @media (max-width: 900px) {
    .bottom-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
