<script lang="ts">
	function goBack() {
		history.back();
	}
</script>

<div class="go-back-button-wrapper">
	<button on:click={goBack} class="go-back-button"> Go Back </button>
</div>

<main class="center-text">
	<h1>Oops! Spotify Premium is Required</h1>
	<p>Sorry, to use this feature you must have a Spotify Premium account.</p>
	<p>Please upgrade your Spotify subscription and try again.</p>
	<a href="https://www.spotify.com/premium/" target="_blank" rel="noopener noreferrer">
		Learn More About Spotify Premium
	</a>
</main>

<style>
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

	.center-text {
		text-align: center;
		margin-top: 4rem;
	}
</style>
