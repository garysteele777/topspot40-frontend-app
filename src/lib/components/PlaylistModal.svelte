<script lang="ts">
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';

    export let visible = false;
    export let onClose: () => void;

    type Order = 'countdown' | 'countup' | 'random';
    type VoiceOpt = 'intro' | 'detail' | 'artist' | 'all';

    import {get} from 'svelte/store';

    const current = get(playbackSettingsStore);

    let order: Order =
        current.playbackOrder === 'down'
            ? 'countdown'
            : current.playbackOrder === 'shuffle'
                ? 'random'
                : 'countup';

    let voiceOption: VoiceOpt =
        current.voices.length > 1 ? 'all' : current.voices[0];

    let skipPlayed = current.skipPlayed;
    let pauseMode: 'pause' | 'continuous' = current.pauseMode;

    function applySettings() {
        const playbackOrder =
            order === 'countdown'
                ? 'down'
                : order === 'random'
                    ? 'shuffle'
                    : 'up';

        playbackSettingsStore.set({
            playbackOrder,
            skipPlayed,
            pauseMode,
            voices:
                voiceOption === 'all'
                    ? ['intro', 'detail', 'artist']
                    : [voiceOption],
            voicePlayMode: 'before'
        });

        onClose();
    }
</script>

{#if visible}
    <div class="overlay" on:click={onClose}>
        <div
                class="popup"
                role="dialog"
                aria-modal="true"
                aria-labelledby="playback-settings-title"
                tabindex="-1"
                on:click|stopPropagation
        >
            <h2 id="playback-settings-title">Playback Settings</h2>

            <label>
                Order:
                <select bind:value={order}>
                    <option value="countdown">Countdown (40 → 1)</option>
                    <option value="countup">Count Up (1 → 40)</option>
                    <option value="random">Random</option>
                </select>
            </label>

            <label>
                Voices:
                <select bind:value={voiceOption}>
                    <option value="intro">Intro</option>
                    <option value="detail">Detail</option>
                    <option value="artist">Artist</option>
                    <option value="all">All</option>
                </select>
            </label>

            <label>
                Pause Mode:
                <select bind:value={pauseMode}>
                    <option value="pause">Pause Between Tracks</option>
                    <option value="continuous">Continuous</option>
                </select>
            </label>

            <label class="checkbox">
                <input type="checkbox" bind:checked={skipPlayed}/>
                Skip Played Tracks
            </label>

            <div class="actions">
                <button on:click={applySettings}>Apply</button>
                <button class="secondary" on:click={onClose}>Cancel</button>
            </div>
        </div>
    </div>
{/if}
<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(3px);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden; /* prevent background scroll */
    }

    .popup {
        background: #1e1e1e;
        color: white;
        padding: 2rem;
        border-radius: 12px;
        width: 90%;
        max-width: 600px; /* keep desktop nice */
        max-height: 80vh; /* keep inside viewport */
        overflow-y: auto; /* allow internal scroll */
        text-align: left;
    }

    label {
        display: block;
        margin-bottom: 1rem;
    }

    input,
    select {
        width: 100%;
        padding: 0.5rem;
        margin-top: 0.3rem;
        border-radius: 6px;
        border: none;
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 1rem;
    }

    button {
        padding: 0.6rem 1.2rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }

    button:first-of-type {
        background: #1db954;
        color: white;
    }

    .secondary {
        background: #444;
        color: white;
    }

</style>
