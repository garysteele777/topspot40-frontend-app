// src/lib/types/playback.ts

// ─────────────────────────────────────────────
// Core playback types (single source of truth)
// ─────────────────────────────────────────────

export type ModeType =
  | 'decade_genre'
  | 'collection'
  | 'favorites';


export type Language = 'en' | 'es' | 'ptbr';

export type VoicePart = 'intro' | 'detail' | 'artist';

export type PlaybackOrder = 'up' | 'down' | 'shuffle';

export type PauseMode = 'pause' | 'continuous';

export type VoicePlayMode = 'before' | 'during';

export type CategoryMode = 'single' | 'multiple';

export type LayoutMode = 'car' | 'list';
