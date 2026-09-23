import {saveResumeFromLocal} from '$lib/options/saveResumeFromLocal';
import type {
    Language,
    PauseMode,
    PlaybackOrder,
    VoicePart,
    VoicePlayMode
} from '$lib/types/playback';

export type CollectionLaunchSettings = {
    groupSlug: string;
    collectionSlug: string;
    language: Language;
    languages: Language[];
    voices: VoicePart[];
    playbackOrder: PlaybackOrder;
    voicePlayMode: VoicePlayMode;
    pauseMode: PauseMode;
    skipPlayed: boolean;
    totalTracks: number;
    returnTo: string;
};

const COLLECTIONS_JOURNEY_PREFIX = '/journey-prototype/collections';

export function isSafeCollectionsReturnPath(value: string | null): value is string {
    if (!value) return false;

    return (
        value === COLLECTIONS_JOURNEY_PREFIX ||
        value.startsWith(`${COLLECTIONS_JOURNEY_PREFIX}/`) ||
        value.startsWith(`${COLLECTIONS_JOURNEY_PREFIX}?`)
    );
}

export function buildCollectionJourneyLaunchUrl(
    settings: CollectionLaunchSettings
): string {
    const endRank = settings.totalTracks > 0 ? settings.totalTracks : 9999;

    saveResumeFromLocal({
        activeGroup: 'collection',
        context: {
            collection_slug: settings.collectionSlug,
            collection_group_slug: settings.groupSlug
        },
        language: settings.language,
        languages: settings.languages,
        startRank: 1,
        endRank,
        playbackOrder: settings.playbackOrder,
        pauseMode: settings.pauseMode,
        voices: settings.voices,
        skipPlayed: settings.skipPlayed
    });

    const query = new URLSearchParams({
        mode: 'collection',
        collection: settings.collectionSlug,
        collection_group: settings.groupSlug,
        language: settings.language,
        languages: settings.languages.join(','),
        voices: settings.voices.join(','),
        playbackOrder: settings.playbackOrder,
        voicePlayMode: settings.voicePlayMode,
        pauseMode: settings.pauseMode,
        skipPlayed: String(settings.skipPlayed)
    });

    if (isSafeCollectionsReturnPath(settings.returnTo)) {
        query.set('returnTo', settings.returnTo);
    }

    return `/car-page?${query.toString()}`;
}
