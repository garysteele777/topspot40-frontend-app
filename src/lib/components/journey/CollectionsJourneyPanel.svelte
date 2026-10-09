<script lang="ts">
    import {programHistoryStore, resetCollectionPrograms} from '$lib/carmode/programHistory';
    import {favoritesStore, clearCollectionFavoriteLists} from '$lib/favorites/favorites';
    import {collectionSourceLists, collectionCounts, type CollectionHistoryGroup} from '$lib/journey/collectionsHistory';
    export let collectionGroups: CollectionHistoryGroup[] = [];
    let group = '';
    let notice = '';
    let pending: {kind: 'history' | 'favorites'; lists: string[]; label: string; count: number} | null = null;
    $: lists = collectionSourceLists(collectionGroups, 'ALL');
    $: counts = collectionCounts($programHistoryStore, $favoritesStore, lists);
    $: selectedGroup = collectionGroups.find(g => g.slug === group);
    function select(g: string) { group = group === g ? '' : g; notice = ''; pending = null; }
    function requestClear(kind: 'history' | 'favorites', sourceLists: string[], label: string) {
        const stats = collectionCounts($programHistoryStore, $favoritesStore, sourceLists);
        pending = {kind, lists: [...sourceLists], label, count: kind === 'history' ? stats.played : stats.favorites};
    }
    function confirmClear() {
        if (!pending) return;
        const action = pending;
        if (action.kind === 'history') resetCollectionPrograms(action.lists);
        else clearCollectionFavoriteLists(action.lists);
        notice = `${action.kind === 'history' ? 'Listening history' : 'Favorites'} cleared for ${action.label}.`;
        pending = null;
    }
</script>
<section aria-labelledby="collections-history-heading">
    <h3 id="collections-history-heading">Collections History & Favorites</h3>
    <p>Click a collection group to expand its listening history and favorites.</p>
    <div class="actions">
        <button type="button" disabled={!counts.played} on:click={() => requestClear('history', lists, 'All Collections')}>Clear All Listening History</button>
        <button type="button" disabled={!counts.favorites} on:click={() => requestClear('favorites', lists, 'All Collections')}>Clear All Favorites</button>
    </div>
    {#if pending}
        <div class="confirmation" role="group" aria-labelledby="collections-clear-confirmation">
            <h4 id="collections-clear-confirmation">{pending.kind === 'history' ? 'Clear listening history?' : 'Clear favorites?'}</h4>
            <p>{pending.kind === 'history' ? `Clear ${pending.count} played entries` : `Remove ${pending.count} favorites`} for <strong>{pending.label}</strong>?</p>
            <p>{pending.kind === 'history' ? 'Your favorites will be kept.' : 'Your listening history will be kept.'} Nostalgia and Docuseries will be kept.</p>
            <button type="button" on:click={() => pending = null}>Cancel</button>
            <button type="button" on:click={confirmClear}>{pending.kind === 'history' ? 'Confirm Clear Listening History' : 'Confirm Clear Favorites'}</button>
        </div>
    {/if}
    <p role="status">{notice}</p>
    <h4>Collection Groups</h4>
    <div class="cards">
        {#each collectionGroups as g}
            {@const stats = collectionCounts($programHistoryStore, $favoritesStore, collectionSourceLists(collectionGroups, g.slug))}
            <div class="card">
                <button type="button" class="expand" aria-expanded={group === g.slug} aria-label={`Expand group ${g.name}`} on:click={() => select(g.slug)}>
                    <strong>{g.name}</strong><span>{stats.played} / {stats.total} tracks played</span><span>★ {stats.favorites} favorites</span><div class="progress"><div style={`width: ${stats.total ? Math.min(100, stats.played / stats.total * 100) : 0}%`}></div></div>
                </button>
                <div class="card-actions">
                    <button type="button" disabled={!stats.played} aria-label={`Clear history for ${g.name}`} on:click={() => requestClear('history', collectionSourceLists(collectionGroups, g.slug), g.name)}>Clear Group History</button>
                    <button type="button" disabled={!stats.favorites} aria-label={`Clear favorites for ${g.name}`} on:click={() => requestClear('favorites', collectionSourceLists(collectionGroups, g.slug), g.name)}>Clear Favorites</button>
                </div>
            </div>
        {/each}
    </div>
    {#if selectedGroup}
        <h4>{selectedGroup.name} — Individual Collections</h4>
        <div class="cards">
            {#each selectedGroup.items as item}
                {@const stats = collectionCounts($programHistoryStore, $favoritesStore, [`${item.slug}|${selectedGroup.slug}`])}
                <div class="card">
                    <strong>{item.name}</strong><span>{stats.played} / {stats.total} tracks played</span><span>★ {stats.favorites} favorites</span><div class="progress"><div style={`width: ${stats.total ? Math.min(100, stats.played / stats.total * 100) : 0}%`}></div></div>
                    <div class="card-actions">
                        <button type="button" disabled={!stats.played} aria-label={`Clear history for ${item.name}`} on:click={() => requestClear('history', [`${item.slug}|${selectedGroup.slug}`], item.name)}>Clear Played Tracks</button>
                        <button type="button" disabled={!stats.favorites} aria-label={`Clear favorites for ${item.name}`} on:click={() => requestClear('favorites', [`${item.slug}|${selectedGroup.slug}`], item.name)}>Clear Favorites</button>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
    {#if !collectionGroups.length}<p>No collections are available yet.</p>{/if}
</section>
<style>
    section { margin-top: 1rem; color: #f7edd5; }
    h3 { font-size: 1.3rem; } p { line-height: 1.5; }
    button { font: inherit; color: inherit; background: #29251e; border: 1px solid #b79a4c; border-radius: .5rem; padding: .65rem .8rem; min-height: 44px; cursor: pointer; }
    button:hover:not(:disabled) { background: #493b20; }
    button:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    button:disabled { opacity: .45; cursor: default; }
    .actions { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1rem 0; }
    .confirmation { padding: 1rem; border: 1px solid #b79a4c; border-radius: .7rem; background: #222; }
    .confirmation button { margin: .25rem .5rem .25rem 0; }
    .cards { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
    .card { text-align: left; overflow-wrap: anywhere; padding: .8rem; background: #252525; border: 1px solid #444; border-radius: .7rem; }
    .expand { width: 100%; text-align: left; background: transparent; border: 0; padding: 0; }
    .progress { height: 6px; background: #111; border-radius: 999px; overflow: hidden; margin-top: .5rem; }
    .progress div { height: 100%; background: #cfb87c; }
    .card-actions { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: .6rem; }
    .card-actions button { font-size: .8rem; padding: .4rem .6rem; }
    .card strong, .card span { display: block; margin: .3rem 0; }
    .card span { font-size: .85rem; }
    .expand[aria-expanded="true"] { color: #e6c66f; }
    @media(max-width: 850px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media(max-width: 480px) { .cards { grid-template-columns: 1fr; } .actions button { width: 100%; } }
</style>
