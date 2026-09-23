<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import LandingHeader from '$lib/components/LandingHeader.svelte';
    import { page } from '$app/stores'; 
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import posthog from 'posthog-js';
    import { initializePostHog } from '$lib/analytics/posthog';
    import { activateAudioDebugFromSearch } from '$lib/audio/audioDebug';

    let {children} = $props();
    let deferredPrompt: any = null;

    // A diagnostic link may be opened before the user chooses a program.
    // Preserve only the enabled flag through same-tab navigation; entries stay in memory.
    $effect(() => {
        if (browser) activateAudioDebugFromSearch($page.url.search);
    });

    onMount(() => {
        initializePostHog(posthog);

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            console.log('✅ Install prompt ready');
        });
    });

    async function installApp() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        } else {
            alert('Install not available yet');
        }
    }

    console.log('API BASE:', import.meta.env.VITE_API_BASE_URL);
</script>

<svelte:head>
    <link rel="icon" href={favicon}/>
</svelte:head>

<!-- Render landing header only on "/" -->
{#if $page.url.pathname === '/'}
	<LandingHeader />
{/if}

{@render children()}
