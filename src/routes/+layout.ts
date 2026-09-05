import { browser } from '$app/environment';
import posthog from 'posthog-js';

export const load = async () => {
    if (browser) {
        posthog.init('phc_mQ9iZBjF46F7TSgopnPcZ7VWq358b6wS9xpCBrZHJuje', {
            api_host: 'https://us.i.posthog.com',
            defaults: '2026-05-30'
        });
    }
};