import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {Language} from '$lib/types/playback';

const RETURN_PATH = '/car-page';
const CONTRACT_PARAM = 'carModePreferencesReturn';
const LANGUAGE_CHANGED_PARAM = 'carModeLanguageChanged';

export type CarModeTrackIdentity = Pick<
    CarModeTrack,
    'rankingId' | 'spotifyTrackId' | 'rank'
>;

export function buildCarModePreferencesUrl(
    currentUrl: URL,
    track: CarModeTrackIdentity | null
): string {
    const returnUrl = new URL(currentUrl.href);

    returnUrl.searchParams.set(CONTRACT_PARAM, '1');
    returnUrl.searchParams.delete('currentRankingId');
    returnUrl.searchParams.delete('currentSpotifyTrackId');
    returnUrl.searchParams.delete('currentRank');

    if (track) {
        returnUrl.searchParams.set('currentRank', String(track.rank));

        if (track.rankingId != null) {
            returnUrl.searchParams.set('currentRankingId', String(track.rankingId));
        }

        if (track.spotifyTrackId) {
            returnUrl.searchParams.set('currentSpotifyTrackId', track.spotifyTrackId);
        }
    }

    const preferencesUrl = new URL('/playback-preferences', currentUrl.origin);
    preferencesUrl.searchParams.set('returnTo', `${returnUrl.pathname}${returnUrl.search}`);
    return preferencesUrl.pathname + preferencesUrl.search;
}

export function getCarModePreferencesReturnUrl(
    preferencesUrl: URL
): URL | null {
    const rawReturnTo = preferencesUrl.searchParams.get('returnTo');
    if (!rawReturnTo) return null;

    const returnUrl = new URL(rawReturnTo, preferencesUrl.origin);

    if (
        returnUrl.origin !== preferencesUrl.origin ||
        returnUrl.pathname !== RETURN_PATH ||
        returnUrl.searchParams.get(CONTRACT_PARAM) !== '1'
    ) {
        return null;
    }

    return returnUrl;
}

export function buildCarModePreferencesReturnUrl(
    returnUrl: URL,
    language: Language
): string {
    const nextReturnUrl = new URL(returnUrl.href);

    // Only the language fields are changed; all selection and launch fields stay intact.
    nextReturnUrl.searchParams.set('language', language);
    nextReturnUrl.searchParams.set('languages', language);
    nextReturnUrl.searchParams.set(
        LANGUAGE_CHANGED_PARAM,
        String((returnUrl.searchParams.get('language') ?? 'en') !== language)
    );

    return nextReturnUrl.pathname + nextReturnUrl.search;
}

export function isChangedCarModePreferencesReturn(url: URL): boolean {
    return (
        url.pathname === RETURN_PATH &&
        url.searchParams.get(CONTRACT_PARAM) === '1' &&
        url.searchParams.get(LANGUAGE_CHANGED_PARAM) === 'true'
    );
}

export function isUnchangedCarModePreferencesReturn(url: URL): boolean {
    return (
        url.pathname === RETURN_PATH &&
        url.searchParams.get(CONTRACT_PARAM) === '1' &&
        url.searchParams.get(LANGUAGE_CHANGED_PARAM) === 'false'
    );
}

export function findReturnedCarModeTrack<T extends CarModeTrackIdentity>(
    availableTracks: T[],
    url: URL
): T | null {
    const rankingId = Number(url.searchParams.get('currentRankingId'));
    if (Number.isFinite(rankingId)) {
        const byRankingId = availableTracks.find(track => track.rankingId === rankingId);
        if (byRankingId) return byRankingId;
    }

    const spotifyTrackId = url.searchParams.get('currentSpotifyTrackId');
    if (spotifyTrackId) {
        const bySpotifyTrackId = availableTracks.find(
            track => track.spotifyTrackId === spotifyTrackId
        );
        if (bySpotifyTrackId) return bySpotifyTrackId;
    }

    const rank = Number(url.searchParams.get('currentRank'));
    if (Number.isFinite(rank)) {
        return availableTracks.find(track => track.rank === rank) ?? null;
    }

    return null;
}
