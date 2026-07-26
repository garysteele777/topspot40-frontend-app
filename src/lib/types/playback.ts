// src/lib/types/playback.ts

// ─────────────────────────────────────────────
// Core playback engine types
// ─────────────────────────────────────────────
//
// ModeType identifies the low-level playback engine.
// It does NOT distinguish Radio vs Program.
//
// Examples:
// - decade_genre powers Nostalgia Radio and Nostalgia Programs
// - collection powers Collections Radio and Collections Programs
// - artist_spotlight powers Artist Spotlight

export type ModeType =
    | 'decade_genre'
    | 'collection'
    | 'artist_spotlight';

export type Language = 'en' | 'es' | 'ptbr';

export type VoicePart = 'intro' | 'detail' | 'artist';

export type DetailLength = 'short' | 'long';

export type PlaybackOrder = 'up' | 'down' | 'shuffle';

export type PauseMode = 'pause' | 'continuous';

export type VoicePlayMode = 'before' | 'over';

export type CategoryMode = 'single' | 'multiple';

export type LayoutMode = 'car' | 'list';
