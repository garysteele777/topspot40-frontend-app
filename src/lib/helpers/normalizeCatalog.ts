// src/lib/helpers/normalizeCatalog.ts
// ------------------------------------------------------------
// normalizeCatalog.ts — CLEAN VERSION (Option C)
// ------------------------------------------------------------
// This file ensures the catalog coming from the backend has
// consistent shapes for Options-V2, List Mode, and Car Mode.
// ------------------------------------------------------------

import type {GroupedCatalog} from '$lib/api/catalog';

// Normalized types
export type NormalizedDecade = {
    id: string;
    label: string;
};

export type NormalizedGenre = {
    id: string;
    label: string;
};

export type NormalizedCollectionGroup = {
    name: string;
    slug: string;
    items: {
        id: string | number;
        name: string;
        slug: string;
        totalTracks: number;   // ⭐ ADD THIS
    }[];
};

// ------------------------------------------------------------
// Main normalize function
// ------------------------------------------------------------
export function normalizeCatalog(
    data: GroupedCatalog | null | undefined
): {
    decades: NormalizedDecade[];
    genres: NormalizedGenre[];
    collectionGroups: NormalizedCollectionGroup[];
} {
    if (!data) {
        return {
            decades: [],
            genres: [],
            collectionGroups: []
        };
    }

    // 1) Decades
    const decades = (data.decades ?? []).map((d) => ({
        id: d.slug ?? String(d.name ?? 'unknown-decade'),
        label: d.name ?? d.slug ?? 'Unknown Decade'
    }));

    // 2) Genres
    const genres = (data.genres ?? []).map((g) => ({
        id: g.slug ?? String(g.name ?? 'unknown-genre'),
        label: g.name ?? g.slug ?? 'Unknown Genre'
    }));

    // 3) Collection groups
    const collectionGroups = (data.collections ?? []).map((group, i) => ({
        name: group.category ?? `Group ${i + 1}`,
        slug: group.slug ?? `group-${i}`,
        items: (group.collections ?? []).map((item, j) => ({
            id: item.id ?? j,
            name: item.name ?? item.slug ?? `item-${j}`,
            slug: item.slug ?? `item-${j}`,
            totalTracks: item.totalTracks ?? 0   // ⭐ THIS FIXES EVERYTHING
        }))
    }));

    return {decades, genres, collectionGroups};
}
