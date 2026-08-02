import type {MusicDocuseriesLaunchSettings} from './types';

const MUSIC_DOCUSERIES_JOURNEY_PREFIX = '/journey-prototype/music-docuseries';

export function isSafeMusicDocuseriesReturnPath(value: string | null): value is string {
    if (!value) return false;
    return value === MUSIC_DOCUSERIES_JOURNEY_PREFIX ||
        value.startsWith(`${MUSIC_DOCUSERIES_JOURNEY_PREFIX}/`) ||
        value.startsWith(`${MUSIC_DOCUSERIES_JOURNEY_PREFIX}?`);
}

export function buildMusicDocuseriesLaunchUrl(
    settings: MusicDocuseriesLaunchSettings
): string {
    const query = new URLSearchParams({
        type: 'music_docuseries',
        slug: settings.storySlug,
        language: settings.language === 'ptbr' ? 'pt-BR' : settings.language,
        collection: settings.collectionSlug
    });

    if (isSafeMusicDocuseriesReturnPath(settings.returnTo ?? null)) {
        query.set('returnTo', settings.returnTo!);
    }

    return `/story-player?${query.toString()}`;
}
