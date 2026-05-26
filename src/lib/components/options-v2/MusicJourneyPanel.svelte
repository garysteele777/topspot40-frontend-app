<script lang="ts">
    import {
        programHistoryStore,
        resetProgram,
        resetAllPrograms
    } from '$lib/carmode/programHistory';

    type HistoryEntry = {
        key: string;
        total: number;
        playedRanks: number[];
        collectionGroup?: string;
        collectionGroupSlug?: string;
    };

    export let collapsed = false;
    export let onActivate: (() => void) | undefined = undefined;

    export let collectionGroups: {
        name: string;
        slug: string;
        items: { name: string; slug: string }[];
    }[] = [];

    let selectedJourneyCollectionGroup: string | null = null;

    let musicJourneyMode:
        | 'nostalgia'
        | 'collections'
        | 'favorites'
        | null = null;

    let selectedJourneyDecade: string | null = null;

    $: nostalgiaHistorySummary =
        buildNostalgiaHistorySummary($programHistoryStore);

    $: selectedJourneyGenres =
        selectedJourneyDecade
            ? buildGenreHistoryForDecade($programHistoryStore, selectedJourneyDecade)
            : [];

    $: collectionGroupHistorySummary =
        buildCollectionGroupHistorySummary($programHistoryStore, collectionGroups);

    $: selectedJourneyCollections =
        selectedJourneyCollectionGroup
            ? buildCollectionHistoryForGroup(
                $programHistoryStore,
                collectionGroups,
                selectedJourneyCollectionGroup
            )
            : [];

    function buildCollectionGroupHistorySummary(
        history: HistoryEntry[],
        groups: { name: string; slug: string; items: { name: string; slug: string }[] }[]
    ) {
        return groups.map((group) => {
            const rows = group.items.map((item) => {
                const entry = history.find(
                    (h) =>
                        h.key.startsWith(`COL|${item.slug}|`) ||
                        h.collectionGroupSlug === group.slug
                );

                return {
                    total: entry?.total ?? 0,
                    played: entry?.playedRanks.length ?? 0
                };
            });

            const tracks = rows.reduce((sum, row) => sum + row.total, 0);
            const played = rows.reduce((sum, row) => sum + row.played, 0);
            const percent = tracks > 0 ? Math.round((played / tracks) * 100) : 0;

            return {
                name: group.name,
                slug: group.slug,
                tracks,
                played,
                percent
            };
        });
    }

    function buildCollectionHistoryForGroup(
        history: HistoryEntry[],
        groups: { name: string; slug: string; items: { name: string; slug: string }[] }[],
        groupSlug: string
    ) {
        const group = groups.find((g) => g.slug === groupSlug);

        if (!group) return [];

        return group.items.map((item) => {
            const entry = history.find(
                (h) => h.key === `COL|${item.slug}|${groupSlug}`
            );
            const tracks = entry?.total ?? 0;
            const played = entry?.playedRanks.length ?? 0;
            const percent = tracks > 0 ? Math.round((played / tracks) * 100) : 0;

            return {
                name: item.name,
                slug: item.slug,
                tracks,
                played,
                percent
            };
        });
    }


    function buildNostalgiaHistorySummary(history: HistoryEntry[]) {
        const decades = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];

        return decades.map((decade) => {
            const rows = history.filter((entry) =>
                entry.key.startsWith(`DG|${decade}|`)
            );

            const tracks = rows.reduce((sum, entry) => sum + entry.total, 0);
            const played = rows.reduce((sum, entry) => sum + entry.playedRanks.length, 0);
            const percent = tracks > 0 ? Math.round((played / tracks) * 100) : 0;

            return {
                decade: `${decade} All Genres`,
                tracks,
                percent
            };
        });
    }

    function clearJourneyCollectionGroupPlayed(groupName: string, groupSlug: string) {
        const confirmed = confirm(
            `Clear ALL played history for ${groupName}?`
        );

        if (!confirmed) return;

        const rows = $programHistoryStore.filter((entry) =>
            entry.key.endsWith(`|${groupSlug}`) ||
            entry.collectionGroupSlug === groupSlug
        );

        rows.forEach((entry) => {
            resetProgram(entry.key);
        });
    }

    function buildGenreHistoryForDecade(history: HistoryEntry[], decade: string) {
        return history
            .filter((entry) => entry.key.startsWith(`DG|${decade}|`))
            .map((entry) => {
                const parts = entry.key.split('|');
                const genre = parts[2] ?? 'unknown';
                const played = entry.playedRanks.length;
                const percent = entry.total > 0
                    ? Math.round((played / entry.total) * 100)
                    : 0;

                return {
                    genre,
                    label: `${decade} ${genre.replace(/_/g, ' ')}`,
                    tracks: entry.total,
                    played,
                    percent
                };
            });
    }

    function clearJourneyGenrePlayed(decade: string, genre: string) {
        const programKey = `DG|${decade}|${genre}` as const;

        resetProgram(programKey);
    }


    function clearJourneyDecadePlayed(decade: string) {
        const confirmed = confirm(
            `Clear ALL played history for ${decade}? This will reset every genre in that decade.`
        );

        if (!confirmed) return;

        const rows = $programHistoryStore.filter((entry) =>
            entry.key.startsWith(`DG|${decade}|`)
        );

        rows.forEach((entry) => {
            resetProgram(entry.key);
        });
    }

    function clearJourneyAllPlayed() {
        const confirmed = confirm(
            'Clear ALL playback history for every decade, genre, collection, and program?'
        );

        if (!confirmed) return;

        resetAllPrograms();
    }

    function clearJourneyCollectionPlayed(collectionName: string, collectionSlug: string) {
        const confirmed = confirm(
            `Clear played history for ${collectionName}?`
        );

        if (!confirmed) return;

        const rows = $programHistoryStore.filter((entry) =>
            entry.key.startsWith(`COL|${collectionSlug}|`)
        );

        rows.forEach((entry) => {
            resetProgram(entry.key);
        });
    }
