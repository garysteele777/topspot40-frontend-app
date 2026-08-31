<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getBackendUrl } from '$lib/config';
	import { readLanguagePreference } from '$lib/languagePreferences';

	let language: 'en' | 'es' | 'ptbr' = 'en';
	let state: 'verifying' | 'error' = 'verifying';
	const copy = {
		en: {
			verifying: 'Verifying your subscription…',
			detail: 'Please wait while we confirm your payment.',
			error: 'We could not verify your subscription. Please return to your account and try again.',
			account: 'Return to account'
		},
		es: {
			verifying: 'Verificando tu suscripción…',
			detail: 'Espera mientras confirmamos tu pago.',
			error: 'No pudimos verificar tu suscripción. Regresa a tu cuenta e inténtalo de nuevo.',
			account: 'Volver a la cuenta'
		},
		ptbr: {
			verifying: 'Verificando sua assinatura…',
			detail: 'Aguarde enquanto confirmamos seu pagamento.',
			error: 'Não foi possível verificar sua assinatura. Volte à sua conta e tente novamente.',
			account: 'Voltar para a conta'
		}
	} as const;
	$: text = copy[language];

	onMount(async () => {
		language = readLanguagePreference();
		const sessionId = new URLSearchParams(window.location.search).get('session_id');
		if (!sessionId) {
			state = 'error';
			return;
		}
		try {
			const response = await fetch(
				`${getBackendUrl()}/api/verify-subscription?session_id=${encodeURIComponent(sessionId)}`,
				{ credentials: 'include' }
			);
			const result = await response.json().catch(() => null);
			if (response.ok && result?.is_active) {
				await goto('/dashboard', { replaceState: true });
				return;
			}
			await goto('/create-account', { replaceState: true });
		} catch {
			state = 'error';
		}
	});
</script>

<main class="success-container" aria-live="polite">
	{#if state === 'verifying'}
		<h1>{text.verifying}</h1>
		<p>{text.detail}</p>
	{:else}
		<h1>{text.error}</h1>
		<a href="/create-account" class="btn">{text.account}</a>
	{/if}
</main>

<style>
	.success-container {
		align-items: center;
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
		color: #1db954;
		font-size: clamp(2rem, 6vw, 2.5rem);
	}

	p {
		font-size: 1.2rem;
	}

	.btn {
		background: #1db954;
		border-radius: 5px;
		color: #07140c;
		font-weight: 700;
		padding: .8rem 1.5rem;
		text-decoration: none;
	}
</style>
