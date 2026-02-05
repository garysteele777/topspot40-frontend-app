<script lang="ts">
    import type { VoicePlayMode } from '$lib/types/playback';

    export let voicePlayMode: VoicePlayMode = 'before';
</script>

<div class="card">
    <h3>Voice Playback Style</h3>
    <p class="hint">Choose whether narration plays before or during the music.</p>

    <div class="options">
        <button
            type="button"
            class:selected={voicePlayMode === 'before'}
            on:click={() => (voicePlayMode = 'before')}
        >
            Before Track
        </button>

        <button
            type="button"
            class:selected={voicePlayMode === 'during'}
            on:click={() => (voicePlayMode = 'during')}
        >
            During Track
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
        margin: 0 0 0.25rem;
        font-size: 1rem;
    }

    .hint {
        margin: 0 0 0.5rem;
        font-size: 0.85rem;
        color: #b3b3b3;
    }

    .options {
        display: flex;
        gap: 0.4rem;
    }

    button {
        flex: 1;
        border-radius: 999px;
        border: 0;
        padding: 0.35rem 0.5rem;
        font-size: 0.9rem;
        cursor: pointer;
        background: #282828;
        color: #e0e0e0;
    }

    button.selected {
        background: #1db954;
        color: #000;
        font-weight: 600;
    }
</style>
