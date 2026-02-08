import {writable} from 'svelte/store';
import {browser} from '$app/environment';


export type ProgramKey = `DG|${string}|${string}` | `COL|${string}`;

export type ProgramHistory = {
    key: ProgramKey;
    label: string;
    total: number;
    playedRanks: number[];
    updatedAt: number;
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

function canonicalTotalForKey(key: ProgramKey): number {
    if (key.startsWith('DG|')) return 40;
    // collections can stay dynamic for now
    return 0;
}


export function upsertProgram(key: ProgramKey, label: string, total: number) {
    const all = loadAll();
    const idx = all.findIndex(p => p.key === key);

    const canonicalTotal =
        key.startsWith('DG|') ? canonicalTotalForKey(key) : total;

    const next: ProgramHistory = {
        key,
        label,
        total: canonicalTotal,   // ✅ FIXED
        playedRanks: idx >= 0 ? all[idx].playedRanks : [],
        updatedAt: Date.now()
    };

    if (idx >= 0) all[idx] = next;
    else all.unshift(next);

    saveAll(all);
    programHistoryStore.set(all);
}


export function markRankPlayed(key: ProgramKey, rank: number) {
    const all = loadAll();
    const p = all.find(x => x.key === key);
    if (!p) return;

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
