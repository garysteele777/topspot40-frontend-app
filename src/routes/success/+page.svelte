<script>
	import { onMount } from 'svelte';

	onMount(() => {
		console.log('✅ Payment success page loaded');
	});
</script>

<div class="success-container">
	<h1>🎉 Payment Successful!</h1>
	<p>Thank you for subscribing to TopSpot40. Your account is now active.</p>
	<a href="/" class="btn">Go to Home</a>
</div>

<style>
	.success-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		color: #1db954; /* Spotify green */
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}

	p {
		font-size: 1.2rem;
		color: white;
		max-width: 500px;
	}

	.btn {
		display: inline-block;
		margin-top: 2rem;
		padding: 0.8rem 1.5rem;
		background: #1db954;
		color: white;
		border-radius: 5px;
		text-decoration: none;
		font-size: 1.1rem;
	}

	.btn:hover {
		background: #17a74b;
	}
</style>
