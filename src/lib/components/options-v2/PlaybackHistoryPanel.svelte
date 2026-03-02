<script lang="ts">

    import {
        countFavorites,
        clearFavorites,
        getFavorites   // ✅ add this
    } from '$lib/favorites/favorites';


    import {
        programHistoryStore as programHistory,
        resetProgram,
        resetAllPrograms,
        type ProgramHistory
    } from '$lib/carmode/programHistory';

    import {onMount} from 'svelte';
    import {fetchGroupedCatalog} from '$lib/api/catalog';
    import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';
    import {goto} from '$app/navigation';
    import {currentSelection} from '$lib/carmode/CarMode.store';

    let catalogDecades: string[] = [];
    let catalogGenres: string[] = [];

    let collectionGroupNameMap: Record<string, string> = {};
    let collectionNameMap: Record<string, string> = {};
    let collectionSlugToGroupSlug: Record<string, string> = {};

    const genreIconMap: Record<string, string> = {
        blues_jazz: '🎷',
        country: '🤠',
        folk_acoustic: '🪕',
        latin_global: '💃',
        pop: '🎤',
        rnb_soul: '🎹',
        rock: '🎸',
        tv_themes: '📺'
    };

    function getGenreIcon(slug: string | undefined): string {
        if (!slug) return '🎵';
        return genreIconMap[slug] ?? '🎵';
    }

    function pct(played: number, total: number): number {
        if (!total || total <= 0) return 0;
        return Math.round((played / total) * 100);
    }

    function decadeTotals(block: { decade: string; genres: Array<{ played: number; total: number }> }) {
        const totalTracks = block.genres.reduce((sum, r) => sum + (r.total ?? 0), 0);
        const totalPlayed = block.genres.reduce((sum, r) => sum + (r.played ?? 0), 0);
        const percent = pct(totalPlayed, totalTracks);
        return {totalTracks, totalPlayed, percent};
    }

    function toTitleCaseFromSlug(s: string): string {
        return s
            .replaceAll('_', ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    function decadeSortKey(decade: string): number {
        const m = decade.match(/\d{4}/);
        return m ? Number(m[0]) : Number.POSITIVE_INFINITY;
    }

    function getAllDecadeFavorites(): number[] {
        const all: number[] = [];

        for (const decade of catalogDecades) {
            for (const genre of catalogGenres) {
                const ids = getFavorites('DG', `${decade}|${genre}`);
                all.push(...ids);
            }
        }

        return [...new Set(all)];
    }

    // ─────────────────────────────────────────────
    // Launch helpers (avoid URL parsing crashes)
    // ─────────────────────────────────────────────

    const TRACKS_PER_PROGRAM = 40;

    function allDecadesAllGenresTotal(): number {
        return catalogDecades.length * catalogGenres.length * TRACKS_PER_PROGRAM;
    }

    function allDecadesPerGenreTotal(): number {
        return catalogDecades.length * TRACKS_PER_PROGRAM;
    }

    function allDecadesLabel(): string {
        return 'All Decades';
    }

    function playShuffleAllDecadesAllGenres() {
        console.log('▶ Shuffle ALL Decades, ALL Genres');

        currentSelection.update((s) => ({
            ...s,
            mode: 'decade_genre',
            programType: 'DG',
            context: {
                ...(s.context ?? {}),
                decade: 'ALL',
                genre: 'ALL'
            },
            playbackOrder: 'shuffle'
        }));

        goto('/car-page');
    }

    type PlaybackOrder = 'up' | 'down' | 'shuffle';
    type PauseMode = 'pause_between' | 'continuous';
    type VoicePlayMode = 'before_track';

    function playShuffleFavorites(decade: string) {
        console.log('▶ Shuffle Favorites for', decade);

        currentSelection.update((s) => ({
            ...s,

            mode: 'decade_genre',
            programType: 'FAV_DG',

            context: {
                ...(s.context ?? {}),
                favoritesType: 'DG',
                favoritesGroup: decade,
                decade
            },


            playbackOrder: 'shuffle'
        }));

        goto('/car-page');
    }

    function playShuffleAllDecadeFavorites() {
        console.log('▶ Shuffle ALL Decade Favorites');

        currentSelection.update((s) => ({
            ...s,

            mode: 'decade_genre',       // keep consistent with header
            programType: 'FAV_DG',

            decade: 'ALL',              // 🔥 THIS is the key
            genre: 'favorites',         // 🔥 force favorites label

            context: {
                favoritesType: 'DG',
                favoritesGroup: 'ALL'
            },

            playbackOrder: 'shuffle'
        }));

        goto('/car-page');
    }

    function totalPlayedAcrossAll(): number {
        let total = 0;

        for (const realDecade of catalogDecades) {
            for (const genre of catalogGenres) {
                const key = `DG|${realDecade}|${genre}`;
                const p = historyByKey.get(key);
                total += p?.playedRanks.length ?? 0;
            }
        }

        return total;
    }

    onMount(async () => {
        try {
            const data = await fetchGroupedCatalog();
            const normalized = normalizeCatalog(data);

            catalogDecades = normalized.decades.map(d => d.id);
            catalogGenres = normalized.genres.map(g => g.id);

            const groupMap: Record<string, string> = {};
            const nameMap: Record<string, string> = {};
            const slugToGroup: Record<string, string> = {};

            for (const group of normalized.collectionGroups) {
                groupMap[group.slug] = group.name;

                for (const item of group.items) {
                    nameMap[item.slug] = item.name;
                    slugToGroup[item.slug] = group.slug;
                }
            }

            collectionGroupNameMap = groupMap;
            collectionNameMap = nameMap;
            collectionSlugToGroupSlug = slugToGroup;

            console.log('📦 Collection name maps loaded', {
                collectionGroupNameMap,
                collectionNameMap
            });
        } catch (err) {
            console.error('Failed to load collection catalog:', err);
        }
    });


    // ─────────────────────────────────────────────
    // Derived groupings
    // ─────────────────────────────────────────────
    $: historyByKey = (() => {
        const m = new Map<string, ProgramHistory>();
        for (const p of $programHistory) m.set(p.key, p);
        return m;
    })();


    $: decadeGenreMap = (() => {
        const sortedDecades = [...catalogDecades]
            .sort((a, b) => decadeSortKey(a) - decadeSortKey(b));

        const buildBlock = (decade: string) => {

            // ───────────── ALL synthetic block ─────────────
            if (decade === 'ALL') {

                let totalPlayedAll = 0;

                for (const realDecade of catalogDecades) {
                    for (const genre of catalogGenres) {
                        const key = `DG|${realDecade}|${genre}`;
                        const p = historyByKey.get(key);
                        totalPlayedAll += p?.playedRanks.length ?? 0;
                    }
                }

                const superAllRow = {
                    decade: 'ALL',
                    genreSlug: 'all_genres',
                    key: 'DG|ALL|SUPER_ALL',
                    program: null,
                    played: totalPlayedAll,
                    favorites: catalogDecades.reduce((dTotal, realDecade) => {
                        return dTotal + catalogGenres.reduce((gTotal, genre) => {
                            return gTotal + countFavorites('DG', `${realDecade}|${genre}`);
                        }, 0);
                    }, 0),
                    total: allDecadesAllGenresTotal()
                };

                const perGenreRows = catalogGenres.map(genre => {

                    let totalPlayed = 0;

                    for (const realDecade of catalogDecades) {
                        const key = `DG|${realDecade}|${genre}`;
                        const p = historyByKey.get(key);
                        totalPlayed += p?.playedRanks.length ?? 0;
                    }

                    return {
                        decade: 'ALL',
                        genreSlug: genre,
                        key: `DG|ALL|${genre}`,
                        program: null,
                        played: totalPlayed,
                        favorites: catalogDecades.reduce((total, realDecade) => {
                            return total + countFavorites('DG', `${realDecade}|${genre}`);
                        }, 0),
                        total: allDecadesPerGenreTotal()
                    };
                });

                return {
                    decade: 'ALL',
                    genres: [superAllRow, ...perGenreRows]
                };
            }

            // ───────────── Normal decade block ─────────────

            return {
                decade,
                genres: catalogGenres.map(genre => {
                    const key = `DG|${decade}|${genre}`;
                    const p = historyByKey.get(key);

                    return {
                        decade,
                        genreSlug: genre,
                        key,
                        program: p ?? null,
                        played: p?.playedRanks.length ?? 0,
                        favorites: countFavorites('DG', `${decade}|${genre}`),
                        total: p?.total ?? 40
                    };
                })
            };
        };

        return [
            buildBlock('ALL'),        // 🔥 synthetic ALL block first
            ...sortedDecades.map(buildBlock)
        ];
    })();
    $: collectionPrograms = $programHistory.filter(
        (p): p is ProgramHistory => p.key.startsWith('COL|')
    );

    $: collectionGroupMap = (() => {
        const map = new Map<string, ProgramHistory[]>();

        for (const p of collectionPrograms) {
            const collectionSlug = p.key.split('|')[1];
            if (!collectionSlug) continue;

            const groupSlug = collectionSlugToGroupSlug[collectionSlug];
            if (!groupSlug) continue;

            if (!map.has(groupSlug)) map.set(groupSlug, []);
            map.get(groupSlug)!.push(p);
        }

        return [...map.entries()].map(([groupSlug, programs]) => ({
            groupSlug,
            groupName: collectionGroupNameMap[groupSlug] ?? groupSlug,
            programs
        }));
    })();


    function playedCount(p: ProgramHistory): number {
        return p.playedRanks.length;
    }

    function isCompleted(p: ProgramHistory): boolean {
        return p.playedRanks.length >= p.total;
    }


    function clearOne(p: ProgramHistory) {
        resetProgram(p.key);
    }

    function clearAll() {
        resetAllPrograms();
    }

    function resumeProgram(p: ProgramHistory) {
        if (!p) return;

        const nextRank = p.playedRanks.length + 1;
        const startRank = nextRank > p.total ? 1 : nextRank;

        resumeByKey(p.key, startRank, p.total);
    }

    function resumeByKey(programKey: string, startRank = 1, total = 40) {
        const parts = programKey.split('|');
        const decade = parts[1] ?? null;
        const genre = parts[2] ?? null;

        if (!decade || !genre) {
            console.error('Invalid DG key:', programKey);
            return;
        }

        currentSelection.update((prev) => ({
            ...prev,

            mode: 'decade_genre',
            programType: 'DG',

            context: {
                ...(prev?.context ?? {}),
                decade,
                genre
            },

            startRank,
            endRank: total,

            playbackOrder:
                decade === 'ALL'
                    ? 'shuffle'
                    : prev?.playbackOrder ?? 'up'
        }));

        goto('/car-page');
    }

</script>

<section class="history-panel">
    <header class="history-header">
        <h3>Playback History</h3>
        <p class="history-sub">
            Resume or clear previously played programs
        </p>
    </header>

    <!-- ───────────── Decade–Genre ───────────── -->
    <details class="history-section" open>
        <summary class="history-section__summary">
            🎵 Decade–Genre Programs
        </summary>

        <div class="history-section__body">
            {#if catalogDecades.length === 0 || catalogGenres.length === 0}
                <p class="history-empty">Loading decades and genres…</p>
            {:else}

                {#each decadeGenreMap as block}
                    {@const favCount = block.decade === 'ALL'
                        ? catalogDecades.reduce((decadeTotal, realDecade) => {
                            return decadeTotal + catalogGenres.reduce((genreTotal, genre) => {
                                return genreTotal + countFavorites('DG', `${realDecade}|${genre}`);
                            }, 0);
                        }, 0)
                        : catalogGenres.reduce((total, genre) => {
                            return total + countFavorites('DG', `${block.decade}|${genre}`);
                        }, 0)
                    }
                    <details class="history-subsection">
                        <summary class="history-subsection__summary">
                            {#if block.decade === 'ALL'}
                                {allDecadesLabel()}
                            {:else}
                                {@const t = decadeTotals(block)}
                                {block.decade} • {t.totalTracks} Tracks • {t.percent}% Complete
                            {/if}
                        </summary>

                        <ul class="history-list">

                            <li
                                    class="history-row history-row--favorite"
                                    class:history-row--disabled={favCount === 0}
                            >
                                <span class="history-row__label">
                                    ⭐ {block.decade === 'ALL'
                                    ? 'All Decades Favorites'
                                    : `${block.decade} Favorites (All Genres)` }
                                </span>

                                <span class="history-row__progress">
                                    {favCount === 0
                                        ? '0 Tracks'
                                        : favCount === 1
                                            ? '1 Track'
                                            : `${favCount} Tracks`}
                                </span>

                                <div class="history-row__actions">
                                    <button
                                            class="btn btn--primary"
                                            disabled={favCount === 0}
                                            on:click={() => playShuffleFavorites(block.decade)}
                                    >
                                        ▶ Play Shuffle
                                    </button>

                                    <button
                                            class="btn btn--ghost"
                                            disabled={favCount === 0}
                                            on:click={() => clearFavorites('DG', block.decade)}
                                    >
                                        🧹
                                    </button>
                                </div>
                            </li>

                            {#each block.genres as row}
                                <li class="history-row history-row--genre">
                                    <span class="history-row__label">
                                        {block.decade === 'ALL' && row.genreSlug === 'all_genres'
                                            ? '🎶'
                                            : getGenreIcon(row.genreSlug)
                                        }

                                        {block.decade === 'ALL' && row.genreSlug === 'all_genres'
                                            ? `All Decades, All Genres (${allDecadesAllGenresTotal()} tracks)`
                                            : block.decade === 'ALL'
                                                ? `All ${toTitleCaseFromSlug(row.genreSlug)} (${allDecadesPerGenreTotal()} tracks)`
                                                : `${block.decade} ${toTitleCaseFromSlug(row.genreSlug)}`
                                        }
                                    </span>

                                    <span class="history-row__progress">
                                        ✓ {row.played} / {row.total}
                                        • {pct(row.played, row.total)}%
                                        &nbsp;&nbsp;⭐ {row.favorites}
                                    </span>

                                    <div class="history-row__actions">
                                        <button
                                                class="btn btn--primary"
                                                on:click={() => {
                                          if (row.program) resumeProgram(row.program);
                                          else resumeByKey(row.key, 1, row.total);
                                        }}
                                        >
                                            ▶ {row.played > 0 ? 'Resume' : 'Play'}
                                        </button>

                                        <button
                                                class="btn btn--secondary"
                                                on:click={() => goto(`/program?programKey=${encodeURIComponent(row.key)}`)}
                                        >
                                            👁 View
                                        </button>
                                    </div>
                                </li>
                            {/each}
                        </ul>
                    </details>
                {/each}
            {/if}
        </div>
    </details>

    <!-- ───────────── Collections ───────────── -->
    <details class="history-section">
        <summary class="history-section__summary">
            📦 Collections
        </summary>

        <div class="history-section__body">
            {#if collectionPrograms.length === 0}
                <p class="history-empty">No collections played yet.</p>
            {:else}
                <ul class="history-list">
                    {#each collectionGroupMap as group}
                        <details class="history-subsection">
                            <summary class="history-subsection__summary">
                                {group.groupName}
                            </summary>

                            <ul class="history-list">
                                {#each group.programs as row}
                                    {@const collectionSlug = row.key.split('|')[1] ?? ''}

                                    <li class="history-row">
                                <span class="history-row__label">
                                    {collectionNameMap[collectionSlug] ?? row.label}
                                </span>

                                        <span class="history-row__progress">
                        {isCompleted(row)
                            ? 'Completed'
                            : `${playedCount(row)} / ${row.total}`}
                    </span>

                                        <div class="history-row__actions">
                                            <button
                                                    class="btn btn--primary"
                                                    on:click={() => resumeProgram(row)}
                                            >
                                                ▶ {isCompleted(row) ? 'Restart' : 'Resume'}
                                            </button>

                                        </div>
                                    </li>
                                {/each}
                            </ul>
                        </details>
                    {/each}

                </ul>
            {/if}
        </div>
    </details>

    <!-- ───────────── Global Reset ───────────── -->
    <footer class="history-footer">
        <button class="btn btn--danger" on:click={clearAll}>
            🧹 Clear All Playback History
        </button>

    </footer>
</section>

<style>
    .history-panel {
        margin-top: 16px;
        padding: 14px;
        border-radius: 14px;
        border: 1px solid rgba(207, 184, 124, 0.35);
        background: rgba(14, 14, 14, 0.96);
        font-size: 0.85rem;
    }

    .history-header h3 {
        margin: 0;
        font-size: 1rem;
    }

    .history-sub {
        opacity: 0.7;
        margin-top: 2px;
    }

    .history-section {
        margin-top: 10px;
    }

    .history-section__summary,
    .history-subsection__summary {
        cursor: pointer;
        padding: 6px 8px;
        border-radius: 8px;
        font-weight: 600;
    }

    .history-list {
        list-style: none;
        padding: 0;
        margin: 6px 0 0;
    }

    .history-row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
        align-items: center;
        padding: 6px 8px;
        border-radius: 8px;
    }

    .history-row:hover {
        background: rgba(207, 184, 124, 0.08);
    }

    .history-row__label {
        display: flex;
        align-items: center;
        gap: 6px;
    }


    .history-row__progress {
        opacity: 0.8;
        white-space: nowrap;
    }

    .history-row__actions {
        display: flex;
        gap: 6px;
    }

    .history-empty {
        opacity: 0.6;
        padding: 6px;
    }

    .history-footer {
        margin-top: 14px;
        text-align: center;
    }

    .history-subsection {
        margin-top: 6px;
        padding-left: 14px;
        border-left: 2px solid rgba(207, 184, 124, 0.25);
    }

    .history-subsection__summary {
        font-size: 0.95rem;
        letter-spacing: 0.5px;
    }

    .history-row--favorite {
        background: rgba(207, 184, 124, 0.06);
        border: 1px solid rgba(207, 184, 124, 0.25);
    }

    .history-row--disabled {
        opacity: 0.45;
    }

    .history-row--genre {
        padding-left: 14px;
    }

    .history-row__progress {
        opacity: 0.8;
        white-space: nowrap;
        font-variant-numeric: tabular-nums;
    }
</style>
