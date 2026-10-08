import type {FavoritesPlaybackScope} from './playback';

type FavoritesPreferences = {
    voices: string[];
    playbackOrder: string;
    voicePlayMode: string;
    pauseMode: string;
};

export function favoritesPlaybackUrl(
    scope: FavoritesPlaybackScope,
    language: string,
    preferences: FavoritesPreferences
): string {
    const family = scope.program === 'DG' ? 'nostalgia' : 'collections';
    const params = new URLSearchParams({
        programType: scope.program === 'DG' ? 'FAVORITES_DG' : 'FAVORITES_COL',
        language, languages: language,
        voices: preferences.voices.join(','),
        playbackOrder: preferences.playbackOrder,
        voicePlayMode: preferences.voicePlayMode,
        pauseMode: preferences.pauseMode,
        // Previously played tracks are still eligible as favorites.
        skipPlayed: 'false',
        returnTo: `/journey-prototype/choose?program=${family}&browse=${family}`
    });
    if (scope.program === 'DG') {
        params.set('decade', scope.decade ?? 'ALL');
        params.set('genre', scope.genre ?? 'ALL');
    } else {
        params.set('collection_group', scope.collectionGroup ?? 'ALL');
        if (scope.collectionSlug) params.set('collection', scope.collectionSlug);
    }
    return `/car-page?${params}`;
}
