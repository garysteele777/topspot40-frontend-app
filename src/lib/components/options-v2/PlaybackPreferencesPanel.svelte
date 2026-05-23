<script lang="ts">
    import type {
        PlaybackOrder,
        VoicePart,
        Language
    } from '$lib/types/playback';

    type PreferenceMode =
        | 'narration'
        | 'playback'
        | 'flow'
        | null;

    export let languages: Language[] = ['en'];
    export let selectedVoices: VoicePart[] = ['intro'];
    export let playbackOrder: PlaybackOrder = 'up';
    export let pauseMode: 'pause' | 'continuous' = 'pause';
    export let skipPlayed = false;
    export let collapsed = false;
    export let onActivate: (() => void) | undefined = undefined;


    let preferenceMode: PreferenceMode = null;

    $: languageSummary =
        languages.map(l =>
            l === 'ptbr' ? 'PT-BR' : l.toUpperCase()
        ).join(' + ');

    $: orderSummary =
        playbackOrder === 'up'
            ? 'Up'
            : playbackOrder === 'down'
                ? 'Down'
                : 'Shuffle';

    $: flowSummary =
        pauseMode === 'continuous'
            ? 'Continuous'
            : 'Pause';

    $: trackStrategySummary =
        skipPlayed ? 'Favor New' : 'All Equal';

    $: voiceSummary =
        selectedVoices.length === 0
            ? 'Track Only'
            : selectedVoices
                .map(v =>
                    v === 'intro'
                        ? 'Intro'
                        : v === 'detail'
                            ? 'Detail'
                            : 'Artist'
                )
                .join('+');
</script>
<div class="opt-cell playback-preferences-card">
    <div
            class="section-header-row section-header-clickable"
            role="button"
            tabindex="0"
            on:click={() => {
            onActivate?.();
        }}
            on:keydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate?.();
            }
        }}
    >
        <h3 class="section-title">⚙ TopSpot40 Playback Preferences</h3>
        <span class="section-toggle">{collapsed ? '▼' : '▲'}</span>
    </div>

    <div class="radio-description">
        {languageSummary} • {orderSummary} • {flowSummary} • {trackStrategySummary} • {voiceSummary}
    </div>

    {#if !collapsed}
        <div class="radio-buttons">
            <button
                    type="button"
                    class:active={preferenceMode === 'narration'}
                    on:click={() => preferenceMode = 'narration'}
            >
                Narration
            </button>

            <button
                    type="button"
                    class:active={preferenceMode === 'playback'}
                    on:click={() => preferenceMode = 'playback'}
            >
                Playback
            </button>

            <button
                    type="button"
                    class:active={preferenceMode === 'flow'}
                    on:click={() => preferenceMode = 'flow'}
            >
                Flow
            </button>
        </div>
    {/if}
</div>

<style>
    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    }

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }

    .radio-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    .radio-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
    }

    .radio-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
    }

    .radio-buttons button.active {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .section-title {
        margin: 0;
    }

    .section-toggle {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.95;
    }

    .section-header-clickable {
        cursor: pointer;
    }

</style>