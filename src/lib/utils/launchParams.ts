// src/lib/utils/launchParams.ts
import type {
  BuildParams,
  PlaybackOrder,
  VoicePlayMode,
  PauseMode
} from './buildLaunchUrl';

export interface OptionsState {
  layoutMode: 'car' | 'list';

  // browsing
  activeGroup: 'decade_genre' | 'collection';
  decades: string[];
  genres: string[];
  collections: string[];

  // playback
  language: string;               // 'en' | 'es' | 'pt'
  selectedVoices: string[];       // ['intro', 'detail', 'artist']
  startRank: number;
  endRank: number;
  playbackOrder: PlaybackOrder;   // 'up' | 'down' | 'shuffle'
  voicePlayMode: VoicePlayMode;   // 'before' | 'over'
  pauseMode: PauseMode;           // 'pause' | 'continuous'

  // optional
  randomAllCategories?: boolean;
  overdub?: {
    enabled: boolean;
    intro: boolean;
    detail: boolean;
    artist: boolean;
  };
  textIntro?: boolean;
  textDetail?: boolean;
  textArtistDescription?: boolean;
}

/**
 * Normalize OptionsV2 state into the BuildParams required by buildLaunchUrl().
 */
export function toLaunchParams(state: OptionsState): BuildParams {
  let decade: string | undefined;
  let genre: string | undefined;
  let collection: string | undefined;

  if (state.activeGroup === 'collection') {
    collection = state.collections[0];
  } else {
    decade = state.decades[0];
    genre = state.genres[0];
  }

  return {
    layoutMode: state.layoutMode,

    // browsing
    decade,
    genre,
    collection,

    // playback
    language: state.language,
    voices: state.selectedVoices,
    startRank: state.startRank,
    endRank: state.endRank,
    playbackOrder: state.playbackOrder,
    voicePlayMode: state.voicePlayMode,
    pauseMode: state.pauseMode,

    // optional
    randomAllCategories: state.randomAllCategories,
    overdub: state.overdub,
    textIntro: state.textIntro,
    textDetail: state.textDetail,
    textArtistDescription: state.textArtistDescription,
  };
}
