<script>
	import { onMount } from 'svelte';
	import { getBackendUrl } from '$lib/config';

    let verified = false;
    let error = null;	

	onMount(async () => {
		console.log('✅ Payment success page loaded');

		const params = new URLSearchParams(window.location.search);
		const session_id = params.get('session_id');

		console.log('Session ID:', session_id);

		if (!session_id) {
			console.error('❌ No session_id found in URL');
			return;
		}

		try {
			const res = await fetch(
				`${getBackendUrl()}/api/verify-subscription?session_id=${session_id}`,
				{
					method: 'GET',
					credentials: 'include'
				}
			);

			const data = await res.json();
			console.log('✅ Verify response:', data);
			if (data.is_active) {
				verified = true;
				window.location.href = '/dashboard';
			} else {
				window.location.href = '/create-account';
			}
		} catch (err) {
			console.error('❌ Error verifying subscription:', err);
		}

	});
</script>

<div class="success-container">
	<h1>🎉 Payment Successful!</h1>
	<p>Thank you for subscribing to TopSpot40. Your account is now active.</p>
	<a href="/dashboard" class="btn">Go to Home</a>
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
