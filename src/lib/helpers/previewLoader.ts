import {
  getTrackSequencePreview,
  getCollectionSequencePreview,
} from '$lib/api';
import { pickFirstNarrationLine, pickName, toTitleCase } from '$lib/utils/textHelpers';

// What a single preview row can look like (union-friendly, minimal fieldsF we use)
export interface PreviewRow {
  rank: number;
  trackName?: string;
  title?: string;
  artistName?: string;
  artist?: string;
  // narration fields vary across endpoints; keep them optional/loose
  intro?: string;
  detail?: string;
  intro_text?: string;
  detail_text?: string;
  [k: string]: unknown; // allow extra keys without turning into `any`
}

export type ModeType = 'decade_genre' | 'collection';

export interface LoadPreviewOpts {
  decade?: string;
  genre?: string;
  collection?: string;
  collectionSlugMap?: Record<string, string>;
  language: string;
  startRank: number;
  endRank: number;
}

// Type guards
function isPreviewRow(x: unknown): x is PreviewRow {
  return typeof x === 'object' && x !== null && typeof (x as { rank?: unknown }).rank === 'number';
}
function isPreviewRowArray(x: unknown): x is PreviewRow[] {
  return Array.isArray(x) && x.every(isPreviewRow);
}

export async function loadPreview(
  modeType: ModeType,
  opts: LoadPreviewOpts
): Promise<string> {
  let data: unknown = [];

  if (modeType === 'decade_genre' && opts.decade && opts.genre) {
    data = await getTrackSequencePreview({
      decade: opts.decade,
      genre: opts.genre,
      start_rank: opts.startRank,
      end_rank: opts.endRank,
    });
  } else if (modeType === 'collection' && opts.collection) {
    const slug = opts.collectionSlugMap?.[opts.collection] ?? opts.collection;
    data = await getCollectionSequencePreview({
      collection_slug: slug,
      start_rank: opts.startRank,
      end_rank: opts.endRank,
    });
  }

  if (!isPreviewRowArray(data) || data.length === 0) {
    return '⚠️ No tracks found for preview.';
  }

  const first = data[0];

  // Imported helpers accept loose shapes; cast to unknown-safe records (not `any`)
  const teaser = pickFirstNarrationLine(first as Record<string, unknown>);
  if (teaser) return `🗣 ${teaser}`;

  const t =
    pickName(first as Record<string, unknown>, ['trackName', 'title']) ??
    'Track';
  const a =
    pickName(first as Record<string, unknown>, ['artistName', 'artist']) ??
    'Artist';

  return `🎵 ${toTitleCase(String(t))} — ${toTitleCase(String(a))}`;
}