</script>

<div class="opt-cell music-journey-card">
    <div
            class="section-header-row section-header-clickable"
            role="button"
            tabindex="0"
            on:click={() => {
                onActivate?.();
            }}
            on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActivate?.();
                }
            }}
    >
        <h3 class="section-title">🎵 My TopSpot40 Music Journey</h3>
        <span class="section-toggle">{collapsed ? '▼' : '▲'}</span>
    </div>

    <div class="radio-description">
        Track your music journey and favorite discoveries.
    </div>

    {#if !collapsed}
        <div class="radio-buttons">
            <button
                    type="button"
                    class:active={musicJourneyMode === 'nostalgia'}
                    on:click={() => {
                musicJourneyMode = 'nostalgia';
            }}
            >
                Nostalgia History
            </button>

            <button
                    type="button"
                    class:active={musicJourneyMode === 'collections'}
                    on:click={() => {
                musicJourneyMode = 'collections';
            }}
            >
                Collections History
            </button>

            <button
                    type="button"
                    class:active={musicJourneyMode === 'favorites'}
                    on:click={() => {
                musicJourneyMode = 'favorites';
            }}
            >
                Favorite Tracks (incomplete)
            </button>
        </div>
    {/if}
</div>

{#if !collapsed && musicJourneyMode === 'nostalgia'}
    <div class="journey-panel">
        <div class="genre-title">
            Nostalgia Listening History
        </div>

        <div class="radio-description" style="margin-bottom: 12px;">
            Click on a decade to expand genre listening history.
        </div>

        <div class="journey-decade-grid">
            {#each nostalgiaHistorySummary as item}
                <div
                        class="journey-decade-btn"
                        class:selected={
                        selectedJourneyDecade === item.decade.replace(' All Genres', '')
                    }
                        role="button"
                        tabindex="0"
                        on:click={() => {
                        selectedJourneyDecade =
                            item.decade.replace(' All Genres', '');
                    }}
                        on:keydown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();

                            selectedJourneyDecade =
                                item.decade.replace(' All Genres', '');
                        }
                    }}
                >
                    <div class="journey-decade-title">
                        {item.decade}
                    </div>

                    <div class="journey-decade-meta">
                        {item.tracks} tracks • {item.percent}% complete
                    </div>

                    <div class="journey-progress-bar">
                        <div
                                class="journey-progress-fill"
                                style={`width: ${item.percent}%`}
                        ></div>
                    </div>

                    <div class="journey-actions">
                        <button
                                class="journey-clear-btn journey-clear-btn--decade"
                                type="button"
                                on:click|stopPropagation={() => {
                                    clearJourneyDecadePlayed(
                                        item.decade.replace(' All Genres', '')
                                    );
                                }}
                        >
                            Clear Decade History
                        </button>
                    </div>


                </div>
            {/each}
        </div>

        {#if selectedJourneyDecade}
            <div class="genre-title" style="margin-top: 14px;">
                {selectedJourneyDecade} Genre History
            </div>

            <div class="journey-decade-grid">
                {#each selectedJourneyGenres as item}
                    <div class="journey-decade-btn">
                        <div class="journey-decade-title">
                            {item.label}
                        </div>

                        <div class="journey-decade-meta">
                            {item.played} / {item.tracks}
                            tracks • {item.percent}% complete
                        </div>

                        <div class="journey-progress-bar">
                            <div
                                    class="journey-progress-fill"
                                    style={`width: ${item.percent}%`}
                            ></div>
                        </div>


                        <div class="journey-actions">
                            <button
                                    class="journey-clear-btn"
                                    type="button"
                                    on:click|stopPropagation={() => {
                                    const confirmed = confirm(
                                        `Clear played history for ${selectedJourneyDecade ?? ''} ${item.genre}?`
                                    );

                                    if (!confirmed) return;

                                    clearJourneyGenrePlayed(selectedJourneyDecade ?? '', item.genre);
                                }}
                            >
                                Clear Played Tracks
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

{#if !collapsed && musicJourneyMode === 'collections'}
    <div class="journey-panel">
        <div class="genre-title">
            Collections Listening History
        </div>

        <div class="radio-description" style="margin-bottom: 12px;">
            Click on a collection group to expand collection listening history.
        </div>

        <div class="journey-decade-grid">
            {#each collectionGroupHistorySummary as item}
                <div
                        class="journey-decade-btn"
                        class:selected={selectedJourneyCollectionGroup === item.slug}
                        role="button"
                        tabindex="0"
                        on:click={() => {
                            selectedJourneyCollectionGroup = item.slug;
                        }}
                        on:keydown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                selectedJourneyCollectionGroup = item.slug;
                            }
                        }}
                >
                    <div class="journey-decade-title">
                        {item.name}
                    </div>

                    <div class="journey-decade-meta">
                        {item.played} / {item.tracks}
                        tracks • {item.percent}% complete
                    </div>

                    <div class="journey-progress-bar">
                        <div
                                class="journey-progress-fill"
                                style={`width: ${item.percent}%`}
                        ></div>
                    </div>

                    <div class="journey-actions">
                        <button
                                class="journey-clear-btn journey-clear-btn--decade"
                                type="button"
                                on:click|stopPropagation={() => {
                                    clearJourneyCollectionGroupPlayed(item.name, item.slug);
                                }}
                        >
                            Clear Group History
                        </button>
                    </div>

                </div>
            {/each}
        </div>

        {#if selectedJourneyCollectionGroup}
            <div class="genre-title" style="margin-top: 14px;">
                Collection History
            </div>

            <div class="journey-decade-grid">
                {#each selectedJourneyCollections as item}
                    <div class="journey-decade-btn">
                        <div class="journey-decade-title">
                            {item.name}
                        </div>

                        <div class="journey-decade-meta">
                            {item.played} / {item.tracks}
                            tracks • {item.percent}% complete
                        </div>

                        <div class="journey-progress-bar">
                            <div
                                    class="journey-progress-fill"
                                    style={`width: ${item.percent}%`}
                            ></div>
                        </div>

                        <div class="journey-actions">
                            <button
                                    class="journey-clear-btn"
                                    type="button"
                                    on:click|stopPropagation={() => {
                                        clearJourneyCollectionPlayed(item.name, item.slug);
                                    }}
                            >
                                Clear Played Tracks
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
{/if}

<style>
    .journey-decade-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
    }

    .journey-decade-btn {
        border-radius: 12px;
        border: 1px solid #444;
        background: #252525;
        color: #ddd;
        padding: 10px 12px;
        cursor: pointer;
        text-align: left;
    }

    .journey-decade-title {
        font-weight: 700;
        color: #fff;
    }

    .journey-decade-meta {
        margin-top: 4px;
        font-size: 0.75rem;
        color: #aaa;
    }

    .journey-progress-bar {
        margin-top: 8px;
        height: 6px;
        border-radius: 999px;
        background: #111;
        overflow: hidden;
    }

    .journey-progress-fill {
        height: 100%;
        background: #cfb87c;
    }

    .journey-decade-btn.selected {
        border: 2px solid #d4b66a;
        background: rgba(212, 182, 106, 0.12);
        box-shadow: 0 0 10px rgba(212, 182, 106, 0.25);
    }

    .journey-actions {
        margin-top: 10px;
        display: flex;
        justify-content: flex-end;
    }

    .journey-clear-btn {
        background: rgba(212, 182, 106, 0.12);
        border: 1px solid #d4b66a;
        color: #f0e2b6;
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 0.82rem;
        cursor: pointer;
    }

    .journey-clear-btn:hover {
        background: rgba(212, 182, 106, 0.22);
    }

    .opt-cell {
        background: rgba(18, 18, 18, 0.95);
        border-radius: 14px;
        padding: 0.9rem 1rem;
        border: 1px solid rgba(207, 184, 124, 0.35);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
        transition: transform 0.18s ease-out, box-shadow 0.18s ease-out, border-color 0.18s ease-out, background-color 0.18s ease-out;
    }

    .section-title {
        font-size: 0.78rem;
        color: #cfb87c;
        margin: 0 0 0.45rem 0;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
    }


    /* RADIO DESCRIPTION */
    .radio-description {
        font-size: 0.8rem;
        color: #aaa;
        margin-bottom: 0.5rem;
        line-height: 1.3;
    }

    /* RADIO BUTTONS */
    .radio-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
    }

    .radio-buttons button {
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #444;
        background: #2a2a2a;
        color: #ccc;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    /* ACTIVE STATE (matches your gold theme) */
    .radio-buttons button.active {
        background: #cfb87c;
        color: #000;
        border-color: #cfb87c;
        font-weight: 600;
    }

    .section-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }

    .section-title {
        margin: 0;
    }

    .section-toggle {
        color: #cfb87c;
        font-size: 1.35rem;
        font-weight: 800;
        line-height: 1;
        opacity: 0.95;
    }

    .section-header-clickable {
        cursor: pointer;
    }

</style>
