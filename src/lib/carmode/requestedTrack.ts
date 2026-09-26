import type {CarModeTrack} from '$lib/carmode/CarMode.store';

export const REQUESTED_TRACK_ID_PARAM = 'requestTrackId';

/**
 * Resolves the optional, one-time request carried into a new Car Mode visit.
 * The underlying program sequence stays untouched; this track is placed in
 * the request queue and playback resumes the normal sequence afterward.
 */
export function requestedTrackFromId(
    availableTracks: CarModeTrack[],
    rawTrackId: string | null
): CarModeTrack | null {
    if (!rawTrackId || !/^\d+$/.test(rawTrackId)) return null;

    const trackId = Number(rawTrackId);
    return availableTracks.find(track => Number(track.id) === trackId) ?? null;
}
