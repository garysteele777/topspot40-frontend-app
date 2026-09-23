import type {Language} from '$lib/types/playback';

export type LocalizedCollectionCopy = Partial<Record<Language, string>> & {
    en: string;
};

export type CollectionPresentation = {
    description: LocalizedCollectionCopy;
    accent: string;
    icon: string;
    artwork?: string;
};

export type JourneyCollection = {
    id: string | number;
    name: string;
    slug: string;
    totalTracks: number;
    presentation: CollectionPresentation;
};

export type JourneyCollectionGroup = {
    name: string;
    slug: string;
    items: JourneyCollection[];
    totalTracks: number;
    presentation: CollectionPresentation;
};

export type CollectionTrackPreview = {
    rankingId?: number | null;
    rank: number;
    trackName: string;
    artistName: string;
};

