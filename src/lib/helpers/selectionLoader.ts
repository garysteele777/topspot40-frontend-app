// src/lib/helpers/selectionLoader.ts
import { goto } from '$app/navigation';
import { selection } from '$lib/stores/selection';
import type { Mode, SelectionState } from '$lib/stores/selection';

export async function loadSelection(
  opts: {
    modeType: Mode;
    ttsLanguage: string;

    selectedDecade?: string;
    selectedGenre?: string;

    selectedCollection?: string;
    collectionSlugMap?: Record<string, string>;

    startRank: number;
    endRank: number;

    playIntro: boolean;
    playDetail: boolean;
    playArtistDescription: boolean;

    textIntro: boolean;
    textDetail: boolean;
    textArtistDescription: boolean;

    playTrack: boolean;
  },
  setStatus?: (msg: string) => void
): Promise<void> {
  const {
    modeType,
    ttsLanguage,
    selectedDecade,
    selectedGenre,
    selectedCollection,
    collectionSlugMap = {},

    startRank,
    endRank,

    playIntro,
    playDetail,
    playArtistDescription,

    textIntro,
    textDetail,
    textArtistDescription,

    playTrack,
  } = opts;

  try {
    // ───────── Validation ─────────
    if (modeType === 'decade_genre' && (!selectedDecade || !selectedGenre)) {
      setStatus?.('⚠️ Please select both a Decade and a Genre.');
      return;
    }
    if (modeType === 'collection' && (!selectedCollection || selectedCollection === '')) {
      setStatus?.('⚠️ Please select a valid Collection.');
      return;
    }

    // ───────── Build context ─────────
    let context: SelectionState['context'] = null;

    if (modeType === 'collection') {
      const slug = collectionSlugMap[selectedCollection ?? ''] ?? '';

      context = {
        collection_slug: slug,
        collection_name: selectedCollection ?? '',
      };
    } else {
      context = {
        decade: selectedDecade ?? '',
        genre: selectedGenre ?? '',
      };
    }

    // ───────── Update global store (WITHOUT tracks) ─────────
    selection.set({
      mode: modeType,
      language: ttsLanguage,
      context,

      startRank,
      endRank,

      // Playback toggles
      playIntro,
      playDetail,
      playArtistDescription,

      // Text toggles
      textIntro,
      textDetail,
      textArtistDescription,

      // Defaults
      voices: ['intro'],
      playbackOrder: 'up',
      voicePlayMode: 'before',
      pauseMode: 'pause',
      categoryMode: 'single'
    });

    // ───────── Build query params ─────────
    const params = new URLSearchParams({
      mode: modeType ?? '',
      language: ttsLanguage ?? 'en',

      start_rank: String(startRank),
      end_rank: String(endRank),

      play_intro: String(playIntro),
      play_detail: String(playDetail),
      play_artist_description: String(playArtistDescription),
      play_track: String(playTrack),

      text_intro: String(textIntro),
      text_detail: String(textDetail),
      text_artist_description: String(textArtistDescription),
    });

    if (modeType === 'collection') {
      params.set('collection_slug', collectionSlugMap[selectedCollection ?? ''] ?? '');
    } else {
      params.set('decade', selectedDecade ?? '');
      params.set('genre', selectedGenre ?? '');
    }

    const url = `/car-page?${params.toString()}`;
    console.log('🚗 Redirecting to Car Mode with URL:', url);

    // ───────── Navigation (Lint Safe) ─────────
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    void goto(url);

  } catch (err) {
    console.error('❌ loadSelection failed:', err);
    setStatus?.('❌ Error loading selection.');
  }
}
