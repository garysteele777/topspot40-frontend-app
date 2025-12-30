<script lang="ts">
	import { onMount } from 'svelte';

	type Playlist = {
		id: number;
		title: string;
		decade: string;
		genre: string;
		artwork: string;
	};

	export let playlists: Playlist[] = [];

	// Placeholder data used only when no playlists are passed in
	const placeholder: Playlist[] = [
		{
			id: 1,
			title: '1980s Pop Top 40',
			decade: '1980s',
			genre: 'Pop',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273example1'
		},
		{
			id: 2,
			title: '1990s Rock Top 40',
			decade: '1990s',
			genre: 'Rock',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273example2'
		}
	];

	// Local list we actually render (prop or placeholder)
	let items: Playlist[] = [];
	$: items = playlists.length ? playlists : placeholder;

	// Optional: keep console info the first time it mounts
	onMount(() => {
		if (!playlists.length) {
			console.info('[DecadeGenreBrowser] Using placeholder playlists');
		}
	});

	function selectPlaylist(playlistId: number) {
		// TODO: emit a custom event or navigate
		console.log('Selected playlist', playlistId);
	}
</script>

<div class="playlist-browser">
	<h2>Browse Top 40 by Decade & Genre</h2>

	{#if items.length > 0}
		<div class="playlist-grid">
			{#each items as pl (pl.id)}
				<div
					class="playlist-card"
					role="button"
					tabindex="0"
					on:click={() => selectPlaylist(pl.id)}
				>
					<img src={pl.artwork} alt={`Artwork for ${pl.title}`} />
					<div class="info">
						<p class="title">{pl.title}</p>
						<p class="sub">{pl.decade} • {pl.genre}</p>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>No playlists available yet.</p>
	{/if}
</div>

<style>
	.playlist-grid {
		display: flex;
		gap: 1rem;
		overflow-x: auto;
		padding: 1rem 0;
	}
	.playlist-card {
		min-width: 150px;
		border-radius: 12px;
		background: #121212;
		cursor: pointer;
		transition: transform 0.2s;
		padding: 0.5rem;
	}
	.playlist-card:hover {
		transform: scale(1.05);
	}
	.playlist-card img {
		width: 100%;
		border-radius: 8px;
		display: block;
	}
	.info {
		margin-top: 0.5rem;
		text-align: center;
	}
	.title {
		font-weight: 600;
	}
	.sub {
		font-size: 0.9rem;
		color: #aaa;
	}
</style>
