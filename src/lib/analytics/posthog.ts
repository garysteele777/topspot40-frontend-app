import { getBackendUrl } from '$lib/config';

type PostHogClient = {
    init: (token: string, options: Record<string, unknown>) => void;
    identify: (distinctId: string, properties?: Record<string, string>) => void;
    capture: (event: string, properties?: Record<string, string | number | null>, options?: { send_instantly?: boolean; transport?: 'sendBeacon' }) => void;
    get_property?: (property: string) => unknown;
    reset: () => void;
};

type AuthenticatedUser = { id?: unknown; email?: unknown };

let initialized = false;

export function identifyPostHogUser(client: PostHogClient, user: AuthenticatedUser): boolean {
    if (typeof user.id !== 'string' || !user.id) return false;

    const previousUserId = client.get_property?.('$user_id');
    if (typeof previousUserId === 'string' && previousUserId !== user.id) client.reset();

    client.identify(user.id, typeof user.email === 'string' && user.email ? { email: user.email } : undefined);
    return true;
}

export async function syncPostHogIdentity(
    client: PostHogClient,
    fetcher: typeof fetch = fetch,
    backendUrl = getBackendUrl()
): Promise<boolean> {
    try {
        const response = await fetcher(`${backendUrl}/api/auth/me`, { credentials: 'include' });
        if (!response.ok) return false;
        return identifyPostHogUser(client, await response.json());
    } catch {
        return false;
    }
}

export function initializePostHog(client: PostHogClient, fetcher: typeof fetch = fetch): void {
    if (initialized) return;
    client.init('phc_mQ9iZBjF46F7TSgopnPcZ7VWq358b6wS9xpCBrZHJuje', {
        api_host: 'https://us.i.posthog.com', defaults: '2026-05-30', disable_session_recording: true
    });
    initialized = true;
    void syncPostHogIdentity(client, fetcher);
}

export function resetPostHog(client: PostHogClient): void { client.reset(); }

export function captureSpotifyOpen(client: PostHogClient, properties: Record<string, string | number | null>): void {
    client.capture('spotify_opened', properties, { send_instantly: true, transport: 'sendBeacon' });
}

export function captureProgramStarted(
    client: PostHogClient,
    properties: Record<string, string | number | null>
): void {
    client.capture('program_started', properties);
}
