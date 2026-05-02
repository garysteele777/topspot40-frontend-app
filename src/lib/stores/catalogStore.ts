import { writable } from 'svelte/store';

// Define your catalog type (quick version for now)
export type CatalogData = {
    decades: any[];
    genres: any[];
    collectionGroups?: any[];
};

export const catalog = writable<CatalogData | null>(null);