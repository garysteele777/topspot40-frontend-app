<script lang="ts">
    import { onMount } from 'svelte';
    import { readLanguagePreference } from '$lib/languagePreferences';
    import { AccessCodeError, redeemAccessCode, type AccessCodeResult } from '$lib/api/accessCodes';

    export let onApplied: (result: AccessCodeResult) => void = () => {};
    let language: 'en' | 'es' | 'ptbr' = 'en';
    let code = '';
    let busy = false;
    let error = '';
    let result: AccessCodeResult | null = null;
    const copy = {
        en: {
            title: 'Have an access code?', label: 'Access code', hint: 'Enter the word or code you were given.',
            apply: 'Apply code', applying: 'Applying…', activated: 'Your complimentary TopSpot40 access is active.',
            unlimited: 'No payment is required, and your access has no expiration date.',
            expires: 'No payment is required during your complimentary access. Access ends:',
            already: 'You’ve already applied this code.', unchanged: 'Your existing complimentary access has been kept because it lasts at least as long as this offer.',
            ended: 'Your complimentary access has ended. Check your account for current membership options.',
            continue: 'Continue to TopSpot40',
            invalid_code: 'That access code wasn’t recognized. Please check it and try again.',
            unavailable_code: 'This access code is no longer available.',
            rate_limited: 'Too many attempts. Please wait 15 minutes and try again.',
            sign_in_required: 'Please sign in before applying an access code.',
            paid_subscription: 'You have a paid subscription. Please contact TopSpot40 to arrange complimentary access; an access code does not cancel existing billing.',
            temporarily_unavailable: 'We couldn’t apply your code. Please try again.'
        },
        es: {
            title: '¿Tienes un código de acceso?', label: 'Código de acceso', hint: 'Introduce la palabra o el código que recibiste.',
            apply: 'Aplicar código', applying: 'Aplicando…', activated: 'Tu acceso de cortesía a TopSpot40 está activo.',
            unlimited: 'No se requiere pago y tu acceso no tiene fecha de vencimiento.',
            expires: 'No se requiere pago durante tu acceso de cortesía. El acceso termina:',
            already: 'Ya has aplicado este código.', unchanged: 'Se ha conservado tu acceso de cortesía actual porque dura al menos tanto como esta oferta.',
            ended: 'Tu acceso de cortesía ha terminado. Consulta las opciones de membresía en tu cuenta.',
            continue: 'Continuar a TopSpot40',
            invalid_code: 'No reconocemos ese código de acceso. Revísalo e inténtalo de nuevo.',
            unavailable_code: 'Este código de acceso ya no está disponible.',
            rate_limited: 'Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.',
            sign_in_required: 'Inicia sesión antes de aplicar un código de acceso.',
            paid_subscription: 'Tienes una suscripción de pago. Contacta con TopSpot40 para obtener acceso de cortesía; el código no cancela los cobros existentes.',
            temporarily_unavailable: 'No pudimos aplicar el código. Inténtalo de nuevo.'
        },
        ptbr: {
            title: 'Tem um código de acesso?', label: 'Código de acesso', hint: 'Digite a palavra ou o código que você recebeu.',
            apply: 'Aplicar código', applying: 'Aplicando…', activated: 'Seu acesso de cortesia ao TopSpot40 está ativo.',
            unlimited: 'Nenhum pagamento é necessário e seu acesso não tem data de expiração.',
            expires: 'Nenhum pagamento é necessário durante seu acesso de cortesia. O acesso termina em:',
            already: 'Você já aplicou este código.', unchanged: 'Seu acesso de cortesia atual foi mantido porque dura pelo menos tanto quanto esta oferta.',
            ended: 'Seu acesso de cortesia terminou. Confira as opções de assinatura na sua conta.',
            continue: 'Continuar para o TopSpot40',
            invalid_code: 'Esse código de acesso não foi reconhecido. Confira e tente novamente.',
            unavailable_code: 'Este código de acesso não está mais disponível.',
            rate_limited: 'Muitas tentativas. Aguarde 15 minutos e tente novamente.',
            sign_in_required: 'Entre na sua conta antes de aplicar um código de acesso.',
            paid_subscription: 'Você tem uma assinatura paga. Entre em contato com o TopSpot40 para obter acesso de cortesia; o código não cancela cobranças existentes.',
            temporarily_unavailable: 'Não foi possível aplicar seu código. Tente novamente.'
        }
    } as const;
    $: text = copy[language];
    $: active = result?.complimentary_access &&
        (!result.access_expires_at || Date.parse(result.access_expires_at) > Date.now());
    $: errorText = error && error in text ? text[error as keyof typeof text] : text.temporarily_unavailable;
    onMount(() => { language = readLanguagePreference(); });

    function formatDate(value: string) {
        return new Intl.DateTimeFormat(language === 'ptbr' ? 'pt-BR' : language, {
            year: 'numeric', month: 'long', day: 'numeric'
        }).format(new Date(value));
    }
    async function apply() {
        if (busy) return;
        busy = true;
        error = '';
        result = null;
        try {
            result = await redeemAccessCode(code);
            code = '';
            onApplied(result);
        } catch (err) {
            error = err instanceof AccessCodeError ? err.code : 'temporarily_unavailable';
        } finally {
            busy = false;
        }
    }
