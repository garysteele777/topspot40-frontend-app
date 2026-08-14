import { dev } from '$app/environment';
import { redirect } from '@sveltejs/kit';
import { getBackendUrl } from '$lib/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, cookies }) => {
    if (dev) {
        return {
            user: null,
            subscriptionStatus: null
        };
    }

    const accessToken = cookies.get('access_token');

    if (!accessToken) {
        throw redirect(302, '/');
    }

    const backend = getBackendUrl();

    const headers = {
        cookie: `access_token=${accessToken}`
    };

    const subscriptionRes = await fetch(
        `${backend}/api/subscription-status`,
        {
            headers
        }
    );

    if (subscriptionRes.status === 401) {
        throw redirect(302, '/');
    }

    if (!subscriptionRes.ok) {
        throw new Error(
            `Unable to load subscription status: ${subscriptionRes.status}`
        );
    }

    const subscriptionStatus = await subscriptionRes.json();

    if (!subscriptionStatus.is_subscribed) {
        throw redirect(302, '/create-account');
    }

    const userRes = await fetch(
        `${backend}/api/auth/me`,
        {
            headers
        }
    );

    if (userRes.status === 401) {
        throw redirect(302, '/');
    }

    if (!userRes.ok) {
        throw new Error(
            `Unable to load dashboard user: ${userRes.status}`
        );
    }

    const user = await userRes.json();

    return {
        user,
        subscriptionStatus
    };
};
