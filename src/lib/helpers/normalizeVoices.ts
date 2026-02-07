import type { VoicePart } from '$lib/types/playback';

const VALID_VOICES = new Set<VoicePart>(['intro', 'detail', 'artist']);

function isVoicePart(v: string): v is VoicePart {
  return VALID_VOICES.has(v as VoicePart);
}

export function normalizeVoices(values: string[] | null | undefined): VoicePart[] {
  if (!values) return [];
  return values.map((v) => v.trim()).filter(isVoicePart);
}
