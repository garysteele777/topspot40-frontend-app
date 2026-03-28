<script lang="ts">
	import { getBackendUrl } from '$lib/config';

	function goBack() {
		history.back();
	}


	// Redirect user to Spotify OAuth
	function signInWithSpotify() {
		// The backend route that starts the Spotify OAuth flow
		window.location.href = `${getBackendUrl()}/auth/spotify/login`;
	}

</script>

<div class="go-back-button-wrapper">
	<button on:click={goBack} class="go-back-button"> Go Back </button>
</div>

<!--
<h1>Sign In</h1>
<p>Sign in functionality will be added here.</p>
-->
<div class="signin-container">
	<h1>Sign In</h1>
	<p>Sign in with your Spotify account to continue.</p>
	<button on:click={signInWithSpotify} class="spotify-signin-button">
		Sign in with Spotify
	</button>
</div>

<style>

	/* Reset default margins */
	:global(body, html, #svelte) {
		margin: 0;
		padding: 0;
		height: 100%;
	}

	.go-back-button-wrapper {
		padding: 1rem;
	}

	.go-back-button {
		position: relative;
		top: 2rem;
		left: 1rem;
		background-color: #333;
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 9999px;
		cursor: pointer;
		border: none;
		font-weight: 600;
		font-size: 1rem;
		z-index: 100;
		transition: background-color 0.3s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
	}


	.signin-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%; /* Full viewport height */
		text-align: center;
		padding: 1rem;
		background: linear-gradient(135deg, #121212, #1db95420); /* subtle Spotify-like background */
	}

	.signin-container h1 {
		font-size: 2.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		color: #fff;
	}

	.signin-container p {
		font-size: 1.2rem;
		color: #ddd;
		margin-bottom: 2rem;
		max-width: 400px;
	}

	.spotify-signin-button {
		padding: 0.85rem 2rem;
		background-color: #1db954;
		color: white;
		font-weight: 700;
		border-radius: 9999px;
		border: none;
		cursor: pointer;
		font-size: 1.1rem;
		transition: background-color 0.3s ease, transform 0.2s ease;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
	}

	.spotify-signin-button:hover {
		background-color: #17a34a;
		transform: translateY(-2px);
	}




	@media (max-width: 640px) {
		.go-back-button:hover {
			background-color: #1db954;
			padding: 0.65rem 1rem;
			font-size: 0.95rem;
			top: 0.75rem;
			left: 0.75rem;
		}
	}

	.go-back-button:hover {
		background-color: #1db954;
	}
</style>
