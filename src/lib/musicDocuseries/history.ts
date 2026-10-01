import {writable, get} from 'svelte/store';

// Stable story slugs identify the content across EN, ES and PT-BR.
// Only completion is persisted; a new visit always starts at the beginning.
export const DOCUSERIES_HISTORY_KEY = 'ts_docuseries_history_v1';
export type DocuseriesHistory = Record<string, number>;
export const docuseriesHistoryStore = writable<DocuseriesHistory>({});

export function readDocuseriesHistory(storage?: Pick<Storage, 'getItem'>): DocuseriesHistory {
    try {
        const raw = (storage ?? window.localStorage).getItem(DOCUSERIES_HISTORY_KEY);
        const value = raw ? JSON.parse(raw) : {};
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return Object.fromEntries(Object.entries(value).filter(([, time]) =>
            typeof time === 'number' && Number.isFinite(time) && time > 0
        )) as DocuseriesHistory;
    } catch { return {}; }
}

export function refreshDocuseriesHistory(): void {
    docuseriesHistoryStore.set(readDocuseriesHistory());
}

export function markDocuseriesComplete(slug: string): void {
    if (!slug) return;
    const next = {...get(docuseriesHistoryStore), ...readDocuseriesHistory()};
    if (next[slug]) { docuseriesHistoryStore.set(next); return; }
    next[slug] = Date.now();
    try { window.localStorage.setItem(DOCUSERIES_HISTORY_KEY, JSON.stringify(next)); }
    catch { /* Keep playback and this session's history working if storage is unavailable. */ }
    docuseriesHistoryStore.set(next);
}

export function clearDocuseriesHistory(slugs: string[]): void {
    const next = {...get(docuseriesHistoryStore), ...readDocuseriesHistory()};
    slugs.forEach(slug => delete next[slug]);
    try { window.localStorage.setItem(DOCUSERIES_HISTORY_KEY, JSON.stringify(next)); }
    catch { /* Storage may be disabled. */ }
    docuseriesHistoryStore.set(next);
}

export function docuseriesProgress(stories: {slug: string}[], history: DocuseriesHistory) {
    const completed = stories.filter(story => Boolean(history[story.slug])).length;
    return {completed, total: stories.length, remaining: stories.length - completed,
        complete: stories.length > 0 && completed === stories.length};
}

// HTMLMediaElement.played measures actual unique audio ranges. Seeking to the
// end and replaying the same portion cannot inflate completion.
export function hasListenedEnough(played: TimeRanges, duration: number): boolean {
    if (!Number.isFinite(duration) || duration <= 0) return false;
    let listened = 0;
    for (let index = 0; index < played.length; index++) {
        listened += Math.max(0, Math.min(duration, played.end(index)) - Math.max(0, played.start(index)));
    }
    return listened / duration >= 0.9;
}
