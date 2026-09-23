import type {ArtistSpotlightCategory} from '$lib/artistSpotlights/types';

export const ARTIST_SPOTLIGHTS_JOURNEY_ARTWORK =
    '/images/journey/03-ai-listening-library-road.png';

export const ARTIST_SPOTLIGHTS_ACCENT = '#f0ba63';
export const ARTIST_SPOTLIGHT_FALLBACK_ARTWORK = '/default_album.png';

export const ARTIST_CATEGORY_PRESENTATION: Record<
    ArtistSpotlightCategory,
    {icon: string; label: string; description: string}
> = {
    featured: {
        icon: '★',
        label: 'Featured Artists',
        description: 'Artists with a featured TopSpot40 story and multi-track program.'
    },
    other: {
        icon: '♪',
        label: 'Other Artists',
        description: 'Explore multi-track Artist Spotlight programs across the catalog.'
    },
    single: {
        icon: '1',
        label: 'Single Track Artists',
        description: 'Discover artists represented by one track in the TopSpot40 library.'
    }
};

export function artistSpotlightDescription(artistName: string): string {
    return `Explore the music and available TopSpot40 stories of ${artistName}.`;
}
