import type {VoicePart} from '$lib/types/playback';

export type DetailLength = 'off' | 'short' | 'long';

type PlaybackSettingsForLaunch = {
    playbackOrder: string;
    voices: VoicePart[];
    voicePlayMode: string;
    pauseMode: string;
    detailLength: DetailLength;
};

type SelectionForLaunch = {
    language?: string;
    languages?: string[];
};

/**
 * The backend accepts the normalized detail-length choice alongside voices.
 * Keep this value independent of its display label and force it off when the
 * detail voice itself is disabled.
 */
export function resolvedDetailLength(settings: PlaybackSettingsForLaunch): DetailLength {
    return settings.voices.includes('detail') ? settings.detailLength : 'off';
}

export function buildPlaybackSelection<T extends SelectionForLaunch>(
    selection: T,
    settings: PlaybackSettingsForLaunch
): T & {
    playbackOrder: string;
    voices: VoicePart[];
    voicePlayMode: string;
    pauseMode: string;
    continuous: boolean;
    detailLength: DetailLength;
} {
    return {
        ...selection,
        languages: selection.languages ?? [selection.language ?? 'en'],
        playbackOrder: settings.playbackOrder,
        voices: settings.voices,
        voicePlayMode: settings.voicePlayMode,
        pauseMode: settings.pauseMode,
        continuous: settings.pauseMode === 'continuous',
        detailLength: resolvedDetailLength(settings)
    };
}

/** Shared by the route's actual fetch call and launch-contract tests. */
export function playbackTrackRequestInit(payload: unknown): RequestInit {
    return {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    };
}
