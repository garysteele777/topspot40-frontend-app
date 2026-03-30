<script lang="ts">
    import type {VoicePart} from '$lib/types/options';

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

    <!-- Voice parts (display only) -->
    <div class="voice-parts">
        <div class:selected={isSelected('intro')} class="voice-part">
            Intro
        </div>

        <div class:selected={isSelected('detail')} class="voice-part">
            Detail
        </div>

        <div class:selected={isSelected('artist')} class="voice-part">
            Artist
        </div>
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

    /* Preset buttons row */
    .presets {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
        margin-bottom: 0.7rem;
    }

    .presets button {
        width: 100%;
        border-radius: 999px;
        border: 0;
        padding: 0.45rem 0.6rem;
        font-size: 0.9rem;
        cursor: pointer;
        text-align: center;
        background: #333;
        color: #e0e0e0;
    }

    .presets button.preset-active {
        background: #1db954;
        color: #000;
        font-weight: 600;
    }

    .presets button:hover {
        background: #1db954;
        color: #000;
    }

    /* Display-only voice parts row */
    .voice-parts {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
        margin-top: 0.15rem;
    }

    .voice-part {
        text-align: center;
        font-size: 1rem;
        font-weight: 500;
        color: #7f7f7f;
        padding-top: 0.1rem;
    }

    .voice-part.selected {
        color: #ffffff;
        font-weight: 700;
    }

    .presets,
    .voice-parts {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 0.5rem;
    }

    .presets button {
        height: 36px;
    }

</style>