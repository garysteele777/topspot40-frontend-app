import type {ProgramKey} from '$lib/carmode/programHistory';

export function buildProgramKey(
    activeGroup: 'decade_genre' | 'collection',
    decades: string[],
    genres: string[],
    collections: string[],
    collectionCategory?: string   // 👈 ADD THIS
): ProgramKey {

    if (activeGroup === 'decade_genre') {
        return `DG|${decades[0] ?? ''}|${genres[0] ?? ''}` as ProgramKey;
    }

    return `COL|${collections[0] ?? ''}|${collectionCategory ?? ''}` as ProgramKey;
}

function prettyGenre(slug: string): string {
    return slug
        .replaceAll('_', ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function buildProgramLabel(
    activeGroup: 'decade_genre' | 'collection',
    decades: string[],
    genres: string[],
    collections: string[],
    favoritesGroup?: string
) {
    if (activeGroup === 'decade_genre') {

        const decade = decades[0] ?? '—';
        const genreSlug = genres[0] ?? '';
        const genre = prettyGenre(genreSlug);

        if (favoritesGroup) {
            return `${decade} ${genre} Favorites`;
        }

        return `${decade} • ${genre}`;
    }

    return `${collections[0] ?? '—'}`;
}

export function getTotalTracks(startRank: number, endRank: number) {
    return Math.max(0, endRank - startRank + 1);
}