</script>

<details class="access-code">
    <summary>{text.title}</summary>
    <form class="ph-no-capture" on:submit|preventDefault={apply} aria-busy={busy}>
        <label>
            <span>{text.label}</span>
            <input bind:value={code} type="text" maxlength="128" autocomplete="off"
                autocapitalize="none" spellcheck={false} required disabled={busy} />
        </label>
        <small>{text.hint}</small>
        <button type="submit" disabled={busy || !code.trim()}>{busy ? text.applying : text.apply}</button>
    </form>
    {#if error}<p class="error" role="alert">{errorText}</p>{/if}
    {#if result}
        <div class="confirmation" role="status" aria-live="polite">
            {#if result.result === 'already_redeemed'}<p>{text.already}</p>{/if}
            {#if result.result === 'unchanged'}<p>{text.unchanged}</p>{/if}
            {#if active}
                <p>{text.activated}</p>
                {#if result.access_expires_at}
                    <p>{text.expires} <strong>{formatDate(result.access_expires_at)}</strong></p>
                {:else}<p>{text.unlimited}</p>{/if}
            {:else}<p>{text.ended}</p>{/if}
            <a class="continue" href="/dashboard" data-sveltekit-reload>{text.continue}</a>
        </div>
    {/if}
</details>

<style>
    .access-code { width: 100%; max-width: 520px; margin: 1rem auto; text-align: left; }
    summary { cursor: pointer; color: #f6db81; padding: .75rem 0; font-weight: 600; }
    form { display: flex; flex-direction: column; gap: .65rem; }
    label { display: flex; flex-direction: column; gap: .4rem; }
    input { box-sizing: border-box; width: 100%; min-height: 48px; padding: .7rem; border: 1px solid #888; border-radius: 6px; background: #111; color: white; font: inherit; }
    button, .continue { display: inline-block; box-sizing: border-box; min-height: 48px; padding: .75rem 1rem; border: 0; border-radius: 6px; background: #1db954; color: #07140c; font: inherit; font-weight: 700; text-align: center; text-decoration: none; }
    button { cursor: pointer; }
    button:disabled { opacity: .6; cursor: default; }
    small { color: #ddd; }
    p { line-height: 1.5; }
    .error { color: #ffb4b4; }
    .confirmation { margin-top: 1rem; padding: 1rem; border: 1px solid #1db954; border-radius: 8px; }
    :is(input, button, summary, a):focus-visible { outline: 3px solid #f6db81; outline-offset: 3px; }
</style>
