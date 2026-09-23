// src/lib/api/playbackApi.ts

import {backendUrl} from '$lib/api/backendBase';

/**
 * Playback APIs are cross-origin in local development (5173 -> 8000). Keep
 * the guest-session cookie attached to every request that reads or mutates a
 * playback runtime, rather than relying on fetch's same-origin default.
 */
export function fetchPlaybackApi(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(backendUrl(path), {
        ...init,
        credentials: 'include'
    });
}

export async function fetchPlaybackStatus(): Promise<Response> {
    return fetchPlaybackApi('/playback/status');
}

export async function signalNarrationFinishedApi(
    playbackSessionId: string,
    phase: string
): Promise<Response> {
    return fetchPlaybackApi('/playback/narration-finished', {
        method: 'POST',
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
}): Promise<Response> {
    return fetchPlaybackApi('/playback/track-finished', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            ranking_id: payload.rankingId,
            spotify_track_id: payload.spotifyTrackId
        })
    });
}

export async function stopPlaybackApi(signal?: AbortSignal): Promise<void> {
    await fetchPlaybackApi('/playback/stop', {
        method: 'POST',
        signal
    });
}

export async function startGuestPlaybackSession(): Promise<Response> {
    return fetchPlaybackApi('/playback/guest-session', {
        method: 'POST'
    });
}

export async function startRadioSequence(params: URLSearchParams): Promise<Response> {
    return fetchPlaybackApi(`/supabase/decade-genre/play-sequence?${params.toString()}`);
}

export type RadioNarrationDetailLength = 'off' | 'short' | 'long';

export async function updateRadioNarrationPolicy(payload: {
    detailLength: RadioNarrationDetailLength;
    artistStoriesEnabled: boolean;
}): Promise<Response> {
    return fetchPlaybackApi('/supabase/decade-genre/radio-narration-policy', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            detail_length: payload.detailLength,
            artist_stories_enabled: payload.artistStoriesEnabled
        })
    });
}

export async function resetPlaybackApi(): Promise<Response> {
    return fetchPlaybackApi('/playback/reset', {
        method: 'POST'
    });
}

export async function sendPlaybackDiagnostic(payload: Record<string, unknown>): Promise<Response> {
    return fetchPlaybackApi('/playback/client-diagnostic', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
}
