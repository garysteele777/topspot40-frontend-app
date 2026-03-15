import {writable} from 'svelte/store';
import {browser} from '$app/environment';


export type ProgramKey = `DG|${string}|${string}` | `COL|${string}`;

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
    // Only force 40 for normal decade programs.
    // For ALL decades (DG|ALL|...), keep the real total (320, 2560, etc).
    if (key.startsWith('DG|')) {
        const parts = key.split('|');
        const decade = parts[1] ?? '';
        if (decade !== 'ALL') return 40;
    }
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

    const canonicalTotal = canonicalTotalForKey(key, total);

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
    total: number = 40
) {

    const all = loadAll();
    let p = all.find(x => x.key === key);

    // ⭐ Lazy creation
    if (!p) {
        const canonicalTotal = canonicalTotalForKey(key, total);

        p = {
            key,
            label: label ?? key,
            total: canonicalTotal,
            playedRanks: [],
            updatedAt: Date.now()
        };

        all.unshift(p);
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
