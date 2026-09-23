<script lang="ts">
    import {onDestroy} from 'svelte';
    import {
        currentSelection,
        currentTrack,
        tracks,
        playbackPhase
    } from '$lib/carmode/CarMode.store';

    import {programHistoryStore} from '$lib/carmode/programHistory';
    import type {ProgramType} from '$lib/favorites/favorites';
    import {showCamera} from '$lib/studio/studio.store';

    import TrackListPanel from '$lib/components/shared/TrackListPanel.svelte';
    import {contextMode} from '$lib/studio/contextMode.store';
    import {buildProgramHistoryKey, isProgramRankPlayed} from '$lib/program/history';

    import {
        artistSummary,
        type ArtistSummary
    } from '$lib/studio/artistSummary.store';

    let programType: ProgramType | null = null;
    let programGroup: string | null = null;

    let lastArtistId: number | null = null;

    $: programType =
        $currentSelection?.mode === 'decade_genre'
            ? 'DG'
            : $currentSelection?.mode === 'collection'
                ? 'COL'
                : null;

    $: programGroup =
        programType === 'DG'
            ? `${$currentSelection?.context?.decade}|${$currentSelection?.context?.genre}`
            : programType === 'COL'
                ? `${$currentSelection?.context?.collection_slug}|${$currentSelection?.context?.collection_group_slug}`
                : null;

    function isPlayed(rank: number): boolean {
        return isProgramRankPlayed(
            $programHistoryStore,
            buildProgramHistoryKey($currentSelection),
            rank
        );
    }

    $: artistId =
        ($currentTrack as any)?.artist_id ??
        ($currentTrack as any)?.artistId ??
        null;

    $: if (artistId && artistId !== lastArtistId) {
        lastArtistId = artistId;
        artistSummary.set(null);
        loadArtistSummary(artistId);
    }

    async function loadArtistSummary(id: number) {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/artist-spotlight/artist-summary?artist_id=${id}&language=${$currentSelection?.language ?? 'en'}`
            );

            if (!res.ok) {
                artistSummary.set(null);
                return;
            }

            const data: ArtistSummary = await res.json();
            if (data.artist.artist_id !== id) return;

            artistSummary.set(data);
        } catch {
            artistSummary.set(null);
        }
    }

    onDestroy(() => {
        artistSummary.set(null);
    });

    $: title =
        $contextMode === 'tracks'
            ? 'Track List'
            : $contextMode === 'appearances'
                ? 'Artist Appearances'
                : $contextMode === 'artist'
                    ? 'Meet the Artist'
                    : $contextMode === 'detail'
                        ? 'Behind the Music'
                        : $contextMode === 'intro'
                            ? 'About This Song'
                            : $playbackPhase === 'artist' || $playbackPhase === 'track'
                                ? 'Meet the Artist'
                                : $playbackPhase === 'detail'
                                    ? 'Behind the Music'
                                    : $playbackPhase === 'intro'
                                        ? 'About This Song'
                                        : 'Now Playing';


    $: selectedLanguage = $currentSelection?.language ?? 'en';

    function localizedText(
        kind: 'intro' | 'detail' | 'artist'
    ): string | null {
        const texts = $currentTrack?.textsByLanguage;
        if (!texts) return null;

        return texts[selectedLanguage]?.[kind] ?? null;
    }

    $: body =
        $contextMode === 'artist'
            ? (localizedText('artist') ?? $artistSummary?.artist.artist_description ?? $currentTrack?.artistText)

            : $contextMode === 'detail'
                ? (localizedText('detail') ?? $currentTrack?.detail)

                : $contextMode === 'intro'
                    ? (localizedText('intro') ?? $currentTrack?.intro)

                    : $playbackPhase === 'artist' || $playbackPhase === 'track'
                        ? (localizedText('artist') ?? $artistSummary?.artist.artist_description ?? $currentTrack?.artistText)

                        : $playbackPhase === 'detail'
                            ? (localizedText('detail') ?? $currentTrack?.detail)

                            : $playbackPhase === 'intro'
                                ? (localizedText('intro') ?? $currentTrack?.intro)

                                : null;
</script>

<section class="context-panel">
    <div class="context-title">{title}</div>

    {#if $contextMode === 'tracks' && !$showCamera}

        <TrackListPanel
                tracks={$tracks}
                currentTrack={$currentTrack}
                onJumpToTrack={undefined}
                isPlayed={isPlayed}
                {programType}
                {programGroup}
        />
    {:else if body || $contextMode === 'appearances'}

        <div class="context-body">
            {#if ($contextMode === 'appearances' ||
                (($playbackPhase === 'artist' || $playbackPhase === 'track') &&
                    $contextMode !== 'intro' &&
                    $contextMode !== 'detail')) &&
            $artistSummary}
                {#if $contextMode !== 'appearances'}
                    <div class="fade-card">
                        <h2>{$artistSummary.artist.artist_name}</h2>
                        <p>{body}</p>
                    </div>
                {:else}
                    <div class="appearances fade-card">
                        <div class="appearance-count">
                            Appears in {$artistSummary.appearanceCount} TopSpot40 programs
                        </div>

                        {#if $artistSummary.nostalgiaAppearances.length}
                            <h3>Nostalgia</h3>
                            <ul>
                                {#each $artistSummary.nostalgiaAppearances as item}
                                    <li>{item.program_name} #{item.rank} — {item.track_name}</li>
                                {/each}
                            </ul>
                        {/if}

                        {#if $artistSummary.collectionAppearances.length}
                            <h3>Collections</h3>
                            <ul>
                                {#each $artistSummary.collectionAppearances as item}
                                    <li>{item.program_name} #{item.rank} — {item.track_name}</li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                {/if}
            {:else}
                <p>{body}</p>
            {/if}
        </div>

    {:else}

        <div class="placeholder">Waiting for narration...</div>

    {/if}
</section>
