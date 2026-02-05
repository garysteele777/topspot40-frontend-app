// src/lib/options/summaries.ts
import type { VoicePart, ModeType } from '$lib/types/playback';

export function summarizeVoices(parts: VoicePart[]): string {
  if (parts.length === 0) return 'No narration';

  const set = new Set(parts);

  const hasIntro = set.has('intro');
  const hasDetail = set.has('detail');
  const hasArtist = set.has('artist');

  if (hasIntro && hasDetail && hasArtist) return 'Intro + Detail + Artist';
  if (hasIntro && hasDetail) return 'Intro + Detail';
  if (hasIntro && hasArtist) return 'Intro + Artist';
  if (hasDetail && hasArtist) return 'Detail + Artist';

  if (hasIntro) return 'Intro only';
  if (hasDetail) return 'Detail only';
  return 'Artist notes only';
}

export function summarizeSelection(
  group: ModeType,
  decadesSel: string[],
  genresSel: string[],
  collectionsSel: string[]
): string {
  if (group === 'decade_genre') {
    if (!decadesSel.length && !genresSel.length) return 'No decade/genre selected';

    const decadePart =
      decadesSel.length === 0
        ? 'No decade'
        : decadesSel.length === 1
          ? decadesSel[0]
          : `${decadesSel.length} decades`;

    const genrePart =
      genresSel.length === 0
        ? 'No genre'
        : genresSel.length === 1
          ? genresSel[0]
          : `${genresSel.length} genres`;

    return `${decadePart} • ${genrePart}`;
  }

  if (!collectionsSel.length) return 'No collection selected';
  return collectionsSel.length === 1
    ? collectionsSel[0]
    : `${collectionsSel.length} collections`;
}
