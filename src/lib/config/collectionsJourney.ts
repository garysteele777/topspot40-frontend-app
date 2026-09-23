import type {
    CollectionPresentation,
    LocalizedCollectionCopy
} from '$lib/collections/types';
import type {Language} from '$lib/types/playback';

type PresentationOverrides = Partial<Omit<CollectionPresentation, 'description'>> & {
    description?: LocalizedCollectionCopy;
};

const DEFAULT_ACCENT = '#75ef4f';

export const COLLECTIONS_JOURNEY_ARTWORK =
    '/images/journey/03-ai-listening-library-road.png';

export const GROUP_PRESENTATION_BY_SLUG: Record<string, PresentationOverrides> = {
    american_heritage_favorites: {
        icon: '🇺🇸',
        accent: '#d99a45',
        description: {
            en: 'Songs of American memory, travel, working life, folk heroes, railroads, western life, and shared national experience.'
        }
    },
    traditional_favorites: {
        icon: '🪕',
        accent: '#d6c17a',
        description: {
            en: 'Timeless hymns, gospel, bluegrass, cowboy songs, crooners, and classic American standards.'
        }
    },
    world_heritage_favorites: {
        icon: '🌎',
        accent: '#55c9a5',
        description: {
            en: 'Music celebrating cultural roots and global traditions from across the TopSpot40 library.'
        }
    },
    soft_rock_70s_90s: {
        icon: '🌅',
        accent: '#e7a36d',
        description: {
            en: 'Soft rock favorites from the 1970s through the 1990s, from road trips and yacht rock to enduring love songs.'
        }
    },
    music_trends: {
        icon: '📈',
        accent: '#ef6f61',
        description: {
            en: 'Popular movements, styles, and cultural moments including Motown, disco, dance anthems, power ballads, and one-hit wonders.'
        }
    },
    music_legends: {
        icon: '⭐',
        accent: '#f4d35e',
        description: {
            en: 'Defining recordings from legendary artists and performers across the major TopSpot genres.'
        }
    },
    stage_and_screen: {
        icon: '🎬',
        accent: '#b88cff',
        description: {
            en: 'Memorable songs and themes from movies, Broadway, Disney, television, and video games.'
        }
    },
    classical_music: {
        icon: '🎻',
        accent: '#8db8ff',
        description: {
            en: 'Curated classical selections organized around the Baroque, Classical, and Romantic periods.'
        }
    },
    specialty_mixes: {
        icon: '🎛️',
        accent: '#ff8fc7',
        description: {
            en: 'Specially curated themes, missing favorites, holidays, duets, novelty songs, and crossovers.'
        }
    }
};

// Collection-specific copy and artwork can be added here without changing routes
// or catalog data. Unlisted collections receive the centralized fallback below.
export const COLLECTION_PRESENTATION_BY_SLUG: Record<string, PresentationOverrides> = {};

function fallbackDescription(name: string): LocalizedCollectionCopy {
    return {
        en: `Explore the songs and stories in ${name}.`
    };
}

export function resolvePresentation(
    slug: string,
    name: string,
    kind: 'group' | 'collection'
): CollectionPresentation {
    const configured =
        kind === 'group'
            ? GROUP_PRESENTATION_BY_SLUG[slug]
            : COLLECTION_PRESENTATION_BY_SLUG[slug];

    return {
        description: configured?.description ?? fallbackDescription(name),
        accent: configured?.accent ?? DEFAULT_ACCENT,
        icon: configured?.icon ?? (kind === 'group' ? '🎶' : '🎵'),
        artwork: configured?.artwork
    };
}

export function localizedCollectionCopy(
    copy: LocalizedCollectionCopy,
    language: Language
): string {
    return copy[language] ?? copy.en;
}

