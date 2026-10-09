import type {ProgramHistory} from '../carmode/programHistory';
import type {FavoritesStore} from '../favorites/favorites';
export type CollectionHistoryGroup = {name: string; slug: string; items: {name: string; slug: string}[]};
export function collectionSourceLists(groups: CollectionHistoryGroup[], groupSlug: string, collectionSlug = 'ALL'): string[] {
    return [...new Set(groups.filter(g => groupSlug === 'ALL' || g.slug === groupSlug)
        .flatMap(g => g.items.filter(i => collectionSlug === 'ALL' || i.slug === collectionSlug)
            .map(i => `${i.slug}|${g.slug}`)))];
}
export function collectionCounts(history: ProgramHistory[], favorites: FavoritesStore, lists: string[]) {
    const keys = new Set(lists.map(l => `COL|${l}`));
    const rows = history.filter(h => keys.has(h.key));
    return {collections: lists.length, total: rows.reduce((n, h) => n + h.total, 0),
        played: rows.reduce((n, h) => n + h.playedRanks.length, 0),
        favorites: lists.reduce((n, l) => n + (favorites.COL[l]?.length ?? 0), 0)};
}
export function clearCollectionHistory(history: ProgramHistory[], lists: string[]): ProgramHistory[] {
    const keys = new Set(lists.map(l => `COL|${l}`));
    return history.map(h => keys.has(h.key) ? {...h, playedRanks: []} : h);
}
export function clearCollectionFavorites(data: FavoritesStore, lists: string[]): FavoritesStore {
    const COL = {...data.COL};
    for (const list of lists) delete COL[list];
    return {...data, COL};
}
