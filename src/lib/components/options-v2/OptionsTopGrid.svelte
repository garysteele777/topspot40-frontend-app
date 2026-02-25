<script lang="ts">
    // ─────────────────────────────────────────────
    // Imports (bind-based components)
    // ─────────────────────────────────────────────
    import ModeToggle from '$lib/components/options-v2/ModeToggle.svelte';
    import CategoryModeSelector from '$lib/components/options-v2/CategoryModeSelector.svelte';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';

    import PlaybackOrderSelector from '$lib/components/options-v2/PlaybackOrderSelector.svelte';
    import VoicePlaybackSelector from '$lib/components/options-v2/VoicePlaybackSelector.svelte';
    import PauseModeSelector from '$lib/components/options-v2/PauseModeSelector.svelte';

    import type { VoicePart, Language } from '$lib/types/playback';

    // ─────────────────────────────────────────────
    // Props (state is owned by parent, mutated via bind)
    // ─────────────────────────────────────────────
    export let modeType: 'decade_genre' | 'collection';

    export let language: Language;

    export let selectedVoices: VoicePart[];

    export let playbackOrder: 'up' | 'down' | 'shuffle';
    export let voicePlayMode: 'before' | 'during';
    export let pauseMode: 'pause' | 'continuous';

    export let categoryMode: 'single' | 'multiple';
</script>


<!-- ───────────────────────────────────────────── -->
<!--               TOP OPTIONS GRID                -->
<!-- ───────────────────────────────────────────── -->

<div class="options-grid">
    <!-- Row 1 -->
    <ModeToggle
            modeType={modeType}
            setMode={(m) => (modeType = m)}
    />

    <CategoryModeSelector bind:categoryMode/>

    <LanguageSelector bind:language/>

    <VoiceContentSelector bind:selectedVoices/>

    <PlaybackOrderSelector bind:playbackOrder/>

    <VoicePlaybackSelector bind:voicePlayMode/>

    <PauseModeSelector bind:pauseMode/>
</div>

<style>
    .options-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        padding: 1rem 0;
    }

    /* Purdue theme — subtle gold borders */
    /*.options-grid > * {*/
    /*    background: #181818;*/
    /*    border: 1px solid rgba(207, 184, 124, 0.25); !* Purdue Gold *!*/
    /*    border-radius: 10px;*/
    /*    padding: 0.75rem;*/
    /*}*/

    /* Mobile: 2 columns */
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
