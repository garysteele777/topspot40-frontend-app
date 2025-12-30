<script lang="ts">
  import type { LoadedTrack as BaseLoadedTrack } from '$lib/utils/normalizeTrack';

  // Extend LoadedTrack locally to allow optional intro_short
  type NarrationTrack = BaseLoadedTrack & {
    intro_short?: string | null;
  };

  export let track: NarrationTrack | null = null;
  export let onOpenModal: () => void;
  // NEW: optional callback for “Back to Options”
  export let onBackToOptions: (() => void) | undefined;

  // Make this reactive so it updates when `track` changes
  $: shortIntro = track?.intro_short ?? track?.intro ?? '';
</script>

{#if track}
  <div class="narration-inline">
    {#if shortIntro}
      <p class="intro-text">{shortIntro}</p>
    {/if}

    <div class="button-row">
      <button class="more-btn" on:click={onOpenModal}>
        More Info →
      </button>

      {#if onBackToOptions}
        <button class="back-btn" on:click={onBackToOptions}>
          ⚙ Back to Options
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .narration-inline {
    margin-top: 1.2rem;
    text-align: center;
    color: #e5e5e5;
    font-size: 0.9rem;
    line-height: 1.35;
  }

  .intro-text {
    opacity: 0.85;
    margin-bottom: 0.4rem;
  }

  .button-row {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
  }

  .more-btn,
  .back-btn {
    margin-top: 0.2rem;
    padding: 0.25rem 0.9rem;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .more-btn {
    background: #1db954;
    color: #000;
  }

  .more-btn:hover {
    background: #19a448;
  }

  .back-btn {
    background: #374151; /* gray-700ish */
    color: #e5e7eb;
  }

  .back-btn:hover {
    background: #4b5563;
  }
</style>
