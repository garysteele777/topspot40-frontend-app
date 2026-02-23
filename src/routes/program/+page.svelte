<script lang="ts">
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import type {ProgramKey} from '$lib/carmode/programHistory';

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


    let programKey: ProgramKey | null = null;

    $: {
        const key = page.url.searchParams.get('programKey');
        programKey = key as ProgramKey | null;
    }

    $: if (programKey) loadProgramView();

    $: currentFavorites =
        programType === 'DG' && groupKey
            ? $favoritesStore.DG?.[groupKey] ?? []
            : [];

    $: currentHistory =
        programKey
            ? $programHistoryStore.find(p => p.key === programKey)
            : undefined;


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

    $: groupKey =
        programType === 'DG' && decadeSlug
            ? decadeSlug
            : null;

    function handleClearPlayed() {
        if (!programKey) return;

        const confirmed = confirm(
            `Clear played history for ${decadeSlug} — ${genreSlug}?`
        );

        if (!confirmed) return;

        resetProgram(programKey);
    }


    function handleToggleFavorite(rankingId: number) {
        if (programType !== 'DG' || !groupKey) return;

        toggleFavorite('DG', groupKey, rankingId);
    }

    async function fetchDGTracks(decade: string, genre: string): Promise<TrackRow[]> {
        const base = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

        const url =
            `${base}/supabase/decade-genre/get-sequence` +
            `?decade=${encodeURIComponent(decade)}` +
            `&genre=${encodeURIComponent(genre)}` +
            `&start_rank=1&end_rank=40`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`DG list failed: ${res.status}`);

        const data = await res.json() as {
            status: string;
            total: number;
            tracks: TrackRow[];
        };

        return data.tracks ?? [];
    }

    async function loadProgramView() {
        errorMsg = null;
        tracks = [];

        if (!programKey) return;

        if (programType !== 'DG' || !decadeSlug || !genreSlug) return;

        loading = true;
        try {
            tracks = await fetchDGTracks(decadeSlug, genreSlug);
        } catch (err) {
            errorMsg = err instanceof Error ? err.message : 'Failed to load tracks';
        } finally {
            loading = false;
        }
    }

    onMount(loadProgramView);

    $: if (programKey) {
        const parts = programKey.split('|');
        programType = parts[0] as PlaybackProgramType;

        if (programType === 'DG') {
            decadeSlug = parts[1] ?? null;
            genreSlug = parts[2] ?? null;
            groupKey = decadeSlug;
        } else {
            decadeSlug = null;
            genreSlug = null;
            groupKey = null;
        }

        loadProgramView();
    }

    function getHistoryForKey(key: string | null) {
        if (!key) return undefined;
        return $programHistoryStore.find(p => p.key === key);
    }

    function isPlayed(rank: number): boolean {
        return currentHistory?.playedRanks.includes(rank) ?? false;
    }
</script>

<section class="program-view">
    {#if !programKey}
        <h2>Program View</h2>
        <p>No program selected.</p>

    {:else if programType === 'FAV_DG' || programType === 'FAV_COL'}
        <h2>Program View</h2>
        <p>Program View is not available for Favorites programs.</p>

    {:else if programType !== 'DG'}
        <h2>Program View</h2>
        <p>Program View is only implemented for Decade/Genre (DG) right now.</p>

    {:else}
        <h2>
            {decadeSlug} — {genreSlug}
        </h2>

        <div class="program-actions">
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
                                {#if groupKey && $favoritesStore.DG?.[groupKey]?.includes(track.rankingId)}
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