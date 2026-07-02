<script lang="ts">
    import { onDestroy } from 'svelte';
    import {
        currentTrack,
        playbackPhase
    } from '$lib/carmode/CarMode.store';

    import {
        artistSummary,
        type ArtistSummary
    } from '$lib/studio/artistSummary.store';

    let lastArtistId: number | null = null;

    $: artistId =
        ($currentTrack as any)?.artist_id ??
        ($currentTrack as any)?.artistId ??
        null;

    $: if (artistId && artistId !== lastArtistId) {
        lastArtistId = artistId;
        loadArtistSummary(artistId);
    }

    $: console.log('CURRENT TRACK IN CONTEXT PANEL', $currentTrack);

    async function loadArtistSummary(id: number) {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/artist-spotlight/artist-summary?artist_id=${id}&language=en`
            );

            if (!res.ok) {
                artistSummary.set(null);
                return;
            }

            const data: ArtistSummary = await res.json();
            artistSummary.set(data);
        } catch {
            artistSummary.set(null);
        }
    }

    onDestroy(() => {
        artistSummary.set(null);
    });

    $: title =
        $playbackPhase === 'artist' || $playbackPhase === 'track'
            ? 'Meet the Artist'
            : $playbackPhase === 'detail'
                ? 'Behind the Music'
                : $playbackPhase === 'intro'
                    ? 'About This Song'
                    : 'Now Playing';

    $: body =
        $playbackPhase === 'artist' || $playbackPhase === 'track'
            ? ($artistSummary?.artist.artist_description ?? $currentTrack?.artistText)
            : $playbackPhase === 'detail'
                ? $currentTrack?.detail
                : $playbackPhase === 'intro'
                    ? $currentTrack?.intro
                    : null;
</script>

<section class="context-panel">
    <div class="context-title">{title}</div>

    {#if body}
        <div class="context-body">
            {#if ($playbackPhase === 'artist' || $playbackPhase === 'track') && $artistSummary}
                <h2>{$artistSummary.artist.artist_name}</h2>
            {/if}

            <p>{body}</p>

            {#if ($playbackPhase === 'artist' || $playbackPhase === 'track') && $artistSummary}
                <div class="appearances">
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
        </div>
    {:else}
        <div class="placeholder">Waiting for narration...</div>
    {/if}
</section>