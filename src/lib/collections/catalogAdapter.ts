import {loadCatalogOnce} from '$lib/stores/loadCatalogOnce';
import {loadTrackSequence} from '$lib/helpers/trackSequenceLoader';
import {resolvePresentation} from '$lib/config/collectionsJourney';
import {PROGRAM_TYPES} from '$lib/types/program';
import type {Language} from '$lib/types/playback';
import type {SelectionState} from '$lib/stores/selection';
import type {
    CollectionTrackPreview,
    JourneyCollection,
    JourneyCollectionGroup
} from './types';

const EXCLUDED_COLLECTION_GROUP_SLUGS = new Set(['music_docuseries']);

export async function loadCollectionsJourneyCatalog(): Promise<JourneyCollectionGroup[]> {
    const catalog = await loadCatalogOnce();

    return (catalog.collectionGroups ?? [])
        .filter((group) => !EXCLUDED_COLLECTION_GROUP_SLUGS.has(group.slug))
        .map((group: {
            name: string;
            slug: string;
            items?: {
                id: string | number;
                name: string;
                slug: string;
                totalTracks?: number;
            }[];
        }) => {
            const items: JourneyCollection[] = (group.items ?? []).map((item) => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
                totalTracks: Number(item.totalTracks ?? 0),
                presentation: resolvePresentation(item.slug, item.name, 'collection')
            }));

            return {
                name: group.name,
                slug: group.slug,
                items,
                totalTracks: items.reduce((sum, item) => sum + item.totalTracks, 0),
                presentation: resolvePresentation(group.slug, group.name, 'group')
            };
        });
}

export function findCollectionGroup(
    groups: JourneyCollectionGroup[],
    groupSlug: string
): JourneyCollectionGroup | null {
    return groups.find((group) => group.slug === groupSlug) ?? null;
}

export function findCollectionInGroup(
    group: JourneyCollectionGroup,
    collectionSlug: string
): JourneyCollection | null {
    return group.items.find((collection) => collection.slug === collectionSlug) ?? null;
}

export async function loadCollectionTrackPreview(params: {
    groupSlug: string;
    collectionSlug: string;
    language: Language;
}): Promise<CollectionTrackPreview[]> {
    const selection: SelectionState = {
        programType: PROGRAM_TYPES.PROGRAM_COL,
        mode: 'collection',
        language: params.language,
        languages: [params.language],
        context: {
            collection_slug: params.collectionSlug,
            collection_group_slug: params.groupSlug
        },
        startRank: 1,
        endRank: 9999,
        currentRank: 1,
        playIntro: true,
        playDetail: false,
        playArtistDescription: false,
        textIntro: false,
        textDetail: false,
        textArtistDescription: false,
        voices: ['intro'],
        playbackOrder: 'up',
        voicePlayMode: 'before',
        pauseMode: 'pause',
        categoryMode: 'single',
        skipPlayed: false
    };

    const tracks = await loadTrackSequence(selection);

    return tracks.map((track) => ({
        rankingId: track.rankingId,
        rank: track.rank ?? 0,
        trackName: track.trackName ?? '',
        artistName: track.artistName ?? ''
    }));
}

