/**
 * Presentation-only formatting for the Drive-In track selector. Source track
 * values stay intact for playback, selection, favorites, and CSV exports.
 *
 * @param {string | null | undefined} trackName
 * @param {number} rank
 * @returns {string}
 */
export function displayTrackListTitle(trackName, rank) {
    const title = trackName?.trim() ?? '';
    const leadingRank = title.match(/^#(\d+)(?:\s+|[.:\-\u2013\u2014]\s*)/);

    return titleCase(
        leadingRank && Number(leadingRank[1]) === rank
            ? title.slice(leadingRank[0].length).trim()
            : title
    );
}

/**
 * @param {string | null | undefined} artistName
 * @returns {string}
 */
export function displayTrackListArtist(artistName) {
    return titleCase(artistName?.trim() ?? '');
}

/** @param {string} value @returns {string} */
function titleCase(value) {
    // Existing mixed case can carry intentional styling, such as AC/DC, P!nk,
    // iPhone, and punctuation-specific artist styling. Only normalize fully
    // lowercase source values.
    if (!value) return value;

    return value.split(/(\s+)/u).map(part => {
        if (!part || part !== part.toLocaleLowerCase()) return part;

        return part.replace(
            /(^|[([{'"-])(\p{L})/gu,
            (_match, prefix, letter) => `${prefix}${letter.toLocaleUpperCase()}`
        );
    }).join('');
}
