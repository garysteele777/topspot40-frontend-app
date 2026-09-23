import type {Language} from '$lib/types/playback';

export type MusicDocuseriesCollection = {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    sort_order: number;
};

export type MusicDocuseriesStory = {
    id: number;
    slug: string;
    title: string;
    short_description?: string | null;
    artwork_url?: string | null;
    target_length?: string | null;
    sort_order: number;
};

export type MusicDocuseriesLaunchSettings = {
    collectionSlug: string;
    storySlug: string;
    language: Language;
    returnTo?: string;
};
