// src/lib/api/playbackApi.ts

import {backendUrl} from '$lib/api/backendBase';

export async function fetchPlaybackStatus(): Promise<Response> {
    return fetch(backendUrl('/playback/status'), {
        credentials: 'include'
    });
}

export async function signalNarrationFinishedApi(
    playbackSessionId: string,
    phase: string
): Promise<void> {
    await fetch(backendUrl('/playback/narration-finished'), {
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
}): Promise<Response> {
    return fetch(backendUrl('/playback/track-finished'), {
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
    await fetch(backendUrl('/playback/stop'), {
        method: 'POST',
        credentials: 'include'
    });
}

export async function startGuestPlaybackSession(): Promise<Response> {
    return fetch(backendUrl('/playback/guest-session'), {
        method: 'POST', credentials: 'include'
    });
}

export async function startRadioSequence(params: URLSearchParams): Promise<Response> {
    return fetch(backendUrl(`/supabase/decade-genre/play-sequence?${params.toString()}`), {
        credentials: 'include'
    });
}

export async function resetPlaybackApi(): Promise<Response> {
    return fetch(backendUrl('/playback/reset'), {
        method: 'POST', credentials: 'include'
    });
}

export async function sendPlaybackDiagnostic(payload: Record<string, unknown>): Promise<Response> {
    return fetch(backendUrl('/playback/client-diagnostic'), {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
}
