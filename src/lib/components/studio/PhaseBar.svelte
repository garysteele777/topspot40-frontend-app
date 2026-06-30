<script lang="ts">
    import {playbackPhase} from '$lib/carmode/CarMode.store';

    const phases = [
        {key: 'intro', label: 'Intro'},
        {key: 'detail', label: 'Detail'},
        {key: 'artist', label: 'Artist'},
        {key: 'track', label: 'Track'}
    ];

    $: activeIndex = phases.findIndex(p => p.key === $playbackPhase);
</script>

<div class="phase-bar">
    {#each phases as phase, index}
        <div
                class="phase-step"
                class:active={phase.key === $playbackPhase}
                class:complete={activeIndex > index}
        >
            <span class="dot">
                {activeIndex > index ? '✓' : ''}
            </span>
            <span class="label">{phase.label}</span>
        </div>
    {/each}
</div>

<style>
    .phase-bar {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding: 0.8rem 1rem;
        border-bottom: 1px solid rgba(207, 184, 124, 0.25);
    }

    .phase-step {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: rgba(255, 255, 255, 0.45);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.72rem;
        transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .dot {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        display: grid;
        place-items: center;
        border: 1px solid rgba(255, 255, 255, 0.35);
        font-size: 0.75rem;
        transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
    }

    .phase-step.active {
        color: #cfb87c;
        font-weight: 800;
    }

    .phase-step.active .dot {
        background: #cfb87c;
        color: #050505;
        border-color: #cfb87c;
    }

    .phase-step.complete {
        color: rgba(255, 255, 255, 0.75);
    }

    .phase-step.complete .dot {
        border-color: #cfb87c;
        color: #cfb87c;
    }
</style>
