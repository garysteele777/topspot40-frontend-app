import type {ProgramHistory} from '../carmode/programHistory';
import type {FavoritesStore} from '../favorites/favorites';

export const nostalgiaDecades = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'];
export const nostalgiaGenres = [
    {slug: 'country', label: 'Country'}, {slug: 'pop', label: 'Pop'},
    {slug: 'rock', label: 'Rock'}, {slug: 'rnb_soul', label: 'R&B / Soul'},
    {slug: 'latin_global', label: 'Latin / Global'}, {slug: 'blues_jazz', label: 'Blues / Jazz'},
    {slug: 'folk_acoustic', label: 'Folk / Acoustic'}, {slug: 'tv_themes', label: 'TV Themes'}
];
export type NostalgiaScope = {decade: string; genre: string};
export function nostalgiaGroups(scope: NostalgiaScope): string[] {
    if (scope.decade !== 'ALL' && !nostalgiaDecades.includes(scope.decade)) return [];
    if (scope.genre !== 'ALL' && !nostalgiaGenres.some(g => g.slug === scope.genre)) return [];
    return nostalgiaDecades.filter(d => scope.decade === 'ALL' || d === scope.decade)
        .flatMap(d => nostalgiaGenres.filter(g => scope.genre === 'ALL' || g.slug === scope.genre)
            .map(g => `${d}|${g.slug}`));
}
export function nostalgiaCounts(history: ProgramHistory[], favorites: FavoritesStore, groups: string[]) {
    const keys = new Set(groups.map(g => `DG|${g}`));
    const rows = history.filter(h => keys.has(h.key));
    return {programs: groups.length,
        played: rows.reduce((n, h) => n + h.playedRanks.length, 0),
        favorites: groups.reduce((n, g) => n + (favorites.DG[g]?.length ?? 0), 0)};
}
/** Clear played markers, retaining catalog totals and every other program. */
export function clearNostalgiaHistory(history: ProgramHistory[], groups: string[]): ProgramHistory[] {
    const keys = new Set(groups.map(g => `DG|${g}`));
    return history.map(h => keys.has(h.key) ? {...h, playedRanks: []} : h);
}
/** Remove only selected source lists, without mutating either category. */
export function clearNostalgiaFavorites(data: FavoritesStore, groups: string[]): FavoritesStore {
    const DG = {...data.DG};
    for (const group of groups) delete DG[group];
    return {...data, DG};
}
