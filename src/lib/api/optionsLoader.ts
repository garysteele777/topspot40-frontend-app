import { loadCatalogSummary, toSlug } from '$lib/api';

type CatalogSummary = {
  decades?: string[];
  genres?: string[];
  collections?: string[];
  // optional from backend; we’ll synthesize it if missing
  collectionSlugMap?: Record<string, string>;
};

export async function fetchCatalogData() {
  const summary = (await loadCatalogSummary()) as CatalogSummary;

  const decades = summary.decades ?? [];
  const genres = summary.genres ?? [];
  const collections = summary.collections ?? [];

  // Prefer map from backend; otherwise build from names using toSlug
  const collectionSlugMap: Record<string, string> =
    summary.collectionSlugMap ??
    Object.fromEntries(collections.map((name) => [name, toSlug(name)]));

  return { decades, genres, collections, collectionSlugMap };
}
