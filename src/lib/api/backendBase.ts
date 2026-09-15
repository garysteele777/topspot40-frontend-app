/**
 * One browser origin for backend requests. Do not use `localhost` here:
 * host-only cookies issued by 127.0.0.1 are not sent to localhost.
 */
const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

export const BACKEND_API_BASE = configuredBase || 'http://127.0.0.1:8000';

export function backendUrl(path: string): string {
    return `${BACKEND_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
