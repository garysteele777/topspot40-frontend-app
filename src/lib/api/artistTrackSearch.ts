const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export type ArtistTrackResult = {
    track_id: number;
    title: string;
    artist: string;
    spotlight_artist: string;
    artist_code: string;
};

export async function findArtistsByTrack(query: string, signal?: AbortSignal): Promise<ArtistTrackResult[]> {
    const response = await fetch(`${API_BASE}/api/catalog/songs/search?q=${encodeURIComponent(query.trim())}`, {
        headers: {Accept: 'application/json'}, signal
    });
    if (!response.ok) throw new Error('Track search unavailable');
    const payload: {songs: ArtistTrackResult[]} = await response.json();
    return payload.songs;
}
