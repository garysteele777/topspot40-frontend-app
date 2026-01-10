<script lang="ts">
    import type {LoadedTrack} from '$lib/utils/normalizeTrack';

    export let currentTrack: LoadedTrack | null = null;
    export let tracks: LoadedTrack[] = [];

    export let elapsed = 0;
    export let duration = 1;
    export let progress = 0;
    export let phase: 'idle' | 'bed' | 'intro' | 'detail' | 'artist' | 'track' = 'idle';

    function toTitleCase(str?: string | null) {
        return str
            ? str.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')
            : '';
    }

    function formatTime(sec: number) {
        if (!sec || sec < 0) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    $: titleCased = toTitleCase(currentTrack?.trackName);
    $: artistCased = toTitleCase(currentTrack?.artistName);

    $: phaseLabel =
        phase === 'intro' ? 'Now playing intro…' :
            phase === 'detail' ? 'Now playing story…' :
                phase === 'artist' ? 'Now playing artist bio…' :
                    phase === 'bed' ? 'Starting sequence…' :
                        phase === 'track' ? 'Now playing track…' :
                            '';

    let expand = false;

    $: effectiveDuration =
        phase === 'track' && currentTrack?.durationMs
            ? Math.floor(currentTrack.durationMs / 1000)
            : duration;
</script>

<!-- META -->
<div class="meta-under-cover">
	<span class="text-gray-400 text-sm">
		Rank {currentTrack?.rank ?? '?'} of {tracks.length}
	</span>

    <div class="track-title">— {titleCased}</div>
    <div class="text-gray-200">{artistCased}</div>
</div>

<!-- PROGRESS -->
<div class="progress-under-cover">
    <div class="flex justify-between text-sm text-gray-400 mb-1">
        <span>{formatTime(elapsed)}</span>
        <span>{formatTime(effectiveDuration)}</span>
    </div>

    <div class="purdue-progress-bg">
        <div
                class="purdue-progress-fill"
                style={`width: ${progress}%`}

        />
    </div>

    {#if phaseLabel}
        <button
                type="button"
                class="phase-wrapper"
                on:click={() => (expand = !expand)}
        >
            <div class="phase-eq">
                <div class="bar b1"></div>
                <div class="bar b2"></div>
                <div class="bar b3"></div>
                <div class="bar b4"></div>
                <div class="bar b5"></div>
            </div>

            <!-- 🔴 THIS IS THE BANNER YOU LOST -->
            <div class="phase-banner">
                <div class="phase-label-deluxe">
                    <div class="phase-marquee">
                        <span>{phaseLabel}</span>
                    </div>
                </div>
            </div>

            {#if expand}
                <div class="phase-expand">
                    Extra narration info coming soon…
                </div>
            {/if}
        </button>
    {/if}
</div>

<style>
    :root {
        --purdue-gold: #CFB991;
        --purdue-gold-light: #E8D7A7;
        --purdue-black: #000000;
    }

    .meta-under-cover,
    .progress-under-cover {
        max-width: 320px;
        margin: 0 auto;
        text-align: center;
    }

    .track-title {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .purdue-progress-bg {
        width: 100%;
        height: 12px;
        background: var(--purdue-black);
        border-radius: 9999px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
    }

    .purdue-progress-fill {
        height: 100%;
        background: linear-gradient(
                90deg,
                var(--purdue-gold),
                var(--purdue-gold-light),
                var(--purdue-gold)
        );
        background-size: 200% 100%;
        animation: gold-shimmer 2.4s infinite linear;
        transition: width 0.25s linear;
    }

    @keyframes gold-shimmer {
        from {
            background-position: 200% 0;
        }
        to {
            background-position: -200% 0;
        }
    }

    /* 🔴 VISUAL ANCHOR FOR BANNER */
    .phase-banner {
        background: rgba(0, 0, 0, 0.55);
        padding: 6px 14px;
        border-radius: 14px;
        box-shadow: 0 0 12px rgba(0, 0, 0, 0.6);
        margin-top: 6px;
    }

    .phase-wrapper {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 14px;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
    }

    .phase-eq {
        display: flex;
        gap: 5px;
        height: 14px;
        margin-bottom: 6px;
    }

    .phase-eq .bar {
        width: 4px;
        background: var(--purdue-gold-light);
        border-radius: 3px;
        opacity: 0.85;
        animation: eqPulse 1.3s infinite ease-in-out;
    }

    .b1 {
        animation-delay: 0s;
    }

    .b2 {
        animation-delay: 0.12s;
    }

    .b3 {
        animation-delay: 0.24s;
    }

    .b4 {
        animation-delay: 0.36s;
    }

    .b5 {
        animation-delay: 0.48s;
    }

    @keyframes eqPulse {
        0% {
            height: 3px;
            opacity: 0.5;
        }
        25% {
            height: 14px;
            opacity: 1;
        }
        50% {
            height: 7px;
            opacity: 0.75;
        }
        75% {
            height: 12px;
            opacity: 1;
        }
        100% {
            height: 3px;
            opacity: 0.5;
        }
    }

    .phase-expand {
        margin-top: 8px;
        padding: 10px;
        width: 100%;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 10px;
        color: var(--purdue-gold-light);
        font-size: 0.9rem;
    }
</style>
