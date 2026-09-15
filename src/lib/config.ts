// src/lib/config.ts

/** Returns true if running locally */
const isLocal = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

/** Backend base URL depending on environment */
export const getBackendUrl = (): string => {
  const configured = import.meta.env?.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
  return configured || (isLocal ? 'http://127.0.0.1:8000' : 'https://api.topspot40.com');
};

/** Frontend base URL depending on environment */
export const FRONTEND_URL = isLocal
  ? 'http://localhost:5173'
  : 'https://resplendent-gaufre-032b1a.netlify.app';
