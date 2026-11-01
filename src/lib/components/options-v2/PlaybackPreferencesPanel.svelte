<script lang="ts">
    import {getPlaybackPreferencesCopy} from '$lib/components/options-v2/playbackPreferencesCopy';
    import LanguageSelector from '$lib/components/options-v2/LanguageSelector.svelte';
    import VoiceContentSelector from '$lib/components/options-v2/VoiceContentSelector.svelte';

    import type {
        PlaybackOrder,
        VoicePart,
        DetailLength,
        Language
    } from '$lib/types/playback';

    type ActivePanel = 'languages' | 'voice' | 'playback';

    export let language: Language = 'en';
    export let languages: Language[] = ['en'];
    export let selectedVoices: VoicePart[] = ['intro'];
    export let detailLength: DetailLength = 'short';
    export let playbackMethod: 'automatic' | 'guided' = 'guided';
    export let showPlaybackMethod = true;
    export let playbackOrder: PlaybackOrder = 'up';
    export let pauseMode: 'pause' | 'continuous' = 'pause';
    export let skipPlayed = false;
    export let collapsed = false;
    export let onActivate: (() => void) | undefined = undefined;

    let activePanel: ActivePanel = 'languages';

    $: languageSummary =
        languages.map(l => l === 'ptbr' ? 'PT-BR' : l.toUpperCase()).join(' + ');

    $: methodSummary =
        playbackMethod === 'guided' ? copy.guidedSpotify : copy.automaticSpotify;

    $: orderSummary =
        playbackOrder === 'up' ? copy.up : playbackOrder === 'down' ? copy.down : copy.shuffle;

    $: flowSummary =
        pauseMode === 'continuous' ? copy.continuous : copy.pause;

    $: trackStrategySummary =
        skipPlayed ? copy.favorNew : copy.allEqual;

    $: effectiveVoices = [
        ...(selectedVoices.includes('intro') ? ['intro'] : []),
        ...(detailLength !== 'off' ? ['detail'] : []),
        ...(selectedVoices.includes('artist') ? ['artist'] : [])
    ];
    $: voiceSummary =
        effectiveVoices.length === 0
            ? copy.trackOnly
            : effectiveVoices
                .map(v =>
                    v === 'intro'
                        ? copy.intro
                        : v === 'detail'
                            ? `${copy.detail} (${detailLength === 'off' ? copy.off : detailLength === 'short' ? copy.short : copy.long})`
                            : copy.artist
                )
                .join('+');
    $: copy = getPlaybackPreferencesCopy(language);
</script>

