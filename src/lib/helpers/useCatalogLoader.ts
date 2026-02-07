import type { GroupedCatalog } from '$lib/api/catalog';
import { fetchGroupedCatalog } from '$lib/api/catalog';

// UI-normalized types
export interface DecadeOption {
  id: string;
  label: string;
}

export interface GenreOption {
  id: string;
  label: string;
}

export interface CollectionGroup {
  name: string;
  slug: string;
  items: { id: string; name: string; slug: string }[];
}

export interface LoadedCatalog {
  decades: DecadeOption[];
  genres: GenreOption[];
  collectionGroups: CollectionGroup[];
}

export async function loadCatalog(): Promise<LoadedCatalog> {
  const data: GroupedCatalog = await fetchGroupedCatalog();

  const decades = data.decades.map((d) => ({
    id: String(d.id),
    label: d.name
  }));

  const genres = data.genres.map((g) => ({
    id: String(g.id),
    label: g.name
  }));

  const collectionGroups = data.collections.map((group) => ({
    name: group.category,           // 🔑 category → name
    slug: group.slug,
    items: group.collections.map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug
    }))
  }));

  return {
    decades,
    genres,
    collectionGroups
  };
}
