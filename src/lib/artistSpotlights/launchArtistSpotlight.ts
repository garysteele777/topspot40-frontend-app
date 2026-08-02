import type {ArtistSpotlightLaunchSettings} from './types';

const ARTIST_SPOTLIGHTS_JOURNEY_PREFIX = '/journey-prototype/artist-spotlights';

export function isSafeArtistSpotlightsReturnPath(value: string | null): value is string {
    if (!value) return false;

    return (
        value === ARTIST_SPOTLIGHTS_JOURNEY_PREFIX ||
        value.startsWith(`${ARTIST_SPOTLIGHTS_JOURNEY_PREFIX}/`) ||
        value.startsWith(`${ARTIST_SPOTLIGHTS_JOURNEY_PREFIX}?`)
    );
}

export function buildArtistSpotlightJourneyLaunchUrl(
    settings: ArtistSpotlightLaunchSettings
): string {
    const query = new URLSearchParams({
        mode: 'artist_spotlight',
        artist_id: String(settings.artistId),
        artist: settings.artistName,
        genre: settings.genre,
        language: settings.language
    });

    if (isSafeArtistSpotlightsReturnPath(settings.returnTo ?? null)) {
        query.set('returnTo', settings.returnTo!);
    }

    return `/car-page?${query.toString()}`;
}
