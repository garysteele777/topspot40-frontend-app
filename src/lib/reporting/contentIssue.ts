import type {CarModeTrack} from '$lib/carmode/CarMode.store';
import type {SelectionState} from '$lib/stores/selection';

export const CONTENT_ISSUE_TYPES = [
    'wrong_spotify_track',
    'intro_content',
    'detail_content',
    'artist_bio_content',
    'audio_narration',
    'translation_language',
    'playback_controls',
    'other'
] as const;

export type ContentIssueType = typeof CONTENT_ISSUE_TYPES[number];
export type ReportDeviceType = 'mobile' | 'tablet' | 'desktop';

/** Safe, stable context captured when a user opens Report a Problem. */
export interface ContentIssueContext {
    track_id: string | number | null;
    ranking_id: number | null;
    expected_track_name: string | null;
    expected_artist_name: string | null;
    spotify_track_id: string | null;
    spotify_url: string | null;
    experience_mode: string | null;
    program_type: string | null;
    program_context: Record<string, string> | null;
    track_position: number | null;
    playback_phase: string | null;
    selected_language: string | null;
    playback_mode: string | null;
    device_type: ReportDeviceType;
    page_route: string;
    client_timestamp: string;
}

export function getReportDeviceType(): ReportDeviceType {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 700) return 'mobile';
    if (width < 1024 || navigator.maxTouchPoints > 0) return 'tablet';
    return 'desktop';
}

export function buildContentIssueContext(input: {
    track: CarModeTrack;
    selection: SelectionState | null;
    playbackPhase: string | null;
    playbackMode: string | null;
    deviceType: ReportDeviceType;
    route: string;
    timestamp: string;
}): ContentIssueContext {
    const {
        track,
        selection,
        playbackPhase,
        playbackMode,
        deviceType,
        route,
        timestamp
    } = input;
    const spotifyTrackId = track.spotifyTrackId ?? null;
    const programContext = selection?.context ? {...selection.context} : null;

    return Object.freeze({
        track_id: track.id ?? null,
        ranking_id: track.rankingId ?? null,
        expected_track_name: track.trackName ?? null,
        expected_artist_name: track.artistName ?? null,
        spotify_track_id: spotifyTrackId,
        spotify_url: spotifyTrackId
            ? `https://open.spotify.com/track/${spotifyTrackId}`
            : null,
        experience_mode: selection?.mode ?? null,
        program_type: selection?.programType ?? null,
        program_context: programContext ? Object.freeze(programContext) : null,
        track_position: track.rank ?? null,
        playback_phase: playbackPhase,
        selected_language: selection?.language ?? null,
        playback_mode: playbackMode,
        device_type: deviceType,
        page_route: route,
        client_timestamp: timestamp
    });
}
