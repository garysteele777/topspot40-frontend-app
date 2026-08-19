<script lang="ts">
	import {
		getMarketingPreference,
		setMarketingPreference,
		type MarketingPreference
	} from '$lib/api/marketingPreferences';

	export let visible = false;
	export let subscriptionStatus: any = null;
	export let onClose: () => void;

	let loading = false;
	let saving = false;
	let error = '';
	let success = '';
	let preference: MarketingPreference | null = null;

	async function loadPreference() {
		loading = true;
		error = '';
		success = '';

		try {
			preference = await getMarketingPreference();
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: 'Unable to load your marketing preference. Please try again.';
		} finally {
			loading = false;
		}
	}

	async function updatePreference(marketingOptIn: boolean) {
		if (saving || loading) return;

		saving = true;
		error = '';
		success = '';

		try {
			preference = await setMarketingPreference(marketingOptIn);
			success = marketingOptIn
				? 'You are now subscribed to marketing emails.'
				: 'You have been unsubscribed from marketing emails.';
		} catch (err) {
			error =
				err instanceof Error
					? err.message
					: 'Unable to update your marketing preference. Please try again.';
		} finally {
			saving = false;
		}
	}

	function handleClose(e?: MouseEvent) {
		e?.preventDefault?.();

		loading = false;
		saving = false;
		error = '';
		success = '';
		preference = null;

		onClose?.();
	}

	function accessLabel(status: any): string {
		switch (status?.access_state) {
			case 'paid':
				return 'Paid subscription';
			case 'free_2026':
				return '2026 promotional access';
			case 'grace_2027':
				return '2027 promotional grace period';
			case 'tester':
				return 'Tester access';
			case 'expired':
				return 'Promotional access expired';
			case 'none':
				return 'No active subscription';
			default:
				return status?.status ?? 'Unknown';
		}
	}

	function formatDate(value: string | null | undefined): string {
		if (!value) return '';

		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;

		return new Intl.DateTimeFormat('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	$: if (visible && !loading && !preference && !error) {
		loadPreference();
	}
</script>

{#if visible}
	<!--
		The overlay closes the modal when clicked.
		This is structural modal behavior, not a button-style control.
	-->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="overlay" on:click={handleClose}>
		<!--
			The popup stops clicks inside the modal from closing it.
			This is intentional event handling for modal layout.
		-->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="popup" on:click|stopPropagation>
			<h2>Manage Account / Subscription</h2>

			<section class="section">
				<h3>Subscription</h3>

				{#if subscriptionStatus}
					<p class="status">
						Current access:
						<strong>{accessLabel(subscriptionStatus)}</strong>
					</p>

					{#if subscriptionStatus.current_period_end}
						<p class="status">
							Current billing period ends:
							<strong>{formatDate(subscriptionStatus.current_period_end)}</strong>
						</p>
					{/if}

					{#if subscriptionStatus.cancel_at_period_end}
						<p class="status">
							Your subscription is scheduled to cancel at the end of the current billing period.
						</p>
					{/if}
				{:else}
					<p class="status">Subscription information is unavailable.</p>
				{/if}
			</section>

			<section class="section">
				<h3>Marketing Emails</h3>
				<p>
					Manage whether TopSpot40 can send you marketing emails. This does not affect your
					TopSpot40 account or subscription.
				</p>

			{#if loading}
				<p class="status">Loading your preference...</p>
			{:else}
				{#if preference}
					<p class="status">
						Current status:
						<strong>{preference.marketing_opt_in ? 'Subscribed' : 'Not subscribed'}</strong>
					</p>
				{/if}

				{#if error}
					<p class="error">{error}</p>
				{/if}

				{#if success}
					<p class="success">{success}</p>
				{/if}

				<div class="actions">
					<button
						type="button"
						on:click={() => updatePreference(true)}
						disabled={saving || preference?.marketing_opt_in === true}
					>
						{saving ? 'Saving...' : 'Opt in'}
					</button>
					<button
						type="button"
						class="secondary"
						on:click={() => updatePreference(false)}
						disabled={saving || preference?.marketing_opt_in === false}
					>
						{saving ? 'Saving...' : 'Unsubscribe'}
					</button>
				</div>
			{/if}

			</section>

			<div class="actions">
				<button type="button" class="secondary" on:click={handleClose} disabled={saving}>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.popup {
		background: #1e1e1e;
		color: white;
		padding: 2rem;
		border-radius: 12px;
		width: 350px;
		text-align: left;
	}

	.status {
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
	}

	button {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	button:disabled {
		cursor: not-allowed;
		opacity: 0.65;
	}

	button:first-of-type {
		background: #1db954;
		color: white;
	}

	.secondary {
		background: #444;
		color: white;
	}

	.error {
		color: #ff4d4f;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}

	.success {
		color: #1db954;
		margin-top: 0.5rem;
		font-size: 0.9rem;
	}
</style>
