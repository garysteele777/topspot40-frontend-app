import {writable} from 'svelte/store';
import {browser} from '$app/environment';


export type ProgramKey =
    | `DG|${string}|${string}`
    | `COL|${string}|${string}`;

export type ProgramHistory = {
    key: ProgramKey;
    label: string;
    total: number;
    playedRanks: number[];
    updatedAt: number;

    // ⭐ NEW (collections only)
    collectionGroup?: string; // e.g. "Stage & Screen"
    collectionGroupSlug?: string; // e.g. "stage_and_screen"
};


const STORAGE_KEY = 'ts_program_history_v1';

function loadAll(): ProgramHistory[] {
    if (!browser) return [];

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}


function saveAll(items: ProgramHistory[]) {
    if (!browser) return;   // ⭐⭐ CRITICAL
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}


export const programHistoryStore = writable<ProgramHistory[]>(
    browser ? loadAll() : []
);

function canonicalTotalForKey(key: ProgramKey, incomingTotal: number): number {
    return incomingTotal;
}


export function upsertProgram(
    key: ProgramKey,
    label: string,
    total: number,
    extra?: Partial<ProgramHistory>
) {

    // 🚫 Prevent aggregate DG buckets (ALL decade or ALL genre)
    if (key.startsWith('DG|')) {
        const [, decade, genre] = key.split('|');

        if (decade === 'ALL' || genre === 'ALL') {
            return; // do not create program history entry
        }
    }

    const all = loadAll();
    const idx = all.findIndex(p => p.key === key);

    const canonicalTotal = canonicalTotalForKey(key, total ?? 0);

    // 👇 ADD THIS LOG
    // console.log("🧠 upsertProgram TOTAL DEBUG:", {
    //     key,
    //     incomingTotal: total,
    //     canonicalTotal,
    //     label
    // });

    const next: ProgramHistory = {
        key,
        label,
        total: canonicalTotal,
        playedRanks: idx >= 0 ? all[idx].playedRanks : [],
        updatedAt: Date.now(),
        ...extra
    };

    if (idx >= 0) all[idx] = next;
    else all.unshift(next);

    saveAll(all);
    programHistoryStore.set(all);
}


export function markRankPlayed(
    key: ProgramKey,
    rank: number,
    label?: string,
    total?: number
) {

    const all = loadAll();
    let p = all.find(x => x.key === key);

    if (!p) {
        // Do NOT create incomplete program entries
        return;
    }

    if (!p.playedRanks.includes(rank)) {
        p.playedRanks.push(rank);
    }

    p.updatedAt = Date.now();

    saveAll(all);
    programHistoryStore.set(all);
}

export function resetProgram(key: ProgramKey) {
    const all = loadAll().map(p =>
        p.key === key ? {...p, playedRanks: []} : p
    );

    saveAll(all);
    programHistoryStore.set(all);
}

export function resetAllPrograms() {
    localStorage.removeItem(STORAGE_KEY);
    programHistoryStore.set([]);
}

export function seedCollectionPrograms(
    entries: {
        key: ProgramKey;
        label: string;
        total: number;
        collectionGroup?: string;
        collectionGroupSlug?: string;
    }[]
) {
    const all = loadAll();
    const map = new Map(all.map(p => [p.key, p]));

    for (const e of entries) {
        if (!map.has(e.key)) {
            map.set(e.key, {
                key: e.key,
                label: e.label,
                total: e.total,
                playedRanks: [],
                updatedAt: Date.now(),
                collectionGroup: e.collectionGroup,
                collectionGroupSlug: e.collectionGroupSlug
            });
        }
    }

    const next = Array.from(map.values());

    saveAll(next);
    programHistoryStore.set(next);
}