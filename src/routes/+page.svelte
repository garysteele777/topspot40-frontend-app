<script lang="ts">
	import { goto } from '$app/navigation';

	function go(path: string) {
		goto(path);
	}
</script>

{#if import.meta.env.DEV}
	<div style="position:fixed;top:4px;right:6px;font-size:11px;opacity:.5;z-index:9999">
		ROUTE: /
	</div>
{/if}

<div class="page-shell">
	<div class="page">
		<h1 class="title">TopSpot40</h1>
		<p class="subtitle">Choose where you want to start.</p>

		<div class="grid">
			<button class="card" on:click={() => go('/options-v2')}>
				<div class="cardTitle">🎛 Options</div>
				<div class="cardDesc">Pick decade/genre or collections, language, voices, ranks, order.</div>
			</button>

			<button class="card" on:click={() => go('/feedback')}>
				<div class="cardTitle">💬 Feedback</div>
				<div class="cardDesc">Isaiah’s endpoint UI (or your feedback page) lives here.</div>
			</button>

			<button class="card" disabled>
				<div class="cardTitle">💳 Stripe (coming)</div>
				<div class="cardDesc">Payments work-in-progress.</div>
			</button>

			<button class="card" disabled>
				<div class="cardTitle">🔐 Spotify Auth (coming)</div>
				<div class="cardDesc">Login/token tools work-in-progress.</div>
			</button>
		</div>
	</div>
</div>

<style>
	.page-shell {
		min-height: 100vh;
		background: radial-gradient(circle at top, #1f1f1f 0, #121212 45%, #050505 100%);
		padding-bottom: 4rem;
	}

	.page {
		max-width: 980px;
		margin: 0 auto;
		padding: 3rem 1.25rem;
		color: #f5f5f5;
	}

	.title {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	.subtitle {
		margin: 0 0 2rem;
		opacity: 0.8;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	@media (max-width: 720px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}

	.card {
		text-align: left;
		padding: 1rem 1.1rem;
		border-radius: 16px;
		border: 1px solid rgba(207, 184, 124, 0.35);
		background: rgba(18, 18, 18, 0.95);
		color: inherit;
		cursor: pointer;
		box-shadow: 0 10px 28px rgba(0, 0, 0, 0.6);
		transition: transform 0.16s ease-out, box-shadow 0.16s ease-out, border-color 0.16s ease-out;
	}

	.card:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.75);
		border-color: rgba(207, 184, 124, 0.75);
	}

	.card:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cardTitle {
		font-weight: 700;
		margin-bottom: 0.35rem;
	}

	.cardDesc {
		opacity: 0.8;
		font-size: 0.95rem;
		line-height: 1.25rem;
	}
</style>
