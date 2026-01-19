<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import RecentTracks from '$lib/components/RecentTracks.svelte';
	import DecadeGenreBrowser from '$lib/components/DecadeGenreBrowser.svelte';
	//import PlaylistModal from '$lib/components/PlaylistModal.svelte';
	import { goto } from '$app/navigation';
	//import { onMount } from 'svelte';

	let showModal = false;

	/*
	function openModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}
		*/

	// Example placeholder data
	let recentTracks = [
		{
			id: 1,
			track_name: 'where were you when the world stopped turning',
			artist_name: 'alan jackson',
			album_artwork: 'https://i.scdn.co/image/ab67616d0000b273c5d5d983f8d9edc7f695cc72'
		},
		{
			id: 2,
			track_name: 'courtesy of the red white and blue the angry american',
			artist_name: 'toby keith',
			album_artwork: 'https://i.scdn.co/image/ab67616d0000b273bb5c54a68f9ce31f83b98de4'
		}
	];

	let playlists = [
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
		},
		{
			id: 3,
			title: '2000s Country Top 40',
			decade: '2000s',
			genre: 'Country',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273example3'
		},
		{
			id: 4,
			title: '2010s Pop Top 40',
			decade: '2000s',
			genre: 'Pop',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273example4'
		},
		{
			id: 5,
			title: '1970s Rock Top 40',
			decade: '1970s',
			genre: 'Rock',
			artwork: 'https://i.scdn.co/image/ab67616d0000b273example5'
		}
	];



	// Navigate to the new player route
	function goToPlayer() {
		goto('/options-v2');
	}

</script>

<Header />

<div class="dashboard-wrapper">
	<main class="dashboard">
		<section class="decade-genre-browser">
			<h2>Get Started with TopSpot40</h2>
			<button on:click={goToPlayer}>Get Started</button>
		</section>

		<section class="recent-tracks">
			<RecentTracks {recentTracks} />
		</section>

		<section>
			<DecadeGenreBrowser {playlists} />
		</section>
	</main>
</div>

<!--
{#if showModal}
	<div on:click={closeModal}></div>
	<div><PlaylistModal visible={true} onClose={closeModal} /></div>
{/if}
-->

<style>
	:global(body) {
		margin: 0; /* remove default body margin */
	}
	.dashboard-wrapper {
		min-height: 100vh; /* full viewport height */
		background: radial-gradient(circle at 30% 30%, #1db954 5%, #121212 90%);
		display: flex;
		flex-direction: column;
	}

	.dashboard {
		flex: 1; /* fills the wrapper */
		padding: 2rem;
		display: flex;
		flex-direction: column;
		gap: 3rem;
		box-sizing: border-box; /* ensure padding doesn’t create extra space */
	}

	button {
		background-color: #121212; /* TopSpot40 dark background */
		color: white;
		padding: 0.8rem 1.5rem;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	button:hover {
		background-color: #1db954;
	}
</style>
