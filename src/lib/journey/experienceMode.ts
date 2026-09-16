export const EXPERIENCE_FAMILIES = ['nostalgia', 'collections', 'artist', 'docuseries'] as const;
export type ExperienceFamily = typeof EXPERIENCE_FAMILIES[number];
export type ExperienceMode = 'program' | 'radio';
export const PROGRAM_DESTINATIONS: Record<ExperienceFamily, string> = {
    nostalgia: '/journey-prototype/decade',
    collections: '/journey-prototype/collections',
    artist: '/journey-prototype/artist-spotlights',
    docuseries: '/journey-prototype/music-docuseries'
};

export function buildExperienceDestination(family: ExperienceFamily, mode: ExperienceMode): string {
    if (mode === 'program') return PROGRAM_DESTINATIONS[family];
    return `/journey-prototype/radio?${new URLSearchParams({experienceFamily: family, experienceMode: 'radio'})}`;
}

export function parseRadioExperience(params: URLSearchParams): ExperienceFamily | null {
    const family = params.get('experienceFamily');
    return params.get('experienceMode') === 'radio' &&
        EXPERIENCE_FAMILIES.includes(family as ExperienceFamily)
        ? family as ExperienceFamily
        : null;
}

export function isRadioExperienceDestination(value: string | null): boolean {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return false;
    const url = new URL(value, 'https://topspot40.invalid');
    return url.origin === 'https://topspot40.invalid' &&
        url.pathname === '/journey-prototype/radio' &&
        parseRadioExperience(url.searchParams) !== null;
}
