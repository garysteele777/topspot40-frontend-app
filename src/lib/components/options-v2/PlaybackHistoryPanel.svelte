<script lang="ts">

    import {get} from 'svelte/store';
    import {playbackSettingsStore} from '$lib/stores/playbackSettings.store';
    import {launchWithPlayback, buildLaunchUrl} from '$lib/utils/buildLaunchUrl';
    import ProgramRow from './ProgramRow.svelte';
    import {
        countFavorites,
        clearFavorites,
    } from '$lib/favorites/favorites';

    import {
        programHistoryStore as programHistory,
        resetAllPrograms,
        type ProgramHistory
    } from '$lib/carmode/programHistory';

    import {onMount} from 'svelte';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
    import {goto} from '$app/navigation';
    import {currentSelection} from '$lib/carmode/CarMode.store';
    import {favoritesStore} from '$lib/favorites/favorites';

    let catalogDecades: string[] = [];
    let catalogGenres: string[] = [];

    let collectionGroupNameMap: Record<string, string> = {};
    let collectionNameMap: Record<string, string> = {};
    let collectionSlugToGroupSlug: Record<string, string> = {};

    // function parseProgramKey(key: string) {
    //     const parts = key.split('|');
    //
    //     if (parts[0] === 'DG') {
    //         return {
    //             type: 'decade_genre' as const,
    //             decade: parts[1],
    //             genre: parts[2]
    //         };
    //     }
    //
    //     if (parts[0] === 'COL') {
    //         return {
    //             type: 'collection' as const,
    //             collection: parts[1],
    //             collectionCategory: parts[2]
    //         };
    //     }
    //
    //     return null;
    // }


    const genreIconMap: Record<string, string> = {
        blues_jazz: '. . . 🎷',
        country: '. . . 🤠',
        folk_acoustic: '. . . 🪕',
        latin_global: '. . . 💃',
        pop: '. . . 🎤',
        rnb_soul: '. . . 🎹',
        rock: '. . . 🎸',
        tv_themes: '. . . 📺'
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

    // function getAllDecadeFavorites(): number[] {
    //     const all: number[] = [];
    //
    //     for (const decade of catalogDecades) {
    //         for (const genre of catalogGenres) {
    //             const ids = getFavorites('DG', `${decade}|${genre}`);
    //             all.push(...ids);
    //         }
    //     }
    //
    //     return [...new Set(all)];
    // }

    // function getGenreFavorites(decade: string, genre: string): number[] {
    //     return getFavorites('DG', `${decade}|${genre}`);
    // }

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


    type PlaybackOrder = 'up' | 'down' | 'shuffle';

    async function playShuffleFavorites(group: string) {

        const [decade, genre] = group.includes('|')
            ? group.split('|')
            : [group, 'ALL'];

        console.log('▶ Shuffle Favorites for', group);

        currentSelection.update((s) => ({
            ...s,

            mode: 'decade_genre',
            programType: 'FAV_DG',

            context: {
                ...(s.context ?? {}),
                favoritesType: 'DG',
                favoritesGroup: group,
                decade,
                genre
            },

            playbackOrder: 'shuffle'
        }));

        const s = get(currentSelection);

        const url = await launchWithPlayback({
            layoutMode: 'car',
            programType: s.programType,
            language: s.language,
            playbackOrder: s.playbackOrder,
            skipPlayed: s.skipPlayed,
            pauseMode: s.pauseMode,
            voicePlayMode: 'before',
            voices: s.voices,

            decade,
            genre,
            favoritesGroup: group
        });

        if (url) goto(url);
    }

    // function playShuffleAllDecadeFavorites() {
    //     console.log('▶ Shuffle ALL Decade Favorites');
    //
    //     currentSelection.update((s) => ({
    //         ...s,
    //
    //         mode: 'decade_genre',       // keep consistent with header
    //         programType: 'FAV_DG',
    //
    //         decade: 'ALL',              // 🔥 THIS is the key
    //         genre: 'favorites',         // 🔥 force favorites label
    //
    //         context: {
    //             favoritesType: 'DG',
    //             favoritesGroup: 'ALL'
    //         },
    //
    //         playbackOrder: 'shuffle'
    //     }));
    //
    //     const s = get(currentSelection);
    //
    //     const url = buildLaunchUrl({
    //         layoutMode: 'car',
    //         programType: s.programType,
    //         language: s.language,
    //         voices: s.voices,
    //         playbackOrder: 'shuffle',
    //         voicePlayMode: 'before',
    //         pauseMode: s.pauseMode,
    //         skipPlayed: s.skipPlayed,
    //         decade: 'ALL',
    //         genre: 'ALL'
    //     });
    //
    //     goto(url);
    // }


    function clearDecadeFavorites(decade: string) {
        for (const genre of catalogGenres) {
            clearFavorites('DG', `${decade}|${genre}`);
        }
    }

    // function totalPlayedAcrossAll(): number {
    //     return Object.values(playedCountByProgram)
    //         .reduce((sum, n) => sum + n, 0);
    // }

    onMount(async () => {
        try {
            const normalized = await loadCatalogOnce();

            catalogDecades = normalized.decades.map(d => d.id);
            catalogGenres = normalized.genres.map(g => g.id);

            const groupMap: Record<string, string> = {};
            const nameMap: Record<string, string> = {};
            const slugToGroup: Record<string, string> = {};

            for (const group of normalized.collectionGroups ?? []) {
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

    $: decadeFavoriteCounts = (() => {
        const data = $favoritesStore.DG;
        const result: Record<string, number> = {};

        for (const key in data) {

            // ignore invalid keys like "1950s"
            if (!key.includes('|')) continue;

            const [decade] = key.split('|');

            if (!result[decade]) {
                result[decade] = 0;
            }

            result[decade] += data[key].length;
        }

        return result;
    })();

    $: playedCountByProgram = (() => {
        const result: Record<string, number> = {};

        for (const p of $programHistory) {
            result[p.key] = p.playedRanks.length;
        }

        return result;
    })();


    $: decadeGenreMap = (() => {
        const sortedDecades = [...catalogDecades]
            .sort((a, b) => decadeSortKey(a) - decadeSortKey(b));

        const buildBlock = (decade: string) => {

            // ───────────── ALL synthetic block ─────────────
            if (decade === 'ALL') {

                const totalPlayedAll = Object.entries(playedCountByProgram)
                    .filter(([key]) => key.startsWith('DG|'))
                    .reduce((sum, [, count]) => sum + count, 0);

                const superAllRow = {
                    decade: 'ALL',
                    genreSlug: 'all_genres',
                    key: 'DG|ALL|ALL',
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

                    const totalPlayed = Object.entries(playedCountByProgram)
                        .filter(([key]) => key.endsWith(`|${genre}`))
                        .reduce((sum, [, count]) => sum + count, 0);

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
        (p): p is ProgramHistory =>
            p.key.startsWith('COL|') &&   // ✅ ONLY pipe format
            p.key.split('|').length === 3
    );

    $: collectionGroupMap = (() => {
        const map = new Map<string, ProgramHistory[]>();

        for (const p of collectionPrograms) {
            let parts: string[];

            if (p.key.includes('|')) {
                parts = p.key.split('|');
            } else {
                parts = p.key.split('/');
            }

            const [, collectionSlug, rawGroupSlug] = parts;

            const groupSlug = rawGroupSlug
                ?.toLowerCase()
                .replace(/-/g, '_');

            if (!collectionSlug || !groupSlug) continue;

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

    // function isCompleted(p: ProgramHistory): boolean {
    //     return p.playedRanks.length >= p.total;
    // }

    function determineStartRank(p: ProgramHistory): number {

        const settings = get(playbackSettingsStore);

        // Skip OFF → always start from beginning
        if (!settings.skipPlayed) {
            return settings.playbackOrder === 'down'
                ? p.total
                : 1;
        }

        // Skip ON
        if (settings.playbackOrder === 'up') {

            for (let i = 1; i <= p.total; i++) {
                if (!p.playedRanks.includes(i)) return i;
            }

        }

        if (settings.playbackOrder === 'down') {

            for (let i = p.total; i >= 1; i--) {
                if (!p.playedRanks.includes(i)) return i;
            }

        }

        if (settings.playbackOrder === 'shuffle') {

            const unplayed: number[] = [];

            for (let i = 1; i <= p.total; i++) {
                if (!p.playedRanks.includes(i)) unplayed.push(i);
            }

            return unplayed[Math.floor(Math.random() * unplayed.length)] ?? 1;
        }

        return 1;
    }


    // function clearOne(p: ProgramHistory) {
    //     resetProgram(p.key);
    // }

    function clearAll() {
        resetAllPrograms();
    }

    function resumeProgram(p: ProgramHistory) {

        if (!p) return;

        const settings = get(playbackSettingsStore);

        const startRank = determineStartRank(p);

        console.log("START RANK CALCULATED:", startRank);
        console.log("SKIP PLAYED:", settings.skipPlayed);
        console.log("PLAYED RANKS:", p.playedRanks);

        resumeByKey(p.key, startRank, p.total);
    }

    function resumeByKeyShuffle(programKey: string, startRank = 1, total = 40) {
        resumeByKey(programKey, startRank, total, {forceShuffle: true});
    }

    function resumeByKey(
        programKey: string,
        startRank = 1,
        total = 40,
        opts?: { forceShuffle?: boolean }
    ) {
        const parts = programKey.split('|');
        const type = parts[0];
        const settings = get(playbackSettingsStore);

        const launchOrder: PlaybackOrder = opts?.forceShuffle ? 'shuffle' : settings.playbackOrder;

        let url: string;

        console.log("PLAYBACK SETTINGS AT LAUNCH:", settings);

        if (type === 'DG') {
            const decade = parts[1];
            const genre = parts[2];

            if (!decade || !genre) {
                console.error('Invalid DG key:', programKey);
                return;
            }

            const selection = get(currentSelection);
            const settings = get(playbackSettingsStore);

            url = buildLaunchUrl({
                layoutMode: 'car',
                decade,
                genre,
                language: selection.language,
                voices: settings.voices,
                playbackOrder: launchOrder,
                voicePlayMode: settings.voicePlayMode,
                pauseMode: settings.pauseMode,
                skipPlayed: settings.skipPlayed
            });

            console.log("🚀 Launch URL:", url);

        } else if (type === 'COL') {
            const collection = parts[1];
            const collectionCategory = parts[2];

            if (!collection || !collectionCategory) {
                console.error('Invalid COL key:', programKey);
                return;
            }
            const selection = get(currentSelection);
            const settings = get(playbackSettingsStore);

            url = buildLaunchUrl({
                layoutMode: 'car',
                collection,
                collectionCategory,
                language: selection.language,
                voices: settings.voices,
                playbackOrder: launchOrder,
                voicePlayMode: settings.voicePlayMode,
                pauseMode: settings.pauseMode,
                skipPlayed: settings.skipPlayed
            });

        } else {
            console.error('Unknown program type:', programKey);
            return;
        }

        // append resume rank
        const finalUrl = `${url}&startRank=${startRank}&endRank=${total}`;

        console.log("🚀 Final URL:", finalUrl);

        goto(finalUrl);
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
    <details class="history-section">
        <summary class="history-section__summary">
            🎵 Decade–Genre Programs
        </summary>

        <div class="history-section__body">
            {#if catalogDecades.length === 0 || catalogGenres.length === 0}
                <p class="history-empty">Loading decades and genres…</p>
            {:else}

                {#each decadeGenreMap as block}
                    {@const favCount =
                        block.decade === 'ALL'
                            ? Object.values(decadeFavoriteCounts).reduce((a, b) => a + b, 0)
                            : decadeFavoriteCounts[block.decade] ?? 0
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
                                            on:click={() => clearDecadeFavorites(block.decade)}
                                    >
                                        🧹
                                    </button>
                                </div>
                            </li>

                            {#if block.decade !== 'ALL'}
                                {#each catalogGenres as genre}
                                    {@const genreFavCount = countFavorites('DG', `${block.decade}|${genre}`)}

                                    {#if genreFavCount > 0}
                                        <li class="history-row history-row--favorite">
                <span class="history-row__label">
                    ⭐ {block.decade} {toTitleCaseFromSlug(genre)} Favorites
                </span>

                                            <span class="history-row__progress">
                    {genreFavCount} Tracks
                </span>

                                            <div class="history-row__actions">
                                                <button
                                                        class="btn btn--primary"
                                                        on:click={() => playShuffleFavorites(`${block.decade}|${genre}`)}
                                                >
                                                    ▶ Play Shuffle
                                                </button>
                                            </div>
                                        </li>
                                    {/if}
                                {/each}
                            {/if}


                            {#each block.genres as row}
                                <li class="history-row history-row--genre">

                                    {#if block.decade === 'ALL'}

                                        <!-- ALL ROWS (custom UI stays) -->

                                        <span class="history-row__label">
                {row.genreSlug === 'all_genres'
                    ? '🎶'
                    : getGenreIcon(row.genreSlug)
                }

                                            {row.genreSlug === 'all_genres'
                                                ? `All Decades, All Genres (${allDecadesAllGenresTotal()} tracks)`
                                                : `All ${toTitleCaseFromSlug(row.genreSlug)} (${allDecadesPerGenreTotal()} tracks)`
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
                                                    on:click={() => resumeByKeyShuffle(row.key, 1, row.total)}
                                            >
                                                🔀 Shuffle Play
                                            </button>
                                        </div>

                                    {:else}

                                        <!-- NORMAL DG ROWS -->

                                        <ProgramRow
                                                row={row.program ?? null}
                                                label={`${getGenreIcon(row.genreSlug)} ${block.decade} ${toTitleCaseFromSlug(row.genreSlug)}`}
                                                played={row.played}
                                                total={row.total}
                                                percent={pct(row.played, row.total)}
                                                favorites={row.favorites}
                                                onPlay={() => {
                                        if (row.program) resumeProgram(row.program);
                                        else resumeByKey(row.key, 1, row.total);
                                    }}
                                        />

                                    {/if}

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
                                    {@const played = playedCount(row)}
                                    {@const total = row.total}
                                    {@const percent = pct(played, total)}

                                    <li class="history-row history-row--genre">
                                        <ProgramRow
                                                {row}
                                                label={collectionNameMap[collectionSlug] ?? row.label}
                                                played={played}
                                                total={total}
                                                percent={percent}
                                                onPlay={() => resumeProgram(row)}
                                        />
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
