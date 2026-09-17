import type {JourneyCollectionGroup} from '$lib/collections/types';

export const COLLECTIONS_RADIO_STORAGE_KEY = 'topspot_collections_radio_groups';

function normalizedSlug(value: string): string {
    return value.trim().toLowerCase();
}

/** Retains the catalog's canonical ordering and removes unknown/duplicate slugs. */
export function normalizeCollectionsRadioGroups(
    values: readonly string[],
    groups: readonly JourneyCollectionGroup[]
): string[] {
    const requested = new Set(values.map(normalizedSlug).filter(Boolean));
    return groups.map(group => group.slug).filter(slug => requested.has(slug));
}

export function parseCollectionsRadioGroups(
    values: readonly string[],
    groups: readonly JourneyCollectionGroup[]
): string[] {
    return normalizeCollectionsRadioGroups(
        values.flatMap(value => value.split(',')),
        groups
    );
}

export function serializeCollectionsRadioGroups(
    values: readonly string[],
    groups: readonly JourneyCollectionGroup[]
): string {
    return normalizeCollectionsRadioGroups(values, groups).join(',');
}

export function collectionsRadioStationLabel(
    savedGroups: string | undefined,
    legacyGroup: string | undefined,
    groups: readonly JourneyCollectionGroup[]
): string {
    const selected = parseCollectionsRadioGroups((savedGroups ?? '').split(','), groups);
    const effective = selected.length > 0
        ? selected
        : legacyGroup && legacyGroup !== 'ALL'
            ? normalizeCollectionsRadioGroups([legacyGroup], groups)
            : groups.map(group => group.slug);

    if (effective.length === groups.length) return 'ALL';
    if (effective.length !== 1) return 'CUSTOM';
    return groups.find(group => group.slug === effective[0])?.name ?? effective[0];
}

export function isGeneratedCollectionGroupAllowed(
    savedGroups: string | undefined,
    legacyGroup: string | undefined,
    generatedGroup: string | undefined,
    groups: readonly JourneyCollectionGroup[]
): boolean {
    if (!generatedGroup) return false;
    const selected = parseCollectionsRadioGroups((savedGroups ?? '').split(','), groups);
    const effective = selected.length > 0
        ? selected
        : legacyGroup && legacyGroup !== 'ALL'
            ? normalizeCollectionsRadioGroups([legacyGroup], groups)
            : groups.map(group => group.slug);
    return effective.includes(normalizedSlug(generatedGroup));
}
