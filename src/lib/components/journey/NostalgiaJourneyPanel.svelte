<script lang="ts">
    import {programHistoryStore, resetNostalgiaPrograms} from '$lib/carmode/programHistory';
    import {favoritesStore, clearNostalgiaFavoriteGroups} from '$lib/favorites/favorites';
    import {nostalgiaDecades, nostalgiaGenres, nostalgiaGroups, nostalgiaCounts} from '$lib/journey/nostalgia';

    let decade = '';
    let genre = '';
    let notice = '';
    let pending: {kind: 'history' | 'favorites'; groups: string[]; label: string; count: number} | null = null;
    $: groups = nostalgiaGroups({decade, genre});
    $: counts = nostalgiaCounts($programHistoryStore, $favoritesStore, groups);
    $: label = groups.length ? `${decade === 'ALL' ? 'All Decades' : decade} · ${genre === 'ALL' ? 'All Genres' : nostalgiaGenres.find(g => g.slug === genre)?.label}` : 'No programs selected';
    function select(d: string, g: string) { decade = d; genre = g; notice = ''; pending = null; }
    function requestClear(kind: 'history' | 'favorites') {
        pending = {kind, groups: [...groups], label, count: kind === 'history' ? counts.played : counts.favorites};
    }
    function confirmClear() {
        if (!pending) return;
        const action = pending;
        if (action.kind === 'history') resetNostalgiaPrograms(action.groups);
        else clearNostalgiaFavoriteGroups(action.groups);
        notice = `${action.kind === 'history' ? 'Listening history' : 'Favorites'} cleared for ${action.label}.`;
        pending = null;
    }
</script>

<section class="nostalgia-journey" aria-labelledby="nostalgia-heading">
    <h3 id="nostalgia-heading">Nostalgia History & Favorites</h3>
    <p class="desktop-help">Select a genre row, decade column, or individual program. A new selection replaces the previous one.</p>
    <p class="mobile-help">Choose a decade and genre to manage their listening history or favorites.</p>
    <div class="selection-actions">
        <button type="button" on:click={() => select('ALL', 'ALL')}>Select All Nostalgia Programs</button>
        <button type="button" disabled={!groups.length && !decade && !genre} on:click={() => select('', '')}>Clear Selection</button>
    </div>
    <div class="mobile-filters">
        <label>Decade
            <select bind:value={decade} on:change={() => {notice = ''; pending = null;}}>
                <option value="">Choose a decade</option><option value="ALL">All Decades</option>
                {#each nostalgiaDecades as d}<option value={d}>{d}</option>{/each}
            </select>
        </label>
        <label>Genre
            <select bind:value={genre} on:change={() => {notice = ''; pending = null;}}>
                <option value="">Choose a genre</option><option value="ALL">All Genres</option>
                {#each nostalgiaGenres as g}<option value={g.slug}>{g.label}</option>{/each}
            </select>
        </label>
    </div>
    <div class="matrix">
        <table>
            <caption>Nostalgia programs: played entries and favorites in each source list</caption>
            <thead><tr><th scope="col">Genre</th>
                {#each nostalgiaDecades as d}<th scope="col"><button type="button" aria-label={`Select all genres in ${d}`} aria-pressed={decade === d && genre === 'ALL'} on:click={() => select(d, 'ALL')}>{d}</button></th>{/each}
            </tr></thead>
            <tbody>{#each nostalgiaGenres as g}<tr>
                <th scope="row"><button type="button" aria-label={`Select ${g.label} across all decades`} aria-pressed={genre === g.slug && decade === 'ALL'} on:click={() => select('ALL', g.slug)}>{g.label}</button></th>
                {#each nostalgiaDecades as d}
                    {@const stats = nostalgiaCounts($programHistoryStore, $favoritesStore, [`${d}|${g.slug}`])}
                    <td><button type="button" class:selected={groups.includes(`${d}|${g.slug}`)} aria-pressed={groups.includes(`${d}|${g.slug}`)} aria-label={`Select ${d} ${g.label}, ${stats.played} played, ${stats.favorites} favorites`} on:click={() => select(d, g.slug)}>
                        <span>{stats.played} played</span><span>★ {stats.favorites}</span>
                    </button></td>
                {/each}
            </tr>{/each}</tbody>
        </table>
    </div>
    <div class="summary" aria-live="polite">
        <strong>{label}</strong>
        {#if groups.length}<p>{counts.programs} programs selected · {counts.played} played entries · {counts.favorites} favorites</p>{/if}
    </div>
    <div class="clear-actions">
        <button type="button" disabled={!counts.played} on:click={() => requestClear('history')}>Clear Listening History</button>
        <button type="button" disabled={!counts.favorites} on:click={() => requestClear('favorites')}>Clear Favorites</button>
    </div>
    {#if pending}
        <div class="confirmation" role="group" aria-labelledby="clear-confirmation">
            <h4 id="clear-confirmation">{pending.kind === 'history' ? 'Clear listening history?' : 'Clear favorites?'}</h4>
            <p>{pending.kind === 'history' ? `Clear ${pending.count} played entries` : `Remove ${pending.count} favorites`} for <strong>{pending.label}</strong>?</p>
            <p>{pending.kind === 'history' ? 'Your favorites will be kept.' : 'Your listening history will be kept.'} Collections and Docuseries will be kept.</p>
            <button type="button" on:click={() => pending = null}>Cancel</button>
            <button type="button" on:click={confirmClear}>{pending.kind === 'history' ? 'Confirm Clear Listening History' : 'Confirm Clear Favorites'}</button>
        </div>
    {/if}
    <p role="status">{notice}</p>
</section>

<style>
    .nostalgia-journey { margin-top: 1rem; color: #f7edd5; }
    h3 { font-size: 1.3rem; } p { line-height: 1.5; }
    button, select { font: inherit; color: inherit; background: #29251e; border: 1px solid #b79a4c; border-radius: .5rem; padding: .65rem .8rem; min-height: 44px; }
    button { cursor: pointer; } button:hover:not(:disabled) { background: #493b20; }
    button:focus-visible, select:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
    button:disabled { opacity: .45; cursor: default; }
    .selection-actions, .clear-actions { display: flex; flex-wrap: wrap; gap: .75rem; margin: 1rem 0; }
    table { width: 100%; border-collapse: separate; border-spacing: .35rem; }
    caption { text-align: left; margin: .5rem 0; }
    th { text-align: left; } th button { width: 100%; }
    td button { width: 100%; padding: .65rem .3rem; }
    td span { display: block; font-size: .85rem; margin-top: .2rem; }
    button.selected, button[aria-pressed='true'] { background: #e6c66f; color: #17140e; border: 2px solid #fff0b5; }
    .summary, .confirmation { padding: 1rem; border: 1px solid #b79a4c; border-radius: .7rem; margin-top: 1rem; background: #222; }
    .confirmation button { margin: .25rem .5rem .25rem 0; }
    .mobile-filters, .mobile-help { display: none; }
    @media (max-width: 1000px) {
        .matrix, .desktop-help { display: none; }
        .mobile-help { display: block; }
        .mobile-filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
        label { display: grid; gap: .5rem; } select { width: 100%; min-width: 0; }
    }
    @media (max-width: 480px) { .mobile-filters { grid-template-columns: 1fr; } .clear-actions button { width: 100%; } }
</style>
