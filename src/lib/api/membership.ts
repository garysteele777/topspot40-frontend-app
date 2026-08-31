import { getBackendUrl } from '$lib/config';

export type AccessState =
	| 'free_2026'
	| 'grace_2027'
	| 'complimentary'
	| 'paid'
	| 'expired'
	| 'none';

export type SubscriptionStatus = {
	access_state?: AccessState | string;
	status?: string;
	is_subscribed?: boolean;
	access_source?: string;
	requires_checkout?: boolean;
	complimentary_reason?: string;
	access_expires_at?: string | null;
	current_period_end?: string | null;
	cancel_at_period_end?: boolean;
};

type CheckoutResponse = { url?: unknown; detail?: unknown; error?: unknown };

export function isValidStripeCheckoutUrl(value: unknown): value is string {
	if (typeof value !== 'string' || !value.trim()) return false;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' &&
			(url.hostname === 'checkout.stripe.com' || url.hostname.endsWith('.stripe.com'));
	} catch {
		return false;
	}
}

function responseError(data: CheckoutResponse | null): string {
	if (typeof data?.detail === 'string') return data.detail;
	if (typeof data?.error === 'string') return data.error;
	return 'Unable to start checkout. Please try again.';
}

async function requestCheckout(path: string): Promise<string> {
	const response = await fetch(`${getBackendUrl()}${path}`, { method: 'POST', credentials: 'include' });
	const data = (await response.json().catch(() => null)) as CheckoutResponse | null;
	if (!response.ok) throw new Error(responseError(data));
	if (!isValidStripeCheckoutUrl(data?.url)) throw new Error('The server returned an invalid checkout URL.');
	return data.url;
}

export function createEarlyMemberCheckout(plan: 'annual' | 'monthly'): Promise<string> {
	return requestCheckout(`/api/create-2027-promo-checkout-session?plan=${plan}`);
}

export function createStandardCheckout(): Promise<string> {
	return requestCheckout('/api/create-checkout-session');
}
