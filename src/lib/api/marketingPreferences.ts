import { getBackendUrl } from '$lib/config';

export type MarketingPreference = {
	marketing_opt_in: boolean;
	marketing_opt_in_at: string | null;
	marketing_unsubscribed_at: string | null;
};

function isMarketingPreference(data: unknown): data is MarketingPreference {
	if (!data || typeof data !== 'object') return false;

	const value = data as Record<string, unknown>;

	return (
		typeof value.marketing_opt_in === 'boolean' &&
		(value.marketing_opt_in_at === null || typeof value.marketing_opt_in_at === 'string') &&
		(value.marketing_unsubscribed_at === null ||
			typeof value.marketing_unsubscribed_at === 'string')
	);
}

async function parseMarketingPreferenceResponse(res: Response): Promise<MarketingPreference> {
	const data = await res.json().catch(() => null);

	if (!res.ok) {
		const detail =
			typeof (data as { detail?: unknown })?.detail === 'string'
				? (data as { detail: string }).detail
				: 'Unable to load marketing preference. Please try again.';
		throw new Error(detail);
	}

	if (!isMarketingPreference(data)) {
		throw new Error('The server returned an unexpected response.');
	}

	return data;
}

export async function getMarketingPreference(): Promise<MarketingPreference> {
	const res = await fetch(`${getBackendUrl()}/api/auth/marketing-preference`, {
		method: 'GET',
		credentials: 'include'
	});

	return parseMarketingPreferenceResponse(res);
}

export async function setMarketingPreference(
	marketingOptIn: boolean
): Promise<MarketingPreference> {
	const res = await fetch(`${getBackendUrl()}/api/auth/marketing-preference`, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ marketing_opt_in: marketingOptIn })
	});

	return parseMarketingPreferenceResponse(res);
}
