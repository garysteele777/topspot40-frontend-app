// src/lib/utils/smartResume.ts

export type ResumeState = {
  mode: 'decade_genre' | 'collection';
  context: Record<string, string>;
  language: string;
  startRank: number;
  endRank: number;
  playbackOrder: 'up' | 'down' | 'shuffle';
  currentRank: number;
  autoAdvance: boolean;
  voices: string[];
};

const STORAGE_KEY = 'topspot_last_selection';

// SSR guard
function hasLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

// Save the current state
export function saveResumeState(state: ResumeState) {
  if (!hasLocalStorage()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('⚠️ Failed to save resume state', e);
  }
}

// Load last saved state
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
