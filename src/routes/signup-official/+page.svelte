<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { getBackendUrl } from '$lib/config';

	function signInWithSpotify() {
		window.location.href = `${getBackendUrl()}/api/auth/spotify/login`; // /api/auth/ ?
	}

	function goBack() {
		history.back();
	}
</script>

<div class="go-back-button-wrapper">
	<button on:click={goBack} class="go-back-button"> Go Back </button>
</div>

<div class="page-wrapper">
	<div class="signup-box">
		<h1>Sign Up</h1>
		<p>Please note: Only Spotify Premium users can sign up and join us.</p>
		<div class="spotify-btn">
			<button on:click={signInWithSpotify}> Sign up with Spotify </button>
		</div>
	</div>
</div>

<style>
	.page-wrapper {
		display: flex;
		justify-content: center; /* horizontal center */
		align-items: center; /* vertical center */
		height: 100vh; /* full viewport height */
	}

	/* Box styling */
	.signup-box {
		background-color: rgba(255, 255, 255, 0.1);
		padding: 2.5rem 3rem;
		border-radius: 12px;
		box-shadow: 0 0 36px rgb(29, 185, 84, 0.7);
		max-width: 400px;
		width: 100%;
		text-align: center;
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

	.spotify-btn button {
		padding: 0.75rem 1.5rem;
		background-color: #1db954;
		border: none;
		border-radius: 9999px;
		color: white;
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
		box-shadow: 0 4px 8px rgb(29 185 84 / 0.5);
	}
	.spotify-btn button:hover {
		background-color: #1ed760;
	}
	.spotify-btn button:active {
		background-color: #1aa34a;
	}
</style>
