<script lang="ts">
    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {programHistory} from '$lib/carmode/programHistory';

    let playedCount = 0;

    $: {
        const sel = $currentSelection;

        let key: string | null = null;

        if (sel?.mode === 'decade_genre') {
            const d = sel.context?.decade;
            const g = sel.context?.genre;
            if (d && g) key = `DG|${d}|${g}`;
        } else if (sel?.mode === 'collection') {
            const c = sel.context?.collection_slug;
            if (c) key = `COL|${c}`;
        }

        const hist = $programHistory;
        playedCount = key ? (hist[key]?.length ?? 0) : 0;
    }
</script>


<div class="history-panel">
    <h3>Playback History</h3>

    <p>
        Tracks played this session:
        <strong>{playedCount}</strong>
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
