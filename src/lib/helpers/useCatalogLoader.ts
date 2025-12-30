// Loads catalog + normalizes into decades, genres, and collection groups
import type { GroupedCatalog } from '$lib/api/catalog';
import { fetchGroupedCatalog } from '$lib/api/catalog';

// UI-friendly normalized types
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

	// ---- Normalize decades ----
	const decades: DecadeOption[] = data.decades.map((d) => ({
		id: String(d.id),
		label: d.label ?? String(d.id)
	}));

	// ---- Normalize genres ----
	const genres: GenreOption[] = data.genres.map((g) => ({
		id: String(g.id),
		label: g.label ?? String(g.id)
	}));

	// ---- Normalize collections ----
	const collectionGroups: CollectionGroup[] = data.collections.map((group) => ({
		name: group.name,
		slug: group.slug,
		items: group.items.map((i) => ({
			id: String(i.id),
			name: i.name,
			slug: i.slug
		}))
	}));

	return {
		decades,
		genres,
		collectionGroups
	};
}
