// src/lib/helpers/carLoader.ts
import { selection, type SelectionState } from '$lib/stores/selection';

export function applyCarModeParams(url: URL): void {
  const params = url.searchParams;

  // mode: 'decade_genre' | 'collection'
  const rawMode = params.get('mode');
  const mode: SelectionState['mode'] =
    rawMode === 'collection' || rawMode === 'decade_genre'
      ? rawMode
      : 'decade_genre';

  const language = params.get('language') ?? 'en';

  const decade = params.get('decade') ?? '';
  const genre = params.get('genre') ?? '';
  const collection = params.get('collection') ?? '';

  const startRank = Number(params.get('startRank') ?? '1');
  const endRank = Number(params.get('endRank') ?? '40');

  const voices = (params.get('voices') ?? 'intro')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const rawOrder = params.get('playbackOrder');
  const playbackOrder: 'up' | 'down' | 'shuffle' =
    rawOrder === 'down' || rawOrder === 'shuffle' ? rawOrder : 'up';

  const rawVoicePlay = params.get('voicePlayMode');
  const voicePlayMode: 'before' | 'over' =
    rawVoicePlay === 'over' ? 'over' : 'before';

  const rawPause = params.get('pauseMode');
  const pauseMode: 'pause' | 'continuous' =
    rawPause === 'continuous' ? 'continuous' : 'pause';

  // Build context in the shape SelectionState expects
  let context: SelectionState['context'] = null;

  if (mode === 'collection' && collection) {
    context = { collection_slug: collection };
  } else if (mode === 'decade_genre' && decade && genre) {
    context = { decade, genre };
  }

  const nextSelection: SelectionState = {
    mode,
    language,
    context,
    startRank,
    endRank,
    voices,
    playbackOrder,
    voicePlayMode,
    pauseMode,

    // You already use this in other places
    categoryMode: 'single',

    // Text/voice toggles – Car Mode defaults based on selected voices
    playIntro: voices.includes('intro'),
    playDetail: voices.includes('detail'),
    playArtistDescription: voices.includes('artist'),

    textIntro: true,
    textDetail: false,
    textArtistDescription: false
  };

  selection.set(nextSelection);

  console.debug('🚗 applyCarModeParams → selection.set', nextSelection);
}
