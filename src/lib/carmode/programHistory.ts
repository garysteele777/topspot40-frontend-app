import {writable} from 'svelte/store';

export type ProgramKey = string;
type HistoryMap = Record<ProgramKey, string[]>;

const STORAGE_KEY = 'topspot:programHistory';

function loadHistory(): HistoryMap {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveHistory(value: HistoryMap) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

function createProgramHistory() {
    const {subscribe, update} = writable<HistoryMap>(loadHistory());


    return {
        subscribe,

        markPlayed(programKey: ProgramKey, trackId: string) {
            update((h) => {
                const list = h[programKey] ?? [];
                if (!list.includes(trackId)) {
                    h[programKey] = [...list, trackId];
                    saveHistory(h);
                }
                return h;
            });
        },

        clear(programKey?: ProgramKey) {
            update((h) => {
                if (programKey) {
                    delete h[programKey];
                } else {
                    h = {};
                }
                saveHistory(h);
                return h;
            });
        }
    };
}

export const programHistory = createProgramHistory();
