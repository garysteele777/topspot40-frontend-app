export interface OverdubOptions {
  enabled: boolean;
  intro: boolean;
  detail: boolean;
  artist: boolean;
}

export function buildCarModeUrl(params: {
  modeType: string;
  ttsLanguage: string;
  selectedDecade?: string;
  selectedGenre?: string;
  selectedCollection?: string;
  collectionSlugMap?: Record<string, string>;
  playIntro: boolean;
  playDetail: boolean;
  playArtistDescription: boolean;
  textIntro: boolean;
  textDetail: boolean;
  textArtistDescription: boolean;
  playTrack: boolean;
  startRank: number;
  endRank: number;
  playbackMode: string;
  overdub?: OverdubOptions;          // ✅ new optional field
  randomAllCategories?: boolean;     // ✅ new optional field
}) {
  const {
    modeType,
    ttsLanguage,
    selectedDecade,
    selectedGenre,
    selectedCollection,
    collectionSlugMap,
    playIntro,
    playDetail,
    playArtistDescription,
    textIntro,
    textDetail,
    textArtistDescription,
    playTrack,
    startRank,
    endRank,
    playbackMode,
    overdub,
    randomAllCategories,
  } = params;

  const query = new URLSearchParams({
    mode: modeType,
    language: ttsLanguage,
    play_intro: String(playIntro),
    play_detail: String(playDetail),
    play_artist_description: String(playArtistDescription),
    text_intro: String(textIntro),
    text_detail: String(textDetail),
    text_artist_description: String(textArtistDescription),
    play_track: String(playTrack),
    start_rank: String(startRank),
    end_rank: String(endRank),
    playback_mode: playbackMode,
  });

  // ───────── Add new parameters ─────────
  if (randomAllCategories) {
    query.set('random_all_categories', 'true');
  }

  if (overdub?.enabled) {
    query.set('overdub', 'true');
    query.set('overdub_intro', String(overdub.intro));
    query.set('overdub_detail', String(overdub.detail));
    query.set('overdub_artist', String(overdub.artist));
  }

  // ───────── Existing decade/genre or collection ─────────
  if (modeType === 'decade_genre') {
    if (selectedDecade) query.set('decade', selectedDecade);
    if (selectedGenre) query.set('genre', selectedGenre);
  } else if (selectedCollection) {
    const slug = collectionSlugMap?.[selectedCollection] ?? selectedCollection;
    query.set('collection_slug', slug);
  }

  return `/car-page?${query.toString()}`;
}
