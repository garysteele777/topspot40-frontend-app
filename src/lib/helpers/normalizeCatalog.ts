// src/lib/helpers/normalizeCatalog.ts
// ------------------------------------------------------------
// normalizeCatalog.ts — CLEAN VERSION (Option C)
// ------------------------------------------------------------
// This file ensures the catalog coming from the backend has
// consistent shapes for Options-V2, List Mode, and Car Mode.
// ------------------------------------------------------------

import type {GroupedCatalog} from '$lib/api/catalog';
import {browser} from '$app/environment';
import {
    seedCollectionPrograms,
    type ProgramKey
} from '$lib/carmode/programHistory';
import {upsertProgram} from '$lib/carmode/programHistory';

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
        totalTracks: number;
    }[];
};

function buildCollectionHistorySeeds(
    collectionGroups: NormalizedCollectionGroup[]
): {
    key: ProgramKey;
    label: string;
    total: number;
    collectionGroup: string;
    collectionGroupSlug: string;
}[] {
    const entries: {
        key: ProgramKey;
        label: string;
        total: number;
        collectionGroup: string;
        collectionGroupSlug: string;
    }[] = [];

    for (const group of collectionGroups) {
        for (const item of group.items) {
            entries.push({
                key: `COL|${item.slug}|${group.slug}`,
                label: item.name,
                total: item.totalTracks ?? 0,
                collectionGroup: group.name,
                collectionGroupSlug: group.slug
            });
        }
    }

    return entries;
}

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
            totalTracks: item.totalTracks ?? 0
        }))
    }));

    if (browser) {
        // Seed collections (existing)
        seedCollectionPrograms(buildCollectionHistorySeeds(collectionGroups));

        // 🔥 Seed DG programs (NEW)
        const dgSeeds = buildDGHistorySeeds(data);

        console.log("🔥 DG SEEDS:", dgSeeds);

        for (const e of dgSeeds) {
            console.log("🌱 Seeding DG:", e);
            upsertProgram(e.key, e.label, e.total);
        }
    }

    return {decades, genres, collectionGroups};
}

function buildDGHistorySeeds(data: GroupedCatalog): {
    key: ProgramKey;
    label: string;
    total: number;
}[] {
    const entries: {
        key: ProgramKey;
        label: string;
        total: number;
    }[] = [];

    for (const row of data.decade_genre_totals ?? []) {
        const decade = row.decade;
        const genre = row.genre;

        entries.push({
            key: `DG|${decade}|${genre}`,
            label: `${decade} ${genre}`,
            total: row.total_tracks ?? 0
        });
    }

    return entries;
}