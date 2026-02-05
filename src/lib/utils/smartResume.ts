import type {
    ModeType,
    Language,
    VoicePart,
    PlaybackOrder,
    PauseMode
} from '$lib/types/playback';


export type ResumeState = {
    mode: ModeType;
    context: Record<string, string>;

    language: Language;
    startRank: number;
    endRank: number;

    playbackOrder: PlaybackOrder;
    currentRank: number;

    pauseMode: PauseMode;   // now required & typed

    voices: VoicePart[];
};


const STORAGE_KEY = 'topspot_last_selection';

// SSR guard
function hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Save
export function saveResumeState(state: ResumeState) {
    if (!hasLocalStorage()) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn('⚠️ Failed to save resume state', e);
    }
}

// Load
export function loadResumeState(): ResumeState | null {
    if (!hasLocalStorage()) return null;

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
