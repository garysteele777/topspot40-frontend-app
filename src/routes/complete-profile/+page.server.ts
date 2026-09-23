import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';

export async function load({ fetch, cookies }) {
    const accessToken = cookies.get('access_token');
    if (!accessToken) throw redirect(302, '/signin');

    const response = await fetch(`${getBackendUrl()}/api/auth/me`, {
        headers: { cookie: `access_token=${accessToken}` }
    });

    if (!response.ok) throw redirect(302, '/signin');

    const user = await response.json();
    if ((user?.display_name ?? '').trim()) throw redirect(302, '/dashboard');
}
