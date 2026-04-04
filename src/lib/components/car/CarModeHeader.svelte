<script context="module" lang="ts">
    // Types live ONLY in module script → no runtime, no conflicts
    export type BrowseMode = 'decade_genre' | 'collection';
    export type PlaybackOrder = 'up' | 'down' | 'shuffle';
    export type VoicePlayMode = 'before' | 'over';
    export type PauseMode = 'pause' | 'continuous';
    export type CategoryMode = 'single' | 'multiple';
</script>

<script lang="ts">
    import type {PlaybackProgramType} from '$lib/types/program';

    // Props (runtime)
    export let decade: string | undefined;
    export let genre: string | undefined;
    export let collection: string | undefined; // ✅ ADD THIS
    export let mode: import('./CarModeHeader.svelte').BrowseMode = 'decade_genre';
    export let programType: PlaybackProgramType | undefined;


    export let language = 'en';
    export let voices: string[] = ['intro'];

    export let playbackOrder: import('./CarModeHeader.svelte').PlaybackOrder = 'up';
    export let voicePlayMode: import('./CarModeHeader.svelte').VoicePlayMode = 'before';
    export let pauseMode: import('./CarModeHeader.svelte').PauseMode = 'pause';
    export let skipPlayed: boolean = false;
    export let categoryMode: import('./CarModeHeader.svelte').CategoryMode = 'single';

    // Label helpers
    const modeLabel = (m: import('./CarModeHeader.svelte').BrowseMode) =>
        m === 'collection' ? 'Collection' : 'Decade–Genre';

    const categoryLabel = (m: import('./CarModeHeader.svelte').CategoryMode) =>
        m === 'multiple' ? 'Multiple' : 'Single';

    const orderLabel = (o: import('./CarModeHeader.svelte').PlaybackOrder) =>
        o === 'down' ? 'Down' : o === 'shuffle' ? 'Shuffle' : 'Up';

    const voicePlayLabel = (v: import('./CarModeHeader.svelte').VoicePlayMode) =>
        v === 'over' ? 'Over Track' : 'Before Track';

    const pauseLabel = (p: import('./CarModeHeader.svelte').PauseMode) =>
        p === 'continuous' ? 'Continuous' : 'Pause Between Tracks';

    const voiceText = (vs: string[]) => (vs.length ? vs.join(', ') : 'None');
</script>

<div class="cm-panel">
    <div class="cm-main">
        <div class="cm-row cm-row--title">
            <span class="cm-tag">🚗 Car Mode</span>

            {#if mode === 'decade_genre'}
  <span class="cm-main-text">

{#if programType === 'FAV_DG'}

  {#if (decade ?? '').toUpperCase() === 'ALL'}

      {#if genre}
          ⭐ All Decades {genre.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} Favorites
      {:else}
          ⭐ All Decades Favorites (All Genres)
      {/if}

  {:else}

      {#if genre}
          ⭐ {decade ?? '—'} {genre.replace(/_/g, ' ')} Favorites
      {:else}
          ⭐ {decade ?? '—'} Favorites (All Genres)
      {/if}

  {/if}

{:else}

  {decade ?? '—'} • {genre ? genre.replace(/_/g, ' ') : '—'}

{/if}

      {#if programType === 'RADIO_DG'}
        TopSpot Radio • {genre ? genre.replace(/_/g, ' ') : 'All Genres'}
        {:else}
            {decade ?? '—'} • {genre ? genre.replace(/_/g, ' ') : '—'}
        {/if}

  </span>
            {:else}



  <span class="cm-main-text">
    {collection ?? '—'}
  </span>
            {/if}

        </div>

        <div class="cm-row cm-row--primary">
            <span>{modeLabel(mode)}</span>
            <span>•</span>
            <span>Category: {categoryLabel(categoryMode)}</span>
            <span>•</span>
            <span>Lang: {language.toUpperCase()}</span>
        </div>

        <div class="cm-row cm-row--secondary">
            <span>Voices: {voiceText(voices)}</span>
            <span>•</span>
            <span>Order: {orderLabel(playbackOrder)}</span>

            {#if skipPlayed}
                <span>•</span>
                <span class="cm-accent">Skip Played</span>
            {/if}

            <span>•</span>
            <span>{voicePlayLabel(voicePlayMode)}</span>
            <span>•</span>
            <span>{pauseLabel(pauseMode)}</span>
        </div>
    </div>
</div>

<style>
    .cm-panel {
        background: rgba(0, 0, 0, 0.45);
        padding: 0.55rem 0.9rem;
        border-radius: 10px;
        margin-bottom: 0.8rem;
        color: #fff;
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .cm-main {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        align-items: center; /* ⬅ center all rows horizontally */
    }

    .cm-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        align-items: center;
    }

    .cm-row--title {
        justify-content: flex-start;
        gap: 0.5rem;
        font-size: 0.95rem;
        font-weight: 600;
    }

    .cm-tag {
        background: #1db954;
        color: #000;
        border-radius: 999px;
        padding: 0.1rem 0.6rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .cm-main-text {
        opacity: 0.9;
    }

    .cm-row--primary {
        opacity: 0.95;
    }

    .cm-row--secondary {
        opacity: 0.75;
        font-size: 0.8rem;
    }

    .cm-accent {
        color: #cfb87c;
        font-weight: 600;
        text-shadow: 0 0 4px rgba(207, 184, 124, 0.4);
    }
</style>
