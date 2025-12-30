<script lang="ts">
	export let recentTracks: {
		id: number;
		track_name: string;
		artist_name: string;
		album_artwork: string;
	}[] = [];
</script>

<div class="recent-tracks">
	<h2 class="heading">Recently Played</h2>
	{#if recentTracks.length > 0}
		<ul>
			{#each recentTracks as track (track.id)}
				<li class="track-card" role="button" tabindex="0">
					<img
						src={track.album_artwork}
						alt={`Album artwork for ${track.track_name} by ${track.artist_name}`}
					/>
					<div class="info">
						<p class="title">{track.track_name}</p>
						<p class="artist">{track.artist_name}</p>
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No recent tracks yet. Start listening!</p>
	{/if}
</div>

<style>
	.recent-tracks {
		margin-top: 0;
		padding: 0;
	}
	.heading {
		font-size: 1.5rem;
		font-weight: bold;
	}
	ul {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		overflow-y: hidden; /* prevent vertical scroll */
		list-style: none;
		padding: 0;
		margin: 0; /* remove default margin */
		width: 100%; /* ensure it spans the section */
		scrollbar-width: thin; /* Firefox */
	}
	.track-card {
		background: #121212;
		border-radius: 12px;
		padding: 0.5rem;
		width: 150px;
		min-width: 150px;
		cursor: pointer;
		transition: transform 0.2s;
	}
	.track-card:hover {
		transform: scale(1.05);
	}
	img {
		width: 100%;
		border-radius: 8px;
		display: block;
	}
	.info {
		margin-top: 0.5rem;
	}
	.title {
		font-weight: 600;
	}
	.artist {
		font-size: 0.9rem;
		color: #aaa;
	}
</style>
