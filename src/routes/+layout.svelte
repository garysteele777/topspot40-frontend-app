<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';
    import LandingHeader from '$lib/components/LandingHeader.svelte';
    import { page } from '$app/stores'; 

    let {children} = $props();

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
