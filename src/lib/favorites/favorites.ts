import {browser} from '$app/environment';
import {writable, get} from 'svelte/store';

export type ProgramType = 'DG' | 'COL';

export type FavoritesStore = {
    DG: Record<string, number[]>;
    COL: Record<string, number[]>;
};

const STORAGE_KEY = 'ts-favorites-v1';

const defaultData: FavoritesStore = {
    DG: {},
    COL: {}
};

/* ─────────────────────────────────────────────
   Safe JSON parsing
───────────────────────────────────────────── */

function safeParse(json: string): FavoritesStore | null {
    try {
        const data = JSON.parse(json) as FavoritesStore;

        if (!data || typeof data !== 'object') return null;
        if (!data.DG || !data.COL) return null;

        return data;
    } catch {
        return null;
    }
}

/* ─────────────────────────────────────────────
   Load / Save
───────────────────────────────────────────── */

function loadInitial(): FavoritesStore {
    if (!browser) return defaultData;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;

    return safeParse(raw) ?? defaultData;
}

/* ─────────────────────────────────────────────
   Reactive Store
───────────────────────────────────────────── */

export const favoritesStore = writable<FavoritesStore>(loadInitial());

if (browser) {
    favoritesStore.subscribe((data) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
}

/* ─────────────────────────────────────────────
   API
───────────────────────────────────────────── */

export function isFavorite(
    program: ProgramType,
    group: string,
    rankingId: number
): boolean {

    let isFav = false;

    favoritesStore.subscribe((data) => {
        const list = data[program][group] ?? [];
        isFav = list.includes(rankingId);
    })();

    return isFav;
}


export function toggleFavorite(
    program: ProgramType,
    group: string,
    rankingId: number
): { added: boolean; count: number } {

    let result = {added: false, count: 0};

    favoritesStore.update((data) => {

        const existing = data[program][group] ?? [];
        const exists = existing.includes(rankingId);

        const next = exists
            ? existing.filter((id) => id !== rankingId)
            : [...existing, rankingId];

        result = {
            added: !exists,
            count: next.length
        };

        return {
            ...data,
            [program]: {
                ...data[program],
                [group]: next
            }
        };
    });

    return result;
}

export function countFavorites(
    program: ProgramType,
    group: string
): number {
    const data = get(favoritesStore);
    return (data[program][group] ?? []).length;
}

export function clearFavorites(
    program: ProgramType,
    group: string
): void {
    favoritesStore.update((data) => {
        const copy = {...data};
        delete copy[program][group];
        return copy;
    });
}

export function getFavorites(
    program: ProgramType,
    group: string
): number[] {
    const data = get(favoritesStore);
    return data[program][group] ?? [];
}
