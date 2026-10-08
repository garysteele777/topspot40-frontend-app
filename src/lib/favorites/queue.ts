import type {FavoritePlaybackEntry} from './playback';
import type {LoadedTrack} from '../utils/normalizeTrack';
import type {SelectionState} from '../stores/selection';

/** Fetch each original list once, keeping its own narration and ranking. */
export async function loadFavoriteQueue(
    entries: FavoritePlaybackEntry[],
    selection: SelectionState,
    loadSource: (selection: SelectionState) => Promise<LoadedTrack[]>
): Promise<LoadedTrack[]> {
    const sources = [...new Map(entries.map(entry => [entry.group, entry])).values()];
    const lists = new Map<string, LoadedTrack[]>();

    // Bound requests when a listener has favorites throughout the catalog.
    for (let offset = 0; offset < sources.length; offset += 4) {
        const batch = await Promise.all(sources.slice(offset, offset + 4).map(async entry => {
            const source: SelectionState = {
                ...selection,
                programType: entry.program === 'DG' ? 'PROGRAM_DG' : 'PROGRAM_COL',
                mode: entry.program === 'DG' ? 'decade_genre' : 'collection',
                context: entry.program === 'DG'
                    ? {decade: entry.decade, genre: entry.genre}
                    : {collection_slug: entry.collectionSlug, collection_group_slug: entry.collectionGroup},
                startRank: 1, endRank: 9999, currentRank: 1, skipPlayed: false
            };
            return [entry.group, await loadSource(source)] as const;
        }));
        for (const [group, list] of batch) lists.set(group, list);
    }

    const queue: LoadedTrack[] = [];
    for (const entry of entries) {
        const track = lists.get(entry.group)?.find(track => track.rankingId === entry.rankingId);
        if (!track) continue;
        queue.push({
            ...track,
            // Combined position is independent of the original narration rank.
            rank: queue.length + 1,
            sourceRank: track.sourceRank ?? track.rank,
            favoriteGroup: entry.group,
            ...(entry.program === 'DG'
                ? {decadeSlug: entry.decade, genreSlug: entry.genre}
                : {collectionSlug: entry.collectionSlug, collectionGroupSlug: entry.collectionGroup})
        });
    }
    return queue;
}
