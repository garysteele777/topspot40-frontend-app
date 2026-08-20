import { getBackendUrl } from '$lib/config';

type BillingPortalResponse = {
        url: string;
};

function isBillingPortalResponse(data: unknown): data is BillingPortalResponse {
        if (!data || typeof data !== 'object') return false;

        const value = data as Record<string, unknown>;

        return typeof value.url === 'string' && value.url.length > 0;
}

export async function createBillingPortalSession(): Promise<string> {
        const res = await fetch(`${getBackendUrl()}/api/create-billing-portal-session`, {
                method: 'POST',
                credentials: 'include'
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
                const detail =
                        typeof (data as { detail?: unknown })?.detail === 'string'
                                ? (data as { detail: string }).detail
                                : 'Unable to open subscription management. Please try again.';

                throw new Error(detail);
        }

        if (!isBillingPortalResponse(data)) {
                throw new Error('The server returned an unexpected response.');
        }

        return data.url;
}
