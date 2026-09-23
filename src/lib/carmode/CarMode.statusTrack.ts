import type {PlaybackPhase} from '$lib/helpers/car/types';

export type PlaybackStatusTrackIdentity = {
    phase: PlaybackPhase;
    spotifyId: string | null;
    currentRank: number;
    rankingId: number | null;
};

/** Read the public `/playback/status` naming contract, including Collections. */
export function playbackStatusTrackIdentity(data: unknown): PlaybackStatusTrackIdentity {
    const status = data && typeof data === 'object'
        ? data as Record<string, unknown>
        : {};
    const context = status.context && typeof status.context === 'object'
        ? status.context as Record<string, unknown>
        : {};
    const rawRankingId = context.ranking_id ??
        context.track_ranking_id ?? context.collection_ranking_id;
    const rankingId = rawRankingId == null ? null : Number(rawRankingId);
    const rawRank = status.current_rank ?? status.rank ?? 0;

    return {
        phase: typeof status.phase === 'string' ? status.phase as PlaybackPhase : 'idle',
        spotifyId: typeof context.spotify_track_id === 'string'
            ? context.spotify_track_id
            : null,
        currentRank: Number(rawRank) || 0,
        rankingId: Number.isFinite(rankingId) ? rankingId : null
    };
}

export function shouldDispatchSpotifyTrack(
    phase: PlaybackPhase,
    spotifyId: string | null,
    guidedLinkOut: boolean,
    lastDispatchedSpotifyId: string | null
): boolean {
    return phase === 'track' &&
        Boolean(spotifyId) &&
        guidedLinkOut &&
        lastDispatchedSpotifyId !== spotifyId;
}
