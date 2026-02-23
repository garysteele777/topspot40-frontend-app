<script lang="ts">
    import {page} from '$app/state';
    import {onMount} from 'svelte';

    import type {PlaybackProgramType} from '$lib/types/program';
    import {programHistoryStore} from '$lib/carmode/programHistory';
    import {favoritesStore} from '$lib/favorites/favorites';

    $: favorites = $favoritesStore;

    // ✅ TEMP DEBUG (remove after)
    $: if (programKey) {
        console.log('programKey:', programKey);
        console.log('favorites snapshot:', favorites);
    }

    $: programKey = page.url.searchParams.get('programKey');

    $: if (programKey) {
        const parts = programKey.split('|');
        programType = parts[0] as PlaybackProgramType;

        if (programType === 'DG') {
            decadeSlug = parts[1] ?? null;
            genreSlug = parts[2] ?? null;
        } else {
            decadeSlug = null;
            genreSlug = null;
        }
    }

    let programType: PlaybackProgramType | null = null;
    let decadeSlug: string | null = null;
    let genreSlug: string | null = null;
    let groupKey: string | null = null;

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

    $: console.log('groupKey:', groupKey);
    $: console.log('favorites for group:', groupKey ? favorites?.DG?.[groupKey] : undefined);

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
            console.log('tracks loaded:', tracks);
        } catch (err) {
            errorMsg = err instanceof Error ? err.message : 'Failed to load tracks';
        } finally {
            loading = false;
        }
    }

    function isFavorite(rankingId: number): boolean {
        if (programType !== 'DG' || !groupKey) return false;

        return favorites?.DG?.[groupKey]?.includes(rankingId) ?? false;
    }


    onMount(loadProgramView);
    $: if (programKey) loadProgramView();

    function getHistoryForKey(key: string | null) {
        if (!key) return undefined;
        return $programHistoryStore.find(p => p.key === key);
    }

    // ✅ Played uses RANK (not rankingId)
    function isPlayed(rank: number): boolean {
        const history = getHistoryForKey(programKey);
        return history?.playedRanks.includes(rank) ?? false;
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
                    <th>Played</th>
                    <th>Fav</th>
                    <th>Rank</th>
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

                        <td>
                            {#if isFavorite(track.rankingId)}
                                ⭐
                            {:else}
                                 . .
                            {/if}
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
    }

    th, td {
        padding: 8px;
        border-bottom: 1px solid #333;
        text-align: left;
    }
</style>