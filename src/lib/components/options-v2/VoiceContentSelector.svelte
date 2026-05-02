<script lang="ts">
    import type {VoicePart} from '$lib/types/options';

    const DJ_PRESET: VoicePart[] = ['intro', 'detail'];
    const RADIO_PRESET: VoicePart[] = ['intro'];
    const STORY_PRESET: VoicePart[] = ['intro', 'detail', 'artist'];

    export let selectedVoices: VoicePart[] = [...DJ_PRESET];

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

    <div class="grid">
        <button class:selected={matchesPreset(RADIO_PRESET)} on:click={() => setPreset(RADIO_PRESET)}>
            Radio
        </button>

        <button class:selected={matchesPreset(DJ_PRESET)} on:click={() => setPreset(DJ_PRESET)}>
            DJ
        </button>

        <button class:selected={matchesPreset(STORY_PRESET)} on:click={() => setPreset(STORY_PRESET)}>
            Story
        </button>
    </div>

    <div class="grid voice-display">
        <div class:selected={isSelected('intro')}>Intro</div>
        <div class:selected={isSelected('detail')}>Detail</div>
        <div class:selected={isSelected('artist')}>Artist</div>
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

    .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }

    button {
        width: 100%;
        border-radius: 999px;
        border: 0;
        padding: 0.45rem 0.6rem;
        font-size: 0.9rem;
        cursor: pointer;
        background: #333;
        color: #e0e0e0;
    }

    button.selected {
        background: #1db954;
        color: #000;
        font-weight: 600;
    }

    button:hover {
        background: #1db954;
        color: #000;
    }

    .voice-display {
        margin-top: 0.25rem;
    }

    .voice-display div {
        text-align: center;
        font-size: 0.9rem;
        color: #7f7f7f;
    }

    .voice-display div.selected {
        color: #fff;
        font-weight: 600;
    }
</style>