<script lang="ts">
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import {
        isFavorite,
        toggleFavorite,
        type ProgramType
    } from '$lib/favorites/favorites';
    import {favoritesStore} from '$lib/favorites/favorites';

    export let tracks: CarModeTrack[] = [];
    export let currentTrack: CarModeTrack | null = null;
    export let onJumpToTrack: ((track: CarModeTrack) => void) | undefined;
    export let isPlayed: (rank: number) => boolean = () => false;
    export let programType: ProgramType | null = null;
    export let programGroup: string | null = null;
    export let closeOnJump: (() => void) | undefined = undefined;

    $: favoriteRefresh = $favoritesStore;
    $: showFavorites = !!(programType && programGroup);

    function handleJump(track: CarModeTrack) {
        onJumpToTrack?.(track);
        closeOnJump?.();
    }

    function isCurrentTrack(track: CarModeTrack): boolean {
        if (currentTrack?.rankingId != null && track.rankingId != null) {
            return currentTrack.rankingId === track.rankingId;
        }

        return currentTrack?.rank === track.rank;
    }
</script>

<div class="tracklist-scroll">
    <div class="track-row track-row-header" class:without-favorites={!showFavorites}>
        <span>Played</span>
        {#if showFavorites}<span>Fav</span>{/if}
        <span>Rank</span>
        <span>Title</span>
        <span>Artist</span>
    </div>

    {#each [...tracks].sort((a, b) => a.rank - b.rank) as t}
        {@const favoriteGroup = t.favoriteGroup ?? programGroup}
        <div
                class="track-row"
                class:without-favorites={!showFavorites}
                role="button"
                tabindex="0"
                class:active={isCurrentTrack(t)}
                on:click={() => handleJump(t)}
                on:keydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleJump(t);
                    }
                }}
        >
            <span class="played-col">
                {#if isPlayed(t.rank)}
                    ✓
                {/if}
            </span>

            {#if showFavorites}
            <button
                    type="button"
                    class="fav-col"
                    disabled={t.rankingId == null}
                    class:active={
                        favoriteRefresh &&
                        programType &&
                        favoriteGroup &&
                        t.rankingId != null &&
                        isFavorite(programType, favoriteGroup, t.rankingId)
                    }
                    on:click|stopPropagation={() => {
                        if (programType && favoriteGroup && t.rankingId != null) {
                            toggleFavorite(programType, favoriteGroup, t.rankingId);
                        }
                    }}
            >
                {#if t.rankingId != null}★{/if}
            </button>
            {/if}

            <span class="rank">#{t.rank}</span>
            <span class="title">{t.trackName}
                {#if t.favoriteGroup}<small>{t.favoriteGroup.replaceAll('|', ' • ').replaceAll('_', ' ')} • #{t.sourceRank}</small>{/if}
            </span>
            <span class="artist">{t.artistName}</span>
        </div>
    {/each}
</div>

<style>
    .tracklist-scroll {
        max-height: 60vh;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px;
        box-sizing: border-box;
    }

    .track-row {
        width: 100%;
        box-sizing: border-box;
        display: grid;
        grid-template-columns: 48px 36px 56px minmax(0, 1.25fr) minmax(0, 1fr);
        gap: 8px;
        align-items: center;
        text-align: left;
        padding: 9px 10px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #eee;
        cursor: pointer;
    }

    .track-row.without-favorites {
        grid-template-columns: 48px 56px minmax(0, 1.25fr) minmax(0, 1fr);
    }

    .track-row:hover {
        background: rgba(207, 184, 124, 0.12);
    }

    .track-row.active {
        background: rgba(29, 185, 84, 0.18);
        outline: 1px solid rgba(29, 185, 84, 0.45);
    }

    .track-row-header {
        color: #cfb87c;
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.9;
        cursor: default;
    }

    .played-col,
    .fav-col {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 24px;
    }

    .played-col {
        opacity: 0.7;
    }

    .fav-col {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.35);
        cursor: pointer;
        font-size: 1rem;
        width: 100%;
    }

    .fav-col.active {
        color: #cfb87c;
    }

    .rank {
        color: #cfb87c;
        font-weight: 700;
    }

    .title {
        font-weight: 600;
    }

    .title small {display: block; font-weight: normal; opacity: .75; font-size: .8rem;}

    .artist {
        opacity: 0.75;
    }
</style>