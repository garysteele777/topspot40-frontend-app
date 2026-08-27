/**
 * Program-history helpers deliberately preserve the stored key format.  In
 * particular, these functions do not trim, case-normalize, or otherwise
 * transform values supplied by an existing selection or history entry.
 */

/**
 * @typedef {object} ProgramHistoryEntry
 * @property {string} key
 * @property {unknown[]} [playedRanks]
 * @property {number} [total]
 */

/**
 * Builds the key used by UI consumers that identify a program from the active
 * selection context. Collection aliases are retained for compatibility with
 * older selection shapes.
 *
 * @param {{ mode?: string, context?: Record<string, unknown> | null } | null | undefined} selection
 * @returns {string | null}
 */
export function buildProgramHistoryKey(selection) {
    const context = selection?.context;

    if (selection?.mode === 'decade_genre') {
        const decade = context?.decade;
        const genre = context?.genre;
        return decade && genre ? `DG|${decade}|${genre}` : null;
    }

    if (selection?.mode === 'collection') {
        const collection = context?.collection_slug ?? context?.collection;
        const group = context?.collection_group_slug ?? context?.collectionCategory;
        return collection && group ? `COL|${collection}|${group}` : null;
    }

    return null;
}

/**
 * @param {ProgramHistoryEntry[] | null | undefined} history
 * @param {string | null | undefined} key
 * @returns {ProgramHistoryEntry | undefined}
 */
export function findProgramHistoryEntry(history, key) {
    return key ? history?.find(entry => entry.key === key) : undefined;
}

/**
 * Uses strict membership to retain the existing numeric/string rank behavior.
 *
 * @param {ProgramHistoryEntry[] | null | undefined} history
 * @param {string | null | undefined} key
 * @param {unknown} rank
 */
export function isProgramRankPlayed(history, key, rank) {
    return findProgramHistoryEntry(history, key)?.playedRanks?.includes(rank) ?? false;
}

/**
 * Counts recorded ranks without de-duplicating them; persisted history has
 * always represented totals this way.
 *
 * @param {ProgramHistoryEntry | null | undefined} entry
 */
export function playedRankCount(entry) {
    return entry?.playedRanks?.length ?? 0;
}

/**
 * The rounded percentage used by history summaries.
 *
 * @param {number} played
 * @param {number} total
 */
export function calculatePlayedPercent(played, total) {
    return !total || total <= 0 ? 0 : Math.round((played / total) * 100);
}

/**
 * The unrounded completion values used by the Car Mode player panel.
 *
 * @param {ProgramHistoryEntry[] | null | undefined} history
 * @param {string | null | undefined} key
 * @param {number} trackTotal
 */
export function calculateProgramProgress(history, key, trackTotal) {
    if (!key) return {completed: 0, total: 0, remaining: 0, percent: 0};

    const completed = playedRankCount(findProgramHistoryEntry(history, key));
    const total = trackTotal;
    return {
        completed,
        total,
        remaining: Math.max(0, total - completed),
        percent: total > 0 ? (completed / total) * 100 : 0
    };
}
