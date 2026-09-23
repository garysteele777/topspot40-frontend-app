import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
    const accessToken = cookies.get('access_token');

    if (!accessToken) {
        throw redirect(302, '/journey-prototype');
    }

    let isAuthenticated = false;

    try {
        const response = await fetch(
            `${getBackendUrl()}/api/auth/me`,
            {
                headers: {
                    cookie: `access_token=${accessToken}`
                }
            }
        );

        isAuthenticated = response.ok;
    } catch {
        isAuthenticated = false;
    }

    throw redirect(
        302,
        isAuthenticated ? '/dashboard' : '/journey-prototype'
    );
};
