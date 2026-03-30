<script lang="ts">
    import type { VoicePart } from '$lib/types/options';

    export let selectedVoices: VoicePart[] = ['intro'];

    const DJ_PRESET: VoicePart[] = ['intro', 'detail'];
    const RADIO_PRESET: VoicePart[] = ['intro'];
    const STORY_PRESET: VoicePart[] = ['intro', 'detail', 'artist'];

    function toggle(part: VoicePart): void {
        if (selectedVoices.includes(part)) {
            selectedVoices = selectedVoices.filter((p) => p !== part);
        } else {
            selectedVoices = [...selectedVoices, part];
        }
    }

    function isSelected(part: VoicePart): boolean {
        return selectedVoices.includes(part);
    }

    function setPreset(preset: VoicePart[]): void {
        selectedVoices = [...preset];
    }

    function matchesPreset(preset: VoicePart[]): boolean {
        if (selectedVoices.length !== preset.length) return false;
        const set = new Set(selectedVoices);
        return preset.every((p) => set.has(p));
    }
</script>

<div class="card">
    <h3>Voice Content</h3>

    <!-- Presets -->
    <div class="presets">
        <button
            type="button"
            class:preset-active={matchesPreset(RADIO_PRESET)}
            on:click={() => setPreset(RADIO_PRESET)}
        >
            Radio Mode
        </button>

        <button
            type="button"
            class:preset-active={matchesPreset(DJ_PRESET)}
            on:click={() => setPreset(DJ_PRESET)}
        >
            DJ Mode
        </button>

        <button
            type="button"
            class:preset-active={matchesPreset(STORY_PRESET)}
            on:click={() => setPreset(STORY_PRESET)}
        >
            Story Mode
        </button>
    </div>

    <!-- Voice parts -->
    <div class="chips">
        <button
            type="button"
            class:selected={isSelected('intro')}
            on:click={() => toggle('intro')}
        >
            Intro
        </button>

        <button
            type="button"
            class:selected={isSelected('detail')}
            on:click={() => toggle('detail')}
        >
            Detail
        </button>

        <button
            type="button"
            class:selected={isSelected('artist')}
            on:click={() => toggle('artist')}
        >
            Artist
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
        margin: 0 0 0.4rem;
        font-size: 1rem;
    }

    .presets {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 0.6rem;
    }

    .chips {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    /* Slight visual separation */
    .presets button {
        background: #333;
    }

    .chips button {
        background: #282828;
    }

    .chips button,
    .presets button {
        border-radius: 999px;
        border: 0;
        padding: 0.3rem 0.75rem;
        font-size: 0.85rem;
        cursor: pointer;
        color: #e0e0e0;
    }

    .chips button.selected,
    .presets button.preset-active {
        background: #1db954;
        color: #000;
        font-weight: 600;
    }

    .chips button:hover,
    .presets button:hover {
        background: #1db954;
        color: #000;
    }
</style>