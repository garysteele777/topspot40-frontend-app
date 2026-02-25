// src/lib/carmode/startPlayback.ts
import { get } from 'svelte/store';
import {
  currentSelection,
  currentTrack,
  tracks
} from '$lib/carmode/CarMode.store';

import { updateTrack } from '$lib/carmode/CarMode.player';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export async function startPlayback() {
  const sel = get(currentSelection);
  if (!sel) return;

  // If user is already looking at a specific track, use that
  const track = get(currentTrack) ?? get(tracks)?.[0];
  if (!track) return;

  // ✅ Favorites: single-track playback for Step 1
  if (sel.programType === 'FAV_DG') {
    console.log('⭐ FAV_DG → backend single-track sequence (by rankingId)');

    if (track.rankingId == null) {
      console.warn('❌ Favorites playback requires track.rankingId but it is null');
      return;
    }

    const payload = {
      track: {
        // ✅ DB track id (optional but useful)
        track_id: track.id,
        // ✅ Spotify id needed for Spotify playback
        spotify_track_id: track.spotifyTrackId,
        // ✅ the key piece for favorites: TrackRanking.id
        ranking_id: track.rankingId,
        rank: track.rank,
        track_name: track.trackName,
        artist_name: track.artistName
      },
      selection: {
        language: sel.language,
        voices: sel.voices,
        voicePlayMode: sel.voicePlayMode,
        pauseMode: sel.pauseMode,
        continuous: false
      },
      context: {
        type: 'favorites',
        program: 'FAV_DG'
      }
    };

    console.log('🎯 PLAY_TRACK PAYLOAD:', payload);

    await fetch(`${API_BASE}/playback/play-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return;
  }

  // ──────────────────────────────────────────
  // CONTINUOUS MODE → Call sequence backend
  // ──────────────────────────────────────────
  const params = new URLSearchParams();

  params.set(
    'mode',
    sel.playbackOrder === 'shuffle'
      ? 'random'
      : sel.playbackOrder === 'down'
        ? 'count_down'
        : 'count_up'
  );

  params.set('tts_language', sel.language);
  params.set('voice_style', sel.voicePlayMode);

  params.set('play_intro', String(sel.voices.includes('intro')));
  params.set('play_detail', String(sel.voices.includes('detail')));
  params.set('play_artist_description', String(sel.voices.includes('artist')));
  params.set('play_track', 'true');

  if (sel.mode === 'decade_genre') {
    params.set('decade', sel.context?.decade ?? '');
    params.set('genre', sel.context?.genre ?? '');

    await fetch(
      `${API_BASE}/supabase/decade-genre/play-first?${params.toString()}`
    );
    return;
  }

  if (sel.mode === 'collection') {
    params.set('slug', sel.context?.collection_slug ?? '');

    await fetch(
      `${API_BASE}/supabase/collections/play-collection-sequence?${params.toString()}`
    );
    return;
  }
}
