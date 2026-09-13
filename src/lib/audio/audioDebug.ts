import {browser} from '$app/environment';
import {writable} from 'svelte/store';

export type AudioDebugEntry = {
    timestamp: string;
    event: string;
    details?: Record<string, string | number | boolean | null | undefined>;
};

const MAX_ENTRIES = 250;
const AUDIO_DEBUG_SESSION_KEY = 'topspot_audio_debug_enabled';
const entries = writable<AudioDebugEntry[]>([]);
export const audioDebugEntries = {subscribe: entries.subscribe};
const enabled = writable(false);
export const audioDebugEnabled = {subscribe: enabled.subscribe};

let enabledOverride: boolean | null = null;
let nextAudioElementId = 1;
const audioElementIds = new WeakMap<HTMLMediaElement, number>();
const instrumentedAudioElements = new WeakSet<HTMLMediaElement>();

type AudioDebugSessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getSessionStorage(): AudioDebugSessionStorage | null {
    if (!browser || typeof window === 'undefined') return null;

    try {
        return window.sessionStorage;
    } catch {
        return null;
    }
}

function isAudioDebugRequested(search: string | undefined): boolean {
    return new URLSearchParams(search ?? '').get('audioDebug') === '1';
}

function hasAudioDebugSession(storage: AudioDebugSessionStorage | null): boolean {
    try {
        return storage?.getItem(AUDIO_DEBUG_SESSION_KEY) === '1';
    } catch {
        return false;
    }
}

// Called by the root layout, allowing a diagnostic URL to be opened before
// navigating into Car Mode. Only the enabled flag is session-persisted.
export function activateAudioDebugFromSearch(
    search?: string,
    storage: AudioDebugSessionStorage | null = getSessionStorage()
): boolean {
    const active = isAudioDebugRequested(search) || hasAudioDebugSession(storage);

    if (isAudioDebugRequested(search)) {
        try {
            storage?.setItem(AUDIO_DEBUG_SESSION_KEY, '1');
        } catch {
            // Diagnostics remain active for this loaded page if storage is unavailable.
        }
    }

    enabled.set(active);
    return active;
}

export function isAudioDebugEnabled(
    search?: string,
    storage: AudioDebugSessionStorage | null = getSessionStorage()
): boolean {
    if (enabledOverride !== null) return enabledOverride;
    const runtimeSearch = browser && typeof window !== 'undefined'
        ? window.location?.search
        : undefined;
    return isAudioDebugRequested(search ?? runtimeSearch) || hasAudioDebugSession(storage);
}

// Test-only seam; no setting is persisted or exposed to application users.
export function setAudioDebugEnabledForTest(value: boolean | null): void {
    enabledOverride = value;
}

function activationDetails(): Record<string, boolean | undefined> {
    const activation = navigator.userActivation;
    return {
        userActivationIsActive: activation?.isActive,
        userActivationHasBeenActive: activation?.hasBeenActive
    };
}

function safeDetails(
    details: Record<string, string | number | boolean | null | undefined> | undefined
): Record<string, string | number | boolean | null | undefined> | undefined {
    if (!details) return undefined;

    // Callers provide only preselected operational fields. Never accept URLs,
    // browser storage, auth values, or arbitrary object payloads into this log.
    return Object.fromEntries(
        Object.entries(details)
            .filter(([key]) => !/url|token|cookie|storage|auth|credential/i.test(key))
            .map(([key, value]) => [
                key,
                typeof value === 'string'
                    ? value.replace(/(?:https?|wss?):\/\/\S+/gi, '<redacted-url>').slice(0, 160)
                    : value
            ])
    );
}

export function logAudioDebug(
    event: string,
    details?: Record<string, string | number | boolean | null | undefined>
): void {
    if (!isAudioDebugEnabled()) return;

    const entry: AudioDebugEntry = {
        timestamp: new Date().toISOString(),
        event,
        details: safeDetails({...activationDetails(), ...details})
    };

    entries.update(current => [...current, entry].slice(-MAX_ENTRIES));
}

export function clearAudioDebugLog(): void {
    entries.set([]);
}

export function disableAudioDebug(
    storage: AudioDebugSessionStorage | null = getSessionStorage()
): void {
    try {
        storage?.removeItem(AUDIO_DEBUG_SESSION_KEY);
    } catch {
        // Clearing diagnostics must still clear the in-memory log.
    }
    clearAudioDebugLog();
    enabled.set(false);
}

export function audioDebugElementId(audio: HTMLMediaElement): number {
    let id = audioElementIds.get(audio);
    if (!id) {
        id = nextAudioElementId++;
        audioElementIds.set(audio, id);
    }
    return id;
}

export function instrumentAudioElement(
    audio: HTMLMediaElement,
    kind: 'narration' | 'bed',
    creation: 'created' | 'reused'
): number {
    if (!isAudioDebugEnabled()) return 0;
    const id = audioDebugElementId(audio);
    logAudioDebug(`audio element ${creation}`, {kind, audioElementId: id});

    if (instrumentedAudioElements.has(audio)) return id;
    instrumentedAudioElements.add(audio);

    for (const event of ['playing', 'play', 'pause', 'waiting', 'stalled', 'suspend', 'canplay', 'ended', 'error']) {
        audio.addEventListener(event, () => {
            logAudioDebug(`audio ${event}`, {kind, audioElementId: id});
        });
    }

    return id;
}

export function logAudioPlayCall(
    audio: HTMLMediaElement,
    kind: 'narration' | 'bed',
    outcome: 'called' | 'resolved' | 'rejected' | 'pending',
    error?: unknown
): void {
    if (!isAudioDebugEnabled()) return;
    const exception = error instanceof Error ? error : null;
    logAudioDebug(`audio.play ${outcome}`, {
        kind,
        audioElementId: audioDebugElementId(audio),
        errorName: exception?.name,
        errorMessage: exception?.message
    });
}

export function copyAudioDebugLog(): Promise<void> {
    let snapshot: AudioDebugEntry[] = [];
    const unsubscribe = entries.subscribe(value => { snapshot = value; });
    unsubscribe();
    return navigator.clipboard?.writeText(JSON.stringify(snapshot, null, 2)) ?? Promise.resolve();
}
