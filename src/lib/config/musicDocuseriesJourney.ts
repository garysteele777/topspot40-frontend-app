import type {MusicDocuseriesCollection} from '$lib/musicDocuseries/types';

export const MUSIC_DOCUSERIES_ACCENT = '#d7a64a';
export const MUSIC_DOCUSERIES_JOURNEY_ARTWORK = '/images/journey/03-ai-listening-library-road.png';
export const MUSIC_DOCUSERIES_FALLBACK_ARTWORK = '/default_album.png';

type DocumentaryPresentation = {accent:string; kicker:string; description?:string};

const COLLECTION_PRESENTATION: Record<string, DocumentaryPresentation> = {
    latin_america_and_caribbean: {accent:'#e2a64e',kicker:'Influential regional music',description:'Discover influential music from Latin America and the Caribbean and the cultural forces that carried it around the world.'},
    latin_america_caribbean: {accent:'#d7a64a',kicker:'Movements and traditions',description:'Explore the movements and traditions of Latin America and the Caribbean through the stories behind their music.'}
};

const DEFAULT_PRESENTATION: DocumentaryPresentation = {accent:MUSIC_DOCUSERIES_ACCENT,kicker:'A TopSpot40 documentary series'};

export function musicDocuseriesCollectionPresentation(slug:string): DocumentaryPresentation {
    return COLLECTION_PRESENTATION[slug] ?? DEFAULT_PRESENTATION;
}

export function musicDocuseriesCollectionDescription(collection:MusicDocuseriesCollection): string {
    return musicDocuseriesCollectionPresentation(collection.slug).description ?? collection.description ?? `Explore the music history and stories featured in ${collection.name}.`;
}

export function formatTargetLength(value?:string|null): string|null {
    if (!value) return null;
    return value.replace(/[_-]+/g,' ').replace(/\b\w/g,character => character.toUpperCase());
}
