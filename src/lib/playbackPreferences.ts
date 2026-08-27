import type {
    DetailLength,
    PauseMode,
    PlaybackOrder,
    VoicePart,
    VoicePlayMode
} from '$lib/types/playback';

export type PlaybackMethod = 'automatic' | 'guided';

export type NarrationFlags = {
    playIntro: boolean;
    playDetail: boolean;
    playArtistDescription: boolean;
};

const VALID_PLAYBACK_METHODS = new Set<PlaybackMethod>([
    'automatic',
    'guided'
]);
const VALID_VOICES = new Set<VoicePart>(['intro', 'detail', 'artist']);
const VALID_PLAYBACK_ORDERS = new Set<PlaybackOrder>(['up', 'down', 'shuffle']);
const VALID_PAUSE_MODES = new Set<PauseMode>(['pause', 'continuous']);
const VALID_VOICE_PLAY_MODES = new Set<VoicePlayMode>(['before', 'over']);
const VALID_DETAIL_LENGTHS = new Set<DetailLength>(['short', 'long']);

function normalizeEnum<T extends string>(
    value: unknown,
    validValues: ReadonlySet<T>,
    fallback: T
): T {
    return typeof value === 'string' && validValues.has(value as T)
        ? (value as T)
        : fallback;
}

export function normalizePlaybackMethod(
    value: unknown,
    fallback: PlaybackMethod
): PlaybackMethod {
    return normalizeEnum(value, VALID_PLAYBACK_METHODS, fallback);
}

/**
 * Keeps the first occurrence of each valid voice. A missing/non-array value
 * uses the supplied fallback; an array containing no valid values remains
 * empty so callers can preserve their existing "no narration" semantics.
 */
export function normalizeSelectedVoices(
    values: readonly unknown[] | null | undefined,
    fallback: readonly VoicePart[] = []
): VoicePart[] {
    if (!Array.isArray(values)) return [...fallback];

    const seen = new Set<VoicePart>();
    const voices: VoicePart[] = [];

    for (const value of values) {
        const voice = typeof value === 'string' ? value.trim() : value;
        if (typeof voice === 'string' && VALID_VOICES.has(voice as VoicePart)) {
            const typedVoice = voice as VoicePart;
            if (!seen.has(typedVoice)) {
                seen.add(typedVoice);
                voices.push(typedVoice);
            }
        }
    }

    return voices;
}

export function normalizePlaybackOrder(
    value: unknown,
    fallback: PlaybackOrder
): PlaybackOrder {
    return normalizeEnum(value, VALID_PLAYBACK_ORDERS, fallback);
}

export function normalizePauseMode(
    value: unknown,
    fallback: PauseMode
): PauseMode {
    return normalizeEnum(value, VALID_PAUSE_MODES, fallback);
}

export function normalizeSkipPlayed(value: unknown, fallback: boolean): boolean {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return fallback;
}

export function normalizeVoicePlayMode(
    value: unknown,
    fallback: VoicePlayMode
): VoicePlayMode {
    return normalizeEnum(value, VALID_VOICE_PLAY_MODES, fallback);
}

export function normalizeDetailLength(
    value: unknown,
    fallback: DetailLength
): DetailLength {
    return normalizeEnum(value, VALID_DETAIL_LENGTHS, fallback);
}

export function narrationFlagsFromVoices(
    voices: readonly VoicePart[]
): NarrationFlags {
    return {
        playIntro: voices.includes('intro'),
        playDetail: voices.includes('detail'),
        playArtistDescription: voices.includes('artist')
    };
}
