// src/lib/api/playbackApi.ts

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export type SpotifyDevice = {
    id: string;
    is_active?: boolean;
    name?: string;
};

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

export async function fetchSpotifyDevices(): Promise<SpotifyDevice[]> {
    const res = await fetch(`${API_BASE}/playback/devices`, {
        credentials: 'include'
    });

    if (!res.ok) {
        return [];
    }

    const data = await res.json().catch(() => null);
    return Array.isArray(data?.devices) ? data.devices : [];
}

export async function transferSpotifyPlayback(deviceId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/playback/transfer/${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        credentials: 'include'
    });

    if (!res.ok) {
        throw new Error(`Spotify transfer failed: ${res.status}`);
    }
}

export async function playSpotifyTrackApi(spotifyTrackId: string, deviceId?: string): Promise<void> {
    const body: { spotify_track_id: string; device_id?: string } = {
        spotify_track_id: spotifyTrackId
    };

    if (deviceId) {
        body.device_id = deviceId;
    }

    const res = await fetch(`${API_BASE}/playback/play-spotify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        throw new Error(`Spotify play failed: ${res.status}`);
    }
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
