import {get} from 'svelte/store';
import {currentTrack, currentSelection} from '$lib/carmode/CarMode.store';
import {markRankPlayed, type ProgramKey} from '$lib/carmode/programHistory';

export function markCurrentTrackPlayed(): void {
    const track = get(currentTrack);
    const sel = get(currentSelection);

    if (!track || !sel) return;

    const key = buildProgramKey(track, sel);
    if (!key) return;

    markRankPlayed(key, track.rank);
}

function buildProgramKey(track: any, sel: any): ProgramKey | null {

    if (sel.mode === 'decade_genre') {
        const decade = track.decadeSlug;
        const genre = track.genreSlug;

        if (!decade || !genre) return null;

        return `DG|${decade}|${genre}`;
    }

if (sel.mode === 'collection') {
    const collection =
        track.collectionSlug ??
        track.collection_slug ??
        sel.context?.collection_slug;

    const group =
        track.collectionGroupSlug ??
        track.collection_group_slug ??
        sel.context?.collection_group_slug;

    if (!collection || !group || collection === 'ALL' || group === 'ALL') {
        return null;
    }

    return `COL|${collection}|${group}`;
}

    return null;
}