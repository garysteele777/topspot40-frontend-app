/** Accept only the current experience chooser and Nostalgia genre picker. */
/** @param {string | null | undefined} value */
export function isSafeJourneyReturnPath(value) {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return false;
    try {
        const url = new URL(value, 'https://topspot40.invalid');
        return url.origin === 'https://topspot40.invalid' &&
            (url.pathname === '/journey-prototype/choose' || url.pathname === '/journey-prototype/genre');
    } catch {
        return false;
    }
}
