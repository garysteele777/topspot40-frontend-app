<script lang="ts">
    import {page} from '$app/state';
    import type {ProgramKey} from '$lib/carmode/programHistory';
    import {goto} from '$app/navigation';
    import {loadTrackSequence} from '$lib/helpers/trackSequenceLoader';
    import {onMount} from 'svelte';
    import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';

    import type {PlaybackProgramType} from '$lib/types/program';
    import {
        programHistoryStore,
        resetProgram
    } from '$lib/carmode/programHistory';
    import {
        favoritesStore,
        toggleFavorite
    } from '$lib/favorites/favorites';

    let programType: PlaybackProgramType | null = null;
    let decadeSlug: string | null = null;
    let genreSlug: string | null = null;
    let groupKey: string | null = null;

    let collectionNameMap: Record<string, string> = {};
    let collectionGroupNameMap: Record<string, string> = {};


    let programKey: ProgramKey | null = null;

    $: {
        const key = page.url.searchParams.get('programKey');
        programKey = key as ProgramKey | null;
    }

    $: currentFavorites =
        programType === 'DG' && groupKey
            ? $favoritesStore.DG?.[groupKey] ?? []
            : [];

    // ✅ Match backend shape from /get-sequence
    type TrackRow = {
        rankingId: number;
        rank: number;
        trackName: string;
        artistName: string;
    };

    let tracks: TrackRow[] = [];
    let loading = false;
    let errorMsg: string | null = null;

    onMount(async () => {
        try {
            const normalized = await loadCatalogOnce();

            const groupMap: Record<string, string> = {};
            const nameMap: Record<string, string> = {};

            for (const group of normalized.collectionGroups ?? []) {
                groupMap[group.slug] = group.name;

                for (const item of group.items) {
                    nameMap[item.slug] = item.name;
                }
            }

            collectionGroupNameMap = groupMap;
            collectionNameMap = nameMap;

            console.log('🎨 Program page maps loaded', {
                collectionNameMap,
                collectionGroupNameMap
            });

        } catch (err) {
            console.error('Failed to load catalog:', err);
        }
    });

    function formatSlug(slug: string | null): string {
        if (!slug) return '';

        return slug
            .replace(/_/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
    }

    function handleClearPlayed() {
        if (!programKey) return;

        const label =
            programType === 'COL'
                ? `${displayCollectionName ?? decadeSlug} — ${displayGroupName ?? genreSlug}`
                : `${displayDecadeName ?? decadeSlug} — ${displayGenreName ?? genreSlug}`;

        const confirmed = confirm(`Clear played history for ${label}?`);

        if (!confirmed) return;

        resetProgram(programKey);
    }


    function handleToggleFavorite(rankingId: number) {
        if (programType !== 'DG' || !groupKey) return;

        toggleFavorite('DG', groupKey, rankingId);
    }

    async function loadProgramView() {
        errorMsg = null;
        tracks = [];

        console.log('📦 loadProgramView called');

        if (!programKey) return;

        if (
            (programType !== 'DG' && programType !== 'COL') ||
            !decadeSlug ||
            !genreSlug
        ) return;

        loading = true;
        try {
            const selection =
                programType === 'COL'
                    ? {
                        mode: 'collection',
                        language: 'en',
                        startRank: 1,
                        endRank: 40,
                        context: {
                            collection: decadeSlug!,
                            group: genreSlug!
                        }
                    }
                    : {
                        mode: 'decade_genre',
                        language: 'en',
                        startRank: 1,
                        endRank: 40,
                        context: {
                            decade: decadeSlug!,
                            genre: genreSlug!
                        }
                    };

            const loaded = await loadTrackSequence(selection as any);

            tracks = loaded.map(t => ({
                rankingId: t.rankingId ?? 0,
                rank: t.rank ?? 0,
                trackName: t.trackName ?? '',
                artistName: t.artistName ?? ''
            }));
        } catch (err) {
            errorMsg = err instanceof Error ? err.message : 'Failed to load tracks';
        } finally {
            loading = false;
        }
    }

    $: if (programKey) {
        const parts = (programKey as string).split('|');
        programType = parts[0] as PlaybackProgramType;

        if (programType === 'DG') {
            decadeSlug = parts[1] ?? null;
            genreSlug = parts[2] ?? null;

            groupKey =
                decadeSlug && genreSlug
                    ? `${decadeSlug}|${genreSlug}`
                    : null;

        } else if (programType === 'COL') {
            const collectionSlug = parts[1] ?? null;
            const group = parts[2] ?? null;

            decadeSlug = collectionSlug;
            genreSlug = group;

            groupKey = collectionSlug;

        } else {
            decadeSlug = null;
            genreSlug = null;
            groupKey = null;
        }

    } else {
        programType = null;
        decadeSlug = null;
        genreSlug = null;
        groupKey = null;
    }

    let lastLoadedKey: string | null = null;

    $: if (programKey && programType && programKey !== lastLoadedKey) {
        console.log('🚀 LOADING PROGRAM VIEW:', programKey);
        lastLoadedKey = programKey;
        loadProgramView();
    }

    $: displayDecadeName =
        programType === 'DG'
            ? formatSlug(decadeSlug)
            : null;

    $: displayGenreName =
        programType === 'DG'
            ? formatSlug(genreSlug)
            : null;


    $: displayCollectionName =
        programType === 'COL' && decadeSlug
            ? collectionNameMap?.[decadeSlug] ?? decadeSlug
            : null;

    $: displayGroupName =
        programType === 'COL' && genreSlug
            ? collectionGroupNameMap?.[genreSlug] ?? genreSlug
            : null;

    function isPlayed(rank: number): boolean {
        const program = $programHistoryStore.find(p => p.key === programKey);
        if (!program) return false;
        return program.playedRanks.includes(rank);
    }

</script>

<section class="program-view">
    {#if !programKey}
        <h2>Program View</h2>
        <p>No program selected.</p>

    {:else if programType === 'FAV_DG' || programType === 'FAV_COL'}
        <h2>Program View</h2>
        <p>Program View is not available for Favorites programs.</p>

    {:else if programType !== 'DG' && programType !== 'COL'}
        <h2>Program View</h2>
        <p>Program View is only implemented for Decade/Genre and Collections right now.</p>

    {:else}
        <h2>
            {#if programType === 'COL'}
                {displayCollectionName} — {displayGroupName}
            {:else}
                {displayDecadeName} — {displayGenreName}
            {/if}
        </h2>

        <div class="program-actions">
            <button type="button" on:click={() => goto('/options-v2')}>
                ← Back to Options
            </button>
            <button type="button" on:click={handleClearPlayed}>
                Clear Played
            </button>

            <span class="hint">
                Tip: Click the Fav column to add/remove favorites.
  </span>
        </div>

        {#if errorMsg}
            <p class="error">{errorMsg}</p>
        {/if}

        {#if loading}
            <p>Loading tracks…</p>

        {:else if tracks.length === 0}
            <p>No tracks found.</p>

        {:else}
            <table>
                <thead>
                <tr>
                    <th class="col--tight">Played</th>
                    <th class="col--tight">Fav</th>
                    <th class="col--tight">Rank</th>
                    <th>Title</th>
                    <th>Artist</th>
                </tr>
                </thead>
                <tbody>
                {#each tracks as track}
                    <tr>
                        <td>
                            {#if isPlayed(track.rank)}
                                ✔
                            {/if}
                        </td>

                        <td class="col--tight">
                            <button
                                    class="fav-btn"
                                    on:click={() => handleToggleFavorite(track.rankingId)}
                            >
                                {#if currentFavorites.includes(track.rankingId)}
                                    ⭐
                                {:else}
                                    ☆
                                {/if}
                            </button>
                        </td>

                        <td>{track.rank}</td>
                        <td>{track.trackName}</td>
                        <td>{track.artistName}</td>
                    </tr>
                {/each}
                </tbody>
            </table>
        {/if}
    {/if}
</section>

<style>
    .program-view {
        padding: 24px;
    }

    .error {
        color: #c33;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;

        /* ✅ makes fixed-width columns actually behave */
        table-layout: fixed;
    }

    th, td {
        padding: 8px;
        border-bottom: 1px solid #333;
        text-align: left;
    }

    /* ✅ Played / Fav / Rank: narrow + equal */
    th.col--tight,
    td.col--tight {
        width: 56px; /* try 48px if you want it tighter */
        text-align: center;
        white-space: nowrap;
        padding-left: 0;
        padding-right: 0;
    }

    .program-actions {
        margin: 12px 0;
    }

    .program-actions button {
        padding: 6px 12px;
        cursor: pointer;
    }

    .fav-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
    }

    .fav-btn:hover {
        transform: scale(1.15);
    }

</style>