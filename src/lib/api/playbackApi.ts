// src/lib/api/playbackApi.ts

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function fetchPlaybackStatus(): Promise<Response> {
    return fetch(`${API_BASE}/playback/status`);
}

export async function signalNarrationFinishedApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/narration-finished`, { method: 'POST' });
}

export async function playSpotifyTrackApi(spotifyTrackId: string): Promise<void> {
    await fetch(`${API_BASE}/playback/play-spotify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spotify_track_id: spotifyTrackId })
    });
}

export async function signalTrackFinishedApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/track-finished`, { method: 'POST' });
}

export async function stopPlaybackApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/stop`, { method: 'POST' });
}