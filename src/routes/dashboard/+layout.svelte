<script lang="ts">
    import Header from '$lib/components/Header.svelte';
    import { onMount } from 'svelte';
    import { readLanguagePreference } from '$lib/languagePreferences';

    type DashboardLayoutData = {
        user: any;
        subscriptionStatus: {
            access_state?: string;
        } | null;
    };

    export let data: DashboardLayoutData;

    $: accessState = data?.subscriptionStatus?.access_state;
    $: showFreePromotionNotice = accessState === 'free_2026';
    $: showGracePromotionNotice = accessState === 'grace_2027';
    let language: 'en' | 'es' | 'ptbr' = 'en';
    const copy = {
        en: {
            free: 'Your 2026 promotional access is active. No payment information is required during 2026.',
            grace: 'Your promotional grace period is active. Your reserved early-member offer is $49/year (best value) or $4.99/month.',
            choosePlan: 'Choose your plan'
        },
        es: {
            free: 'Tu acceso promocional de 2026 está activo. No se requiere información de pago durante 2026.',
            grace: 'Tu período de gracia promocional está activo. Tu oferta reservada para miembros fundadores es de US$49/año (mejor valor) o US$4.99/mes.',
            choosePlan: 'Elige tu plan'
        },
        ptbr: {
            free: 'Seu acesso promocional de 2026 está ativo. Nenhuma informação de pagamento é necessária durante 2026.',
            grace: 'Seu período de carência promocional está ativo. Sua oferta reservada para membros fundadores é de US$49/ano (melhor valor) ou US$4,99/mês.',
            choosePlan: 'Escolha seu plano'
        }
    } as const;
    $: text = copy[language];
    onMount(() => { language = readLanguagePreference(); });
</script>

<Header user={data.user} subscriptionStatus={data.subscriptionStatus} />

{#if showFreePromotionNotice}
    <div class="promotion-notice" role="status">
        {text.free}
    </div>
{:else if showGracePromotionNotice}
    <div class="promotion-notice grace" role="status">
        {text.grace}
        <a href="/create-account">{text.choosePlan}</a>
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

    .promotion-notice a {
        color: inherit;
        font-weight: 700;
        margin-left: 0.75rem;
    }

    @media (max-width: 640px) {
        .promotion-notice {
            padding: 0.75rem 1rem;
            text-align: left;
        }
    }
</style>