<div class="opt-cell playback-preferences-card">
    {#if onActivate}
        <div
                class="section-header-row section-header-clickable"
                role="button"
                tabindex="0"
                on:click={() => onActivate?.()}
                on:keydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onActivate?.();
                    }
                }}
        >
            <h3 class="section-title">⚙ {copy.title}</h3>
            <span class="section-toggle">{collapsed ? '▼' : '▲'}</span>
        </div>

        <div class="radio-description">
            {languageSummary} • {methodSummary} • {orderSummary} • {flowSummary} • {trackStrategySummary} • {voiceSummary}
        </div>
    {/if}

    {#if !collapsed}
        <div class="radio-buttons">
            <button type="button" class:active={activePanel === 'languages'}
                    on:click|stopPropagation={() => activePanel = 'languages'}>
                🌐 {copy.languages}
            </button>

            <button type="button" class:active={activePanel === 'voice'}
                    on:click|stopPropagation={() => activePanel = 'voice'}>
                🎙 {copy.voice}
            </button>

            <button type="button" class:active={activePanel === 'playback'}
                    on:click|stopPropagation={() => activePanel = 'playback'}>
                ▶ {copy.playback}
            </button>
        </div>

        <div class="preferences-divider"></div>

        <div class="preferences-panel-body">
            {#if activePanel === 'languages'}
                <LanguageSelector bind:language bind:languages/>
            {/if}

            {#if activePanel === 'voice'}
                <VoiceContentSelector {language} bind:selectedVoices bind:detailLength/>
            {/if}

            {#if activePanel === 'playback'}
                <div class="preference-tile">
                    <h3 class="tile-title">{copy.playback}</h3>

                    <div class="playback-section">

                        {#if showPlaybackMethod}
                            <div class="playback-group">
                                <div class="label">{copy.method}</div>

                                <div class="grid grid-2">
                                    <button
                                            class:selected={playbackMethod === 'automatic'}
                                            on:click|stopPropagation={() => playbackMethod = 'automatic'}
                                    >
                                    {copy.automaticSpotify}
                                    </button>

                                    <button
                                            class:selected={playbackMethod === 'guided'}
                                            on:click|stopPropagation={() => playbackMethod = 'guided'}
                                    >
                                    {copy.guidedSpotify}
                                    </button>
                                </div>
                            </div>
                        {/if}

                        <div class="playback-group">
                            <div class="label">{copy.order}</div>

                            <div class="grid">
                                <button
                                        class:selected={playbackOrder === 'up'}
                                        on:click|stopPropagation={() => playbackOrder = 'up'}
                                >
                                    {copy.up}
                                </button>

                                <button
                                        class:selected={playbackOrder === 'down'}
                                        on:click|stopPropagation={() => playbackOrder = 'down'}
                                >
                                    {copy.down}
                                </button>

                                <button
                                        class:selected={playbackOrder === 'shuffle'}
                                        on:click|stopPropagation={() => playbackOrder = 'shuffle'}
                                >
                                    {copy.shuffle}
                                </button>
                            </div>
                        </div>

                        <div class="playback-group">
                            <div class="label">{copy.tracks}</div>

                            <div class="grid grid-2">
                                <button
                                        class:selected={skipPlayed}
                                        on:click|stopPropagation={() => skipPlayed = true}
                                >
                                    {copy.favorNew}
                                </button>

                                <button
                                        class:selected={!skipPlayed}
                                        on:click|stopPropagation={() => skipPlayed = false}
                                >
                                    {copy.allEqual}
                                </button>
                            </div>
                        </div>

                        <div class="playback-group">
                            <div class="label">{copy.flow}</div>

                            <div class="grid grid-2">
                                <button
                                        class:selected={pauseMode === 'pause'}
                                        on:click|stopPropagation={() => pauseMode = 'pause'}
                                >
                                    {copy.pause}
                                </button>

                                <button
                                        class:selected={pauseMode === 'continuous'}
                                        on:click|stopPropagation={() => pauseMode = 'continuous'}
                                >
                                    {copy.continuous}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            {/if}
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

    .radio-buttons button:hover {
        border-color: #666;
    }

    .radio-buttons button.active {
        background: #2ea043;
        color: #fff;
        border-color: #2ea043;
        font-weight: 600;
    }

    .preferences-divider {
        margin: 12px 0 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
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


    .preferences-panel-body {
        margin-top: 12px;
    }

    /* =========================
       PLAYBACK SECTION
    ========================= */

    .playback-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 4px;
    }

    .playback-group {
        display: grid;
        grid-template-columns: 110px minmax(0, 1fr);
        align-items: center;
        column-gap: 10px;
    }

    .playback-group .label {
        font-size: 0.8rem;
        color: #ccc;
    }

    .grid {
        display: grid;
        gap: 6px;
        grid-template-columns: repeat(3, 1fr);
    }

    .grid-2 {
        grid-template-columns: repeat(2, 1fr);
    }

    .grid button {
        min-width: 0;
        white-space: normal;
        overflow-wrap: anywhere;
        padding: 5px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .grid button:hover {
        border-color: #666;
    }

    .grid button.selected {
        background: #2ea043;
        color: #fff;
        border-color: #2ea043;
        font-weight: 600;
    }

    .preference-tile {
        background: rgba(40, 40, 40, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 10px;
        padding: 12px;

        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03),
        0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .tile-title {
        margin: 0 0 10px 0;
        font-size: 1rem;
        color: #f5f5f5;
        font-weight: 700;
    }
    @media (max-width: 600px) {
        .playback-group {
            grid-template-columns: minmax(0, 1fr);
            row-gap: 5px;
        }
    }
</style>
