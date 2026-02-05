import { saveResumeState, type ResumeState } from '$lib/utils/smartResume';

type ModeType = 'decade_genre' | 'collection';
type Language = 'en' | 'es' | 'ptbr';
type PlaybackOrder = 'up' | 'down' | 'shuffle';
type PauseMode = 'pause' | 'continuous';
type VoicePart = 'intro' | 'detail' | 'artist';

export function saveResumeFromLocal(params: {
  activeGroup: ModeType;
  context: Record<string, string>;
  language: Language;
  startRank: number;
  endRank: number;
  playbackOrder: PlaybackOrder;
  pauseMode: PauseMode;
  voices: VoicePart[];
}): void {
  const state: ResumeState = {
    mode: params.activeGroup,
    context: params.context,
    language: params.language,
    startRank: params.startRank,
    endRank: params.endRank,
    playbackOrder: params.playbackOrder,
    currentRank: params.startRank,
    autoAdvance: params.pauseMode === 'continuous',
    voices: params.voices
  };

  saveResumeState(state);
}
