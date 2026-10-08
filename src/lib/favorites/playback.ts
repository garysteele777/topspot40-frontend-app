import type { FavoritesStore } from './favorites';

export type FavoritesPlaybackScope =
    | { program: 'DG'; genre?: string; decade?: string }
    | { program: 'COL'; collectionGroup?: string; collectionSlug?: string };

export type FavoritePlaybackEntry =
    | {
        program: 'DG';
        group: string;
        rankingId: number;
        decade: string;
        genre: string;
    }
    | {
        program: 'COL';
        group: string;
        rankingId: number;
        collectionSlug: string;
        collectionGroup: string;
    };

/**
 * Build a playback selection from saved program entries, preserving their source.
 * Omit the filter for all genres/collections. A repeated recording in two lists
 * stays two entries: the source ranking is needed to resolve its original intro.
 * This does not fetch tracks, change saved stars, or choose playback order.
 */
export function selectFavoriteEntries(
    data: FavoritesStore,
    scope: FavoritesPlaybackScope
): FavoritePlaybackEntry[] {
    const entries: FavoritePlaybackEntry[] = [];

    for (const [group, rankingIds] of Object.entries(data[scope.program])) {
        const parts = group.split('|');
        if (parts.length !== 2 || !parts[0] || !parts[1]) continue;
        const [first, second] = parts;

        if (scope.program === 'DG') {
            if (scope.decade !== undefined && scope.decade !== first) continue;
            if (scope.genre !== undefined && scope.genre !== second) continue;
            for (const rankingId of rankingIds) {
                entries.push({ program: 'DG', group, rankingId, decade: first, genre: second });
            }
        } else {
            if (scope.collectionSlug !== undefined && scope.collectionSlug !== first) continue;
            if (scope.collectionGroup !== undefined && scope.collectionGroup !== second) continue;
            for (const rankingId of rankingIds) {
                entries.push({
                    program: 'COL', group, rankingId,
                    collectionSlug: first, collectionGroup: second
                });
            }
        }
    }

    return entries;
}
