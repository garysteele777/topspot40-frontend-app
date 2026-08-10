// src/lib/api/playbackApi.ts

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function fetchPlaybackStatus(): Promise<Response> {
    return fetch(`${API_BASE}/playback/status`, {
        credentials: 'include'
    });
}

export async function signalNarrationFinishedApi(
    playbackSessionId: string,
    phase: string
): Promise<void> {
    await fetch(`${API_BASE}/playback/narration-finished`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            playbackSessionId,
            phase
        })
    });
}

export async function signalTrackFinishedApi(payload: {
    rankingId: number | null;
    spotifyTrackId: string | null;
}): Promise<void> {
    await fetch(`${API_BASE}/playback/track-finished`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            ranking_id: payload.rankingId,
            spotify_track_id: payload.spotifyTrackId
        })
    });
}

export async function stopPlaybackApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/stop`, {
        method: 'POST',
        credentials: 'include'
    });
}
