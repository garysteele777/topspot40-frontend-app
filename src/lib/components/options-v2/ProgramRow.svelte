<script lang="ts">
    import {goto} from '$app/navigation';
    import type {ProgramHistory} from '$lib/carmode/programHistory';

    export let row: ProgramHistory;
    export let label: string;
    export let played: number;
    export let total: number;
    export let percent: number;

    export let onPlay: () => void;
    export let isCollection: boolean = false;
</script>

<div class="history-row__inner">
    <span class="history-row__label">
        ... {label}
    </span>

    <span class="history-row__progress">
        ✓ {played} / {total} • {percent}%
    </span>

    <div class="history-row__actions">
        <button class="btn btn--primary" on:click={onPlay}>
            ▶ Play
        </button>

        <button
            class="btn btn--secondary"
            disabled={isCollection}
            title={isCollection ? 'Collection Program View not implemented yet' : ''}
            on:click={() => {
                if (!isCollection) {
                    goto(`/program?programKey=${encodeURIComponent(row.key)}`);
                }
            }}
        >
            👁 View
        </button>
    </div>
</div>

<style>
    .history-row__inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        gap: 10px;
    }

    .history-row__label {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .history-row__progress {
        white-space: nowrap;
        opacity: 0.8;
    }

    .history-row__actions {
        display: flex;
        gap: 6px;
    }

    .history-row__inner {
    padding: 4px 0;
}
</style>