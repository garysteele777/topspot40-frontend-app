import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';

export async function load({ fetch }) {
    const res = await fetch(`${getBackendUrl()}/api/subscription-status`, {
        credentials: 'include'
    });

    if (res.status === 401) {
        throw redirect(302, '/signup-official');
    }

    const data = await res.json();

    // If already subscribed → go to dashboard
    if (data.is_subscribed) {
        throw redirect(302, '/dashboard');
    }

    //  NOT subscribed → block dashboard


    return {
        user: {
            isSubscribed: data.is_subscribed
        }
    };
}
