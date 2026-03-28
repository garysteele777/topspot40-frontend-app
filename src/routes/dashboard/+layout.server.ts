import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';

export async function load({ fetch }) {
    const backend = getBackendUrl();

    const res = await fetch(`${backend}/api/stripe/subscription-status`, {
        credentials: 'include'
    });

    // ❌ Not logged in / invalid JWT
    if (res.status === 401) {
        throw redirect(302, '/');
    }

    const data = await res.json();

    // ❌ Not subscribed
    if (!data.is_subscribed) {
        throw redirect(302, '/create-account');
    }

    return {};
}
