<script lang="ts">
	function goBack() {
		history.back();
	}
</script>

<div class="go-back-button-wrapper">
	<button on:click={goBack} class="go-back-button"> Go Back </button>
</div>

<main class="about-content">
	<h1>About TopSpot40</h1>
	<p>
		TopSpot40 is an interactive music discovery guide and companion. It combines
		curated song rankings by genre and decade, artist spotlights, collections,
		music history, and radio-inspired narration.
	</p>
	<p>
		When you choose a song, TopSpot40 can open the selected track in Spotify.
		Spotify handles music playback, advertisements, account restrictions, and
		Free or Premium behavior.
	</p>
	<p>TopSpot40 does not include a Spotify Premium subscription.</p>
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

	.about-content {
		max-width: 720px;
		margin: 5rem auto 0;
		padding: 0 1.5rem;
		line-height: 1.6;
	}

	.about-content h1 {
		margin-bottom: 1rem;
	}

	.about-content p {
		margin: 0 0 1rem;
	}
</style>
