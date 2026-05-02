import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';
import type { LayoutServerLoad } from './$types';


export const load: LayoutServerLoad = async ({ fetch }) => {
    console.log('🔥 DASHBOARD LAYOUT HIT');
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
        throw redirect(302, '/signup-official');
    }

    const userRes = await fetch(`${backend}/api/me`, {
        credentials: 'include'
    });

    const user = userRes.ok ? await userRes.json() : null;


    return {
        user
    } satisfies { user: any };
}
