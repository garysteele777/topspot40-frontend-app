// src/lib/helpers/catalogLoader.ts
// ------------------------------------------------------------
// REAL CATALOG LOADER (for Options page)
// ------------------------------------------------------------

import type { GroupedCatalog } from '$lib/api/catalog';

// Fetch catalog from backend
export async function loadCatalog(): Promise<GroupedCatalog> {
  const res = await fetch('/api/supabase/grouped-catalog');

  if (!res.ok) {
    throw new Error(`❌ Failed to load catalog: ${res.status}`);
  }

  return (await res.json()) as GroupedCatalog;
}

// Re-export track loader for backward compatibility
export { loadTrackSequence } from '$lib/helpers/trackSequenceLoader';

// Optional legacy type — safe to keep
export type SequenceItem = {
  rank: number;

  trackName?: string;
  track_name?: string;
  title?: string;

  artistName?: string;
  artist_name?: string;
  artist_display_name?: string;

  albumName?: string;
  album_name?: string;

  albumArtwork?: string | null;
  album_artwork?: string | null;
  album_image_url?: string | null;

  yearReleased?: number | null;
  year_released?: number | null;
  release_year?: number | null;

  durationMs?: number | null;
  duration_ms?: number | null;

  spotifyTrackId?: string | null;
  spotify_id?: string | null;
  track_spotify_id?: string | null;

  intro?: string | null;
  info?: string | null;

  detail?: string | null;
  detail_text?: string | null;

  artistDescription?: string | null;
  artist_detail?: string | null;

  artist_artwork?: string | null;
  artistArtwork?: string | null;
  artist_image?: string | null;

  artistImage?: string | null;
};
