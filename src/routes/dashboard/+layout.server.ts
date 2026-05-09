import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';
import type { LayoutServerLoad } from './$types';


export const load: LayoutServerLoad = async ({ fetch }) => {
    console.log('🔥 DASHBOARD LAYOUT HIT');
    const backend = getBackendUrl();

    const res = await fetch(`${backend}/api/subscription-status`, {
        credentials: 'include'
    });

    // ❌ Not logged in / invalid JWT
    if (res.status === 401) {
        throw redirect(302, '/');
    }

    console.log('📡 subscription-status HTTP status:', res.status);

    const data = await res.json();
    console.log('📦 subscription-status JSON:', data);

    // ❌ Not subscribed
    if (!data.is_subscribed) {
        throw redirect(302, '/signup-official');
    }

    const userRes = await fetch(`${backend}/api/me`, {
        credentials: 'include'
    });

    console.log('📡 /me HTTP status:', userRes.status);

    const user = userRes.ok ? await userRes.json() : null;

    console.log('👤 USER JSON:', user);

    return {
        user
    } satisfies { user: any };
}
