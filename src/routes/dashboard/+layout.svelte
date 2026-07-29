<script lang="ts">
    export let data;
    import Header from '$lib/components/Header.svelte';

    $: accessState = data?.subscriptionStatus?.access_state;
    $: showFreePromotionNotice = accessState === 'free_2026';
    $: showGracePromotionNotice = accessState === 'grace_2027';
</script>

<Header user={data.user} />

{#if showFreePromotionNotice}
    <div class="promotion-notice" role="status">
        Your 2026 promotional access is active. No payment information is required during 2026.
    </div>
{:else if showGracePromotionNotice}
    <div class="promotion-notice grace" role="status">
        Your promotional grace period is active through January 30, 2027. A discounted 2027 plan will be available before your promotional access ends.
    </div>
{/if}

<slot />

<style>
    .promotion-notice {
        background: #173d27;
        border-bottom: 1px solid rgba(29, 185, 84, 0.45);
        color: #e8fff0;
        font-size: 0.95rem;
        line-height: 1.4;
        padding: 0.75rem 2rem;
        text-align: center;
    }

    .promotion-notice.grace {
        background: #2f2914;
        border-bottom-color: rgba(214, 193, 122, 0.55);
        color: #fff7d6;
    }

    @media (max-width: 640px) {
        .promotion-notice {
            padding: 0.75rem 1rem;
            text-align: left;
        }
    }
</style>
