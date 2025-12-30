export interface DecadeItem { id: number; name: string; slug: string }
export interface GenreItem  { id: number; name: string; slug: string }
export interface CollectionLeaf { id: number; name: string; slug: string }
export interface CollectionGroup {
	category: string;
	slug: string;
	collections: CollectionLeaf[];
}

export interface GroupedCatalog {
	decades: DecadeItem[];
	genres: GenreItem[];
	collections: CollectionGroup[];
}

export async function fetchGroupedCatalog(
	base = 'http://127.0.0.1:8000'
): Promise<GroupedCatalog> {
	const res = await fetch(`${base}/catalog/grouped`);
	if (!res.ok) throw new Error(`❌ Failed to load grouped catalog: ${res.status}`);
	return res.json();
}
