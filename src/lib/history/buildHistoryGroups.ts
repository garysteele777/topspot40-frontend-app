type Catalog = {
  decades: { slug: string; name: string }[];
  genres: { slug: string; name: string; decade_slug: string }[];
  collectionCategories: { slug: string; name: string }[];
  collections: {
    slug: string;
    title: string;
    category_slug: string;
  }[];
};

export function buildHistoryGroups(
  history: any[],
  catalog: Catalog
)
 {
  /* --------------------------
     quick lookup maps
  -------------------------- */

  const genreMap = new Map(
    catalog.genres.map(g => [g.slug, g])
  );

  const decadeMap = new Map(
    catalog.decades.map(d => [d.slug, d.name])
  );

  const collectionMap = new Map(
    catalog.collections.map(c => [c.slug, c])
  );

  const categoryMap = new Map(
    catalog.collectionCategories.map(c => [c.slug, c.name])
  );

  /* --------------------------
     output containers
  -------------------------- */

  const decades: Record<string, any[]> = {};
  const collections: Record<string, any[]> = {};

  /* --------------------------
     parse history
  -------------------------- */

  for (const row of history) {
    const parts = row.key.split('|');

    /* ---------- DG ---------- */

    if (parts[0] === 'DG') {
      const decadeSlug = parts[1];
      const genreSlug = parts[2];

      const genre = genreMap.get(genreSlug);
      const decadeName = decadeMap.get(decadeSlug) ?? decadeSlug;

      if (!genre) continue;

      if (!decades[decadeName]) decades[decadeName] = [];

      decades[decadeName].push({
        label: genre.name,
        played: row.playedCount,
        total: row.totalCount,
        resumeUrl: `/car-page?decade=${decadeSlug}&genre=${genreSlug}`,
        key: row.key
      });
    }

    /* ---------- COL ---------- */

    if (parts[0] === 'COL') {
      const categorySlug = parts[1];
      const collectionSlug = parts[2];

      const collection = collectionMap.get(collectionSlug);
      if (!collection) continue;

      const categoryName =
        categoryMap.get(categorySlug) ?? categorySlug;

      if (!collections[categoryName])
        collections[categoryName] = [];

      collections[categoryName].push({
        label: collection.title,
        played: row.playedCount,
        total: row.totalCount,
        resumeUrl: `/car-page?collection=${collectionSlug}`,
        key: row.key
      });
    }
  }

  return {
    decades,
    collections
  };
}
