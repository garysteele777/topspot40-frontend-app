import type {MusicDocuseriesCollection} from '$lib/musicDocuseries/types';

export const MUSIC_DOCUSERIES_ACCENT = '#d7a64a';
export const MUSIC_DOCUSERIES_JOURNEY_ARTWORK = '/images/journey/03-ai-listening-library-road.png';
export const MUSIC_DOCUSERIES_FALLBACK_ARTWORK = '/default_album.png';

type DocumentaryPresentation = {accent:string; kicker:string; description?:string};

const COLLECTION_PRESENTATION: Record<string, DocumentaryPresentation> = {
    latin_america_and_caribbean: {accent:'#e2a64e',kicker:'Influential regional music',description:'Discover influential music from Latin America and the Caribbean and the cultural forces that carried it around the world.'},
};

const COLLECTION_ARTWORK: Record<string, string> = {
    history_eras: '/docuseries/history-eras-collection.png',
    movements_revolutions: '/docuseries/movements-revolutions-collection.png',
    legends_rivalries: '/docuseries/legends-rivalries-collection.png',
    songs_stories: '/docuseries/songs-stories-collection.png',
    mysteries_tragedies: '/docuseries/mysteries-tragedies-collection.png',
    modern_music_revolutions: '/docuseries/modern-music-revolutions-collection.png',
    people_behind_the_music: '/docuseries/the-people-behind-the-music.png',
    mexico_border: '/docuseries/mexico-and-the-border.png',
    latin_america_and_caribbean: '/docuseries/latin-america-and-the-caribbean.png',
    brazil_and_new_global_sounds: '/docuseries/brazil_and_new_global_sounds.png',
    beyond_the_music: '/docuseries/beyond_the_music.png',
    musical_instruments: '/docuseries/instruments_that_changed_music.png',
    modern_music_listening: '/docuseries/modern_music_and_listening.png',
    foundations_technology_events: '/docuseries/foundations_technology_events.png'
};

export function musicDocuseriesCollectionArtwork(slug: string): string {
    return COLLECTION_ARTWORK[slug] ?? MUSIC_DOCUSERIES_FALLBACK_ARTWORK;
}

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
