import {catalog, type CatalogData} from '$lib/stores/catalogStore';

import {fetchGroupedCatalog} from '$lib/api/catalog';
import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';

const STORAGE_KEY = 'topspot_catalog';

export async function loadCatalogOnce(): Promise<CatalogData> {

    // ✅ 1. Check sessionStorage FIRST
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
        console.log('⏭ Using catalog from sessionStorage');

        const parsed = JSON.parse(stored);
        catalog.set(parsed);
        return parsed;
    }

    console.log('📚 Loading catalog (API)');

    const data = await fetchGroupedCatalog();
    const normalized = normalizeCatalog(data);

    // ✅ 2. Save it
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    catalog.set(normalized);

    return normalized;
}