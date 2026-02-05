// src/lib/types/tracks.ts

export interface PreviewTrack {
  rank: number;
  trackName: string;
  artistName: string;
  albumArtwork?: string | null;
}

export interface Track {
  track_name: string;
  album_name: string;
  album_artwork: string;
  artist_name: string;
  featured_artist: string;
  artist_display_name: string;
  artist_artwork: string;
  artist_description: string;
  rank: number;
  decade_name: string;
  genre_name: string;
  year_released: number;
  duration_ms: number;
  spotify_track_id: string;
  spotify_artist_id: string;
  track_intro: string;
  track_detail: string;
  language?: string;
}
