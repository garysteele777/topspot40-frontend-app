// @ts-nocheck
const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export class ProgramCodeLookupError extends Error {
    constructor(kind, status) {
        super(kind);
        this.name = 'ProgramCodeLookupError';
        this.kind = kind;
        this.status = status;
    }
}

/**
 * Looks up a public program code exactly as entered. The registry owns all
 * normalization so forms such as n23 and N-023 keep the same behavior.
 */
export async function lookupProgramCode(code, fetchImpl = fetch, apiBase = API_BASE) {
    const response = await fetchImpl(
        `${apiBase}/api/catalog/programs/${encodeURIComponent(code.trim())}`,
        {method: 'GET', headers: {Accept: 'application/json'}}
    );

    if (response.status === 404) {
        throw new ProgramCodeLookupError('not-found', 404);
    }
    if (!response.ok) {
        throw new ProgramCodeLookupError('service', response.status);
    }

    return response.json();
}

function requiredString(value) {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function settingsQuery(settings) {
    const params = new URLSearchParams({
        language: settings.language,
        languages: settings.languages.join(','),
        voices: settings.voices.join(','),
        playbackOrder: settings.playbackOrder,
        voicePlayMode: settings.voicePlayMode,
        pauseMode: settings.pauseMode,
        skipPlayed: String(settings.skipPlayed)
    });
    return params.toString();
}

/** Returns an existing application URL, or null when the contract is incomplete. */
export function programCodeUrl(program, settings) {
    const target = program && typeof program.target === 'object' ? program.target : {};
    const query = settingsQuery(settings);

    if (program?.kind === 'nostalgia') {
        const decade = requiredString(target.decade_slug);
        const genre = requiredString(target.genre_slug);
        return decade && genre
            ? `/car-page?mode=decade_genre&decade=${encodeURIComponent(decade)}&genre=${encodeURIComponent(genre)}&${query}`
            : null;
    }

    if (program?.kind === 'collection') {
        const slug = requiredString(target.slug);
        return slug
            ? `/car-page?mode=collection&collection=${encodeURIComponent(slug)}&${query}`
            : null;
    }

    if (program?.kind === 'artist_spotlight') {
        const artistId = typeof target.artist_id === 'number' || typeof target.artist_id === 'string'
            ? String(target.artist_id)
            : null;
        return artistId
            ? `/car-page?mode=artist_spotlight&artist_id=${encodeURIComponent(artistId)}&${query}`
            : null;
    }

    if (program?.kind === 'docuseries_story') {
        const slug = requiredString(target.slug);
        const docuseriesLanguage = settings.language === 'ptbr' ? 'pt-BR' : settings.language;
        return slug
            ? `/story-player?type=music_docuseries&slug=${encodeURIComponent(slug)}&language=${encodeURIComponent(docuseriesLanguage)}`
            : null;
    }

    return null;
}
