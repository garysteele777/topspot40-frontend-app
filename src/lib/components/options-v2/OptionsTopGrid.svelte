<script lang="ts">
  // ─────────────────────────────────────────────
  // Imports (Option 1 — existing components)
  // ─────────────────────────────────────────────
  import ModeToggle from '$lib/components/options-v2/ModeToggle.svelte';
  import CategoryModeSelector from '$lib/components/options-v2/CategoryModeSelector.svelte';
  import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
  import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';

  import TrackRangeSelector from '$lib/components/options-v2/TrackRangeSelector.svelte';
  import PlaybackOrderSelector from '$lib/components/options-v2/PlaybackOrderSelector.svelte';
  import VoicePlaybackSelector from '$lib/components/options-v2/VoicePlaybackSelector.svelte';
  import PauseModeSelector from '$lib/components/options-v2/PauseModeSelector.svelte';

  // Props from page
  export let language: 'en' | 'es' | 'pt';
  export let voiceParts: string[];
  export let playbackOrder: 'up' | 'down' | 'shuffle';
  export let voicePlayMode: 'before' | 'over';
  export let pauseMode: 'short' | 'long';
  export let startRank: number;
  export let endRank: number;
  export let categoryMode: 'single' | 'multiple';
  export let browseMode: 'decade_genre' | 'collection';

  // Callback functions from parent
  export let onLanguage: (lang: 'en' | 'es' | 'pt') => void;
  export let onVoiceParts: (parts: string[]) => void;
  export let onPlaybackOrder: (order: 'up' | 'down' | 'shuffle') => void;
  export let onVoicePlayMode: (mode: 'before' | 'over') => void;
  export let onPauseMode: (mode: 'short' | 'long') => void;
  export let onTrackRange: (range: { start: number; end: number }) => void;
  export let onCategoryMode: (m: 'single' | 'multiple') => void;
  export let onBrowseMode: (m: 'decade_genre' | 'collection') => void;
</script>

<!-- ───────────────────────────────────────────── -->
<!--               TOP OPTIONS GRID                 -->
<!-- ───────────────────────────────────────────── -->

<div class="options-grid">
  <!-- Row 1 -->
  <ModeToggle
    {browseMode}
    onSelect={onBrowseMode}
  />

  <CategoryModeSelector
    {categoryMode}
    onSelect={onCategoryMode}
  />

  <LanguageSelector
    {language}
    onSelect={onLanguage}
  />

  <VoiceContentSelector
    voices={voiceParts}
    onSelect={onVoiceParts}
  />

  <!-- Row 2 -->
  <TrackRangeSelector
    {startRank}
    {endRank}
    onSelect={onTrackRange}
  />

  <PlaybackOrderSelector
    {playbackOrder}
    onSelect={onPlaybackOrder}
  />

  <VoicePlaybackSelector
    {voicePlayMode}
    onSelect={onVoicePlayMode}
  />

  <PauseModeSelector
    {pauseMode}
    onSelect={onPauseMode}
  />
</div>

<style>
  .options-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;

    padding: 1rem 0;
  }

  /* Purdue theme — subtle gold borders */
  .options-grid > * {
    background: #181818;
    border: 1px solid rgba(207, 184, 124, 0.25); /* Purdue Gold */
    border-radius: 10px;
    padding: 0.75rem;
  }

  /* Mobile: stack as 2×? */
  @media (max-width: 900px) {
    .options-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Small mobile: single column */
  @media (max-width: 520px) {
    .options-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
