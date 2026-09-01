<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { createEarlyMemberCheckout, createStandardCheckout, type SubscriptionStatus } from '$lib/api/membership';
	import { readLanguagePreference } from '$lib/languagePreferences';

	export let data: { subscriptionStatus?: SubscriptionStatus };
	let language: 'en' | 'es' | 'ptbr' = 'en';
	let loadingPlan: 'annual' | 'monthly' | 'standard' | null = null;
	let errorMessage = '';
	$: status = data?.subscriptionStatus ?? {};
	$: accessState = status.access_state ?? 'none';

	const copy = {
		en: {
			freeTitle: 'Your promotional access is active',
			freeBody: 'No payment information is required during 2026.',
			complimentaryTitle: 'Complimentary Membership',
			complimentaryBody: 'Your membership is complimentary. No payment is required.',
			expires: 'Your complimentary access ends',
			graceTitle: 'Your reserved early-member offer',
			graceBody: 'Keep your early-member pricing as long as your subscription remains continuously active.',
			annual: '$49.99/year',
			annualDetail: 'Best value',
			monthly: '$4.99/month',
			annualButton: 'Choose annual',
			monthlyButton: 'Choose monthly',
			graceContinue: 'Continue with promotional access',
			standardTitle: 'Choose your TopSpot40 plan',
			expiredTitle: 'Your promotional access has ended',
			standardBody: 'Choose a paid plan to continue using TopSpot40.',
			noAccessBody: 'Choose a paid plan to start using TopSpot40.',
			standardButton: 'Continue to subscription',
			loading: 'Opening secure checkout…',
			error: 'We could not start checkout. Please try again.',
			dashboard: 'Go to dashboard'
		},
		es: {
			freeTitle: 'Tu acceso promocional está activo',
			freeBody: 'No se requiere información de pago durante 2026.',
			complimentaryTitle: 'Membresía de cortesía',
			complimentaryBody: 'Tu membresía es de cortesía. No se requiere pago.',
			expires: 'Tu acceso de cortesía termina',
			graceTitle: 'Tu oferta reservada para miembros fundadores',
			graceBody: 'Conserva el precio de miembro fundador mientras tu suscripción permanezca activa sin interrupciones.',
			annual: 'US$49.99/año',
			annualDetail: 'Mejor valor',
			monthly: 'US$4.99/mes',
			annualButton: 'Elegir anual',
			monthlyButton: 'Elegir mensual',
			graceContinue: 'Continuar con el acceso promocional',
			standardTitle: 'Elige tu plan de TopSpot40',
			expiredTitle: 'Tu acceso promocional ha finalizado',
			standardBody: 'Elige un plan de pago para seguir usando TopSpot40.',
			noAccessBody: 'Elige un plan de pago para comenzar a usar TopSpot40.',
			standardButton: 'Continuar a suscripción',
			loading: 'Abriendo el pago seguro…',
			error: 'No pudimos iniciar el pago. Inténtalo de nuevo.',
			dashboard: 'Ir al panel'
		},
		ptbr: {
			freeTitle: 'Seu acesso promocional está ativo',
			freeBody: 'Nenhuma informação de pagamento é necessária durante 2026.',
			complimentaryTitle: 'Assinatura de cortesia',
			complimentaryBody: 'Sua assinatura é de cortesia. Nenhum pagamento é necessário.',
			expires: 'Seu acesso de cortesia termina em',
			graceTitle: 'Sua oferta reservada para membros fundadores',
			graceBody: 'Mantenha o preço de membro fundador enquanto sua assinatura permanecer ativa sem interrupções.',
			annual: 'US$49,99/ano',
			annualDetail: 'Melhor valor',
			monthly: 'US$4,99/mês',
			annualButton: 'Escolher anual',
			monthlyButton: 'Escolher mensal',
			graceContinue: 'Continuar com o acesso promocional',
			standardTitle: 'Escolha seu plano TopSpot40',
			expiredTitle: 'Seu acesso promocional terminou',
			standardBody: 'Escolha um plano pago para continuar usando o TopSpot40.',
			noAccessBody: 'Escolha um plano pago para começar a usar o TopSpot40.',
			standardButton: 'Continuar para a assinatura',
			loading: 'Abrindo o checkout seguro…',
			error: 'Não foi possível iniciar o checkout. Tente novamente.',
			dashboard: 'Ir para o painel'
		}
	} as const;

	function resetCheckoutState() {
		loadingPlan = null;
		errorMessage = '';
	}

	onMount(() => {
		language = readLanguagePreference();
		window.addEventListener('pageshow', resetCheckoutState);

		return () => window.removeEventListener('pageshow', resetCheckoutState);
	});
	$: text = copy[language];

	function formatDate(value?: string | null) {
		if (!value) return '';

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;

		return new Intl.DateTimeFormat(language === 'ptbr' ? 'pt-BR' : language, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	async function checkout(plan: 'annual' | 'monthly' | 'standard') {
		if (loadingPlan) return;

		loadingPlan = plan;
		errorMessage = '';

		try {
			const url =
				plan === 'standard'
					? await createStandardCheckout()
					: await createEarlyMemberCheckout(plan);
			window.location.assign(url);
		} catch {
			errorMessage = text.error;
			loadingPlan = null;
		}
	}
</script>

<main class="container">
	{#if accessState === 'free_2026'}
		<h1>{text.freeTitle}</h1>
		<p>{text.freeBody}</p>
		<button type="button" on:click={() => goto('/dashboard')}>{text.dashboard}</button>
	{:else if accessState === 'complimentary'}
		<h1>{text.complimentaryTitle}</h1>
		<p>{text.complimentaryBody}</p>
		{#if status.access_expires_at}
			<p>{text.expires}: <strong>{formatDate(status.access_expires_at)}</strong></p>
		{/if}
		<button type="button" on:click={() => goto('/dashboard')}>{text.dashboard}</button>
	{:else if accessState === 'grace_2027'}
		<h1>{text.graceTitle}</h1>
		<p>{text.graceBody}</p>
		<div class="plans">
			<button type="button" class="plan featured" on:click={() => checkout('annual')} disabled={loadingPlan !== null}>
				<strong>{text.annual}</strong>
				<span>{text.annualDetail}</span>
				<small>{loadingPlan === 'annual' ? text.loading : text.annualButton}</small>
			</button>
			<button type="button" class="plan" on:click={() => checkout('monthly')} disabled={loadingPlan !== null}>
				<strong>{text.monthly}</strong>
				<small>{loadingPlan === 'monthly' ? text.loading : text.monthlyButton}</small>
			</button>
		</div>
		<button type="button" on:click={() => goto('/dashboard')} disabled={loadingPlan !== null}>{text.graceContinue}</button>
	{:else}
		<h1>{accessState === 'expired' ? text.expiredTitle : text.standardTitle}</h1>
		<p>{accessState === 'expired' ? text.standardBody : text.noAccessBody}</p>
		<button type="button" on:click={() => checkout('standard')} disabled={loadingPlan !== null}>
			{loadingPlan === 'standard' ? text.loading : text.standardButton}
		</button>
	{/if}
	{#if errorMessage}
		<p class="error" role="alert">{errorMessage}</p>
	{/if}
</main>

<style>
	.container {
		align-items: center;
		background: linear-gradient(135deg, #121212, #1db95420);
		box-sizing: border-box;
		color: white;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	h1 {
		font-size: clamp(2rem, 6vw, 3rem);
		margin: 0;
	}

	p {
		color: #d8d8d8;
		line-height: 1.55;
		margin: 0;
		max-width: 620px;
	}

	button {
		background: #1db954;
		border: 0;
		border-radius: 7px;
		color: #07140c;
		cursor: pointer;
		font: inherit;
		font-weight: 700;
		min-height: 48px;
		padding: .8rem 1.3rem;
	}

	button:disabled {
		cursor: wait;
		opacity: .65;
	}

	.plans {
		display: grid;
		gap: 1rem;
		grid-template-columns: repeat(2, minmax(0, 240px));
		margin-top: .75rem;
	}

	.plan {
		background: #222;
		border: 1px solid #555;
		color: white;
		display: flex;
		flex-direction: column;
		gap: .5rem;
		justify-content: center;
		min-height: 160px;
	}

	.plan.featured {
		background: #1db954;
		border-color: #77e49e;
		color: #07140c;
	}

	.plan strong {
		font-size: 1.45rem;
	}

	.plan small {
		font-size: .9rem;
	}

	.error {
		color: #ffb4b4;
	}

	@media (max-width: 560px) {
		.plans {
			grid-template-columns: 1fr;
			width: min(100%, 320px);
		}
	}
</style>
