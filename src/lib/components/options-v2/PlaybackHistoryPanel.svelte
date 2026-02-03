<script lang="ts">
    import { programHistory } from '$lib/carmode/CarMode.store';
    import { get } from 'svelte/store';

    $: history = get(programHistory);
</script>

<section class="history-panel">
    <h3>Playback History</h3>

    {#if Object.keys(history).length === 0}
        <p>No history yet.</p>
    {:else}
        <ul>
            {#each Object.entries(history) as [key, set]}
                <li>
                    {key} — {set.size} played
                </li>
            {/each}
        </ul>
    {/if}
</section>
