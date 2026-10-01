import type {MusicDocuseriesCollection, MusicDocuseriesStory} from './types';
import {buildDocuseriesQueue} from './groupPlayback';
import {writable} from 'svelte/store';

export const docuseriesCatalogStore = writable<Record<string, MusicDocuseriesStory[]>>({});
const storyRequests = new Map<string, Promise<MusicDocuseriesStory[]>>();

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function loadMusicDocuseriesCollections(): Promise<MusicDocuseriesCollection[]> {
    const response = await fetch(`${API_BASE}/music-docuseries/collections`);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const data: unknown = await response.json();
    return Array.isArray(data) ? data as MusicDocuseriesCollection[] : [];
}

export async function loadMusicDocuseriesStories(
    collectionSlug: string
): Promise<MusicDocuseriesStory[]> {
    if (storyRequests.has(collectionSlug)) return storyRequests.get(collectionSlug)!;
    const request = fetchMusicDocuseriesStories(collectionSlug);
    storyRequests.set(collectionSlug, request);
    try { return await request; }
    catch (error) { storyRequests.delete(collectionSlug); throw error; }
}

async function fetchMusicDocuseriesStories(collectionSlug: string): Promise<MusicDocuseriesStory[]> {
    const response = await fetch(
        `${API_BASE}/music-docuseries/items?collection_slug=${encodeURIComponent(collectionSlug)}`
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const data: unknown = await response.json();
    const stories = Array.isArray(data) ? buildDocuseriesQueue(data as MusicDocuseriesStory[], 'all', {}) : [];
    docuseriesCatalogStore.update(value => ({...value, [collectionSlug]: stories}));
    return stories;
}

export function findMusicDocuseriesCollection(
    collections: MusicDocuseriesCollection[],
    slug: string
): MusicDocuseriesCollection | null {
    return collections.find(collection => collection.slug === slug) ?? null;
}

export function findMusicDocuseriesStory(
    stories: MusicDocuseriesStory[],
    slug: string
): MusicDocuseriesStory | null {
    return stories.find(story => story.slug === slug) ?? null;
}
