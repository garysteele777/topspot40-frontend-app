// src/lib/api/catalog.ts

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

// Prefer VITE_API_BASE_URL, fallback to local backend
const API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

class CatalogError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly url?: string
  ) {
    super(message);
    this.name = 'CatalogError';
  }
}

async function readJsonSafe<T>(res: Response, url: string): Promise<T> {
  const contentType = res.headers.get('content-type') ?? '';
  const text = await res.text();

  // If the backend ever returns HTML (Render 404 page, proxy error, etc.), this helps a ton.
  if (!contentType.includes('application/json')) {
    throw new CatalogError(
      `Expected JSON but received "${contentType || 'unknown content-type'}" from ${url}`,
      res.status,
      url
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new CatalogError(
      `Failed to parse JSON from ${url}`,
      res.status,
      url
    );
  }
}

export async function fetchGroupedCatalog(): Promise<GroupedCatalog> {
  const url = `${API_BASE}/api/catalog/grouped`;

  const res = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit',
    headers: { Accept: 'application/json' }
  });

  if (!res.ok) {
    // Attempt to include some response body in the error message (useful for FastAPI detail)
    const body = await res.text().catch(() => '');
    const snippet = body ? ` | body: ${body.slice(0, 300)}` : '';
    throw new CatalogError(`Failed to load grouped catalog: ${res.status} ${res.statusText}${snippet}`, res.status, url);
  }

  return await readJsonSafe<GroupedCatalog>(res, url);
}
