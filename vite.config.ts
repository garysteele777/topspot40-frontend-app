import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
        const env = loadEnv(mode, '.', '');
        const appCommit = env.COMMIT?.slice(0, 7) ?? 'development';
        const buildDate = new Date().toISOString();

        return {
                plugins: [sveltekit()],
                define: {
                        __APP_COMMIT__: JSON.stringify(appCommit),
                        __BUILD_DATE__: JSON.stringify(buildDate)
                }
        };
});