import type {AudioKey} from '$lib/utils/normalizeTrack';

export const SUPABASE_PUBLIC_AUDIO_BASE =
    'https://iizlnzmmhkzedqkolgir.supabase.co/storage/v1/object/public';

export type SequenceNarrationTrack = {
    rank: number;
    spotifyTrackId?: string | null;
    decadeSlug?: string | null;
    genreSlug?: string | null;
    introUrl?: string | null;
    detailUrl?: string | null;
    shortDetailUrl?: string | null;
    introKey?: AudioKey | null;
    detailKey?: AudioKey | null;
    shortDetailKey?: AudioKey | null;
};

export type SequenceNarrationUrls = {
    intro: string | null;
    detail: string | null;
    detailFallback: string | undefined;
};

function nonEmptyUrl(value: string | null | undefined): string | null {
    return typeof value === 'string' && value.trim() ? value : null;
}

export function publicAudioUrl(
    audioKey: AudioKey | null | undefined
): string | null {
    if (!audioKey?.bucket || !audioKey.key) return null;

    return `${SUPABASE_PUBLIC_AUDIO_BASE}/${audioKey.bucket}/${audioKey.key}`;
}

function languageBucket(language: string): string {
    return language === 'ptbr' ? 'audio-ptbr' : `audio-${language}`;
}

function legacyIntroUrl(track: SequenceNarrationTrack, language: string): string | null {
    if (!track.decadeSlug || !track.genreSlug || !track.rank) return null;

    const rank = String(track.rank).padStart(2, '0');
    // This matches the backend's canonical decade/genre intro convention.  Do
    // not replace the separator with an underscore: genre slugs may contain
    // underscores, but the decade/genre boundary is a hyphen.
    return `${SUPABASE_PUBLIC_AUDIO_BASE}/${languageBucket(language)}/intro/` +
        `${track.decadeSlug}-${track.genreSlug}_${rank}.mp3`;
}

function legacyDetailUrl(
    track: SequenceNarrationTrack,
    language: string,
    folder: 'detail' | 'short-detail'
): string | null {
    if (!track.spotifyTrackId) return null;
    return `${SUPABASE_PUBLIC_AUDIO_BASE}/${languageBucket(language)}/${folder}/${track.spotifyTrackId}.mp3`;
}

export function resolveSequenceNarrationUrls(
    track: SequenceNarrationTrack,
    language: string,
    detailLength: 'long' | 'short'
): SequenceNarrationUrls {
    const wantsLong = detailLength === 'long';
    const primaryUrl = wantsLong ? track.detailUrl : track.shortDetailUrl;
    const fallbackUrl = wantsLong ? track.shortDetailUrl : track.detailUrl;
    const primaryKey = wantsLong ? track.detailKey : track.shortDetailKey;
    const fallbackKey = wantsLong ? track.shortDetailKey : track.detailKey;
    const primaryFolder = wantsLong ? 'detail' : 'short-detail';
    const fallbackFolder = wantsLong ? 'short-detail' : 'detail';

    return {
        // URLs from get-sequence are authoritative (and may be signed).
        intro:
            nonEmptyUrl(track.introUrl) ??
            publicAudioUrl(track.introKey) ??
            legacyIntroUrl(track, language),
        detail:
            nonEmptyUrl(primaryUrl) ??
            publicAudioUrl(primaryKey) ??
            legacyDetailUrl(track, language, primaryFolder),
        detailFallback:
            nonEmptyUrl(fallbackUrl) ??
            publicAudioUrl(fallbackKey) ??
            legacyDetailUrl(track, language, fallbackFolder) ??
            undefined
    };
}
