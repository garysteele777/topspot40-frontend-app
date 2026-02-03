<script lang="ts">
    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistory} from '$lib/carmode/programHistory';

    import {derived} from 'svelte/store';

    const currentKey = derived(currentSelection, ($sel) => {
        if (!$sel?.context) return null;

        if ($sel.mode === 'decade_genre') {
            return `DG|${$sel.context.decade}|${$sel.context.genre}`;
        }

        if ($sel.mode === 'collection') {
            return `COL|${$sel.context.collection_slug}`;
        }

        return null;
    });

    const playedCount = derived(
        [programHistory, currentKey],
        ([$hist, $key]) => {
            if (!$key) return 0;
            return $hist[$key]?.length ?? 0;
        }
    );

</script>

<div class="history-panel">
    <h3>Playback History</h3>

    <p>
        Tracks played this session:
        <strong>{$playedCount}</strong>
    </p>
</div>

<style>
    .history-panel {
        margin-top: 12px;
        padding: 10px;
        border: 1px solid #333;
        border-radius: 8px;
        font-size: 0.85rem;
        opacity: 0.85;
    }
</style>
