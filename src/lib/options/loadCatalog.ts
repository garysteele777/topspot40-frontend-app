import {fetchGroupedCatalog} from '$lib/api/catalog';
import {normalizeCatalog} from '$lib/helpers/normalizeCatalog';

export async function loadCatalog() {

    const data = await fetchGroupedCatalog();
    return normalizeCatalog(data);
}
