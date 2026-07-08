// src/lib/api/playbackApi.ts

const API_BASE =
    import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export type SpotifyDevice = {
    id: string;
    is_active?: boolean;
    name?: string;
};

export type PlaybackWarmupResponse =
    | {
        ready: true;
        device_id?: string;
        device_name?: string;
        volume?: number;
    }
    | {
        ready: false;
        reason?: string;
        message: string;
    };

export async function fetchPlaybackStatus(): Promise<Response> {
    return fetch(`${API_BASE}/playback/status`, {
        credentials: 'include'
    });
}

export async function warmupPlaybackApi(): Promise<PlaybackWarmupResponse> {
    try {
        const res = await fetch(`${API_BASE}/playback/warmup`, {
            method: 'POST',
            credentials: 'include'
        });

        const data = await res.json().catch(() => null);

        if (data?.ready === true) {
            return {
                ready: true,
                device_id: data.device_id,
                device_name: data.device_name,
                volume: data.volume
            };
        }

        return {
            ready: false,
            reason: typeof data?.reason === 'string' ? data.reason : undefined,
            message:
                typeof data?.message === 'string' && data.message.length > 0
                    ? data.message
                    : 'Open Spotify on a device to continue.'
        };
    } catch {
        return {
            ready: false,
            reason: 'request_failed',
            message: 'Unable to check Spotify readiness. Open Spotify on a device and try again.'
        };
    }
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
    await fetch(`${API_BASE}/playback/transfer/${encodeURIComponent(deviceId)}`, {
        method: 'POST',
        credentials: 'include'
    });
}

export async function playSpotifyTrackApi(spotifyTrackId: string, deviceId?: string): Promise<void> {
    const body: { spotify_track_id: string; device_id?: string } = {
        spotify_track_id: spotifyTrackId
    };

    if (deviceId) {
        body.device_id = deviceId;
    }

    await fetch(`${API_BASE}/playback/play-spotify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

export async function signalTrackFinishedApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/track-finished`, {
        method: 'POST',
        credentials: 'include'
    });
}

export async function stopPlaybackApi(): Promise<void> {
    await fetch(`${API_BASE}/playback/stop`, {
        method: 'POST',
        credentials: 'include'
    });
}
