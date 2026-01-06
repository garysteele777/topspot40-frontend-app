<script lang="ts">
    import favicon from '$lib/assets/favicon.svg';

    let {children} = $props();

    console.log('API BASE:', import.meta.env.VITE_API_BASE_URL);
</script>

<svelte:head>
    <link rel="icon" href={favicon}/>
</svelte:head>

{@render children()}
