<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import LandingHeader from '$lib/components/LandingHeader.svelte';
    import { page } from '$app/stores'; 
    import { onMount } from 'svelte';

    let {children} = $props();
    let deferredPrompt: any = null;

    onMount(() => {
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
