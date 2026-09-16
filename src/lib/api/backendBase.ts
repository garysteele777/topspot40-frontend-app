const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);
const DEFAULT_BACKEND_API_BASE = 'http://127.0.0.1:8000';

/**
 * Cookies are host-only. On a local browser origin, align a loopback API URL
 * with the frontend hostname while retaining the API's protocol and port.
 */
export function resolveBackendApiBase(apiBase: string, browserHostname?: string): string {
    if (!browserHostname || !LOOPBACK_HOSTS.has(browserHostname)) return apiBase;

    try {
        const url = new URL(apiBase);
        if (!LOOPBACK_HOSTS.has(url.hostname)) return apiBase;

        url.hostname = browserHostname;
        return url.toString().replace(/\/$/, '');
    } catch {
        return apiBase;
    }
}

const configuredBase = import.meta.env?.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
const browserHostname = typeof window === 'undefined' ? undefined : window.location?.hostname;

export const BACKEND_API_BASE = resolveBackendApiBase(
    configuredBase || DEFAULT_BACKEND_API_BASE,
    browserHostname
);

export function backendUrl(path: string): string {
    return `${BACKEND_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
