<script lang="ts">
	import { playlistSettingsStore, type PlaylistSettings } from '$lib/stores/playlistSettings';
	import { goto } from '$app/navigation';

	export let visible: boolean = false;
	export let onClose: () => void;

	// Fixed options-page
	const decades = ['1950s', '1960s', '1970s', '1980s', '1990s', '2000s', '2010s', '2020s'] as const;
	const genres = [
		'Pop',
		'Rock',
		'Country',
		'R&B/Soul',
		'Latin Global',
		'Blues Jazz',
		'Folk Acoustic',
		'TV Themes'
	] as const;

	type Order = 'countdown' | 'countup' | 'random' | 'custom';
	type ViewOpt = 'intro' | 'detail' | 'artist' | 'all';
	type PlayMp3Opt = 'intro' | 'detail' | 'artist' | 'all';
	type LanguageOpt = 'english' | 'spanish' | 'brazil-portuguese';
	type PlayRangeOpt = 'top10' | 'top20' | 'top30' | 'top40';

	let selectedDecade: (typeof decades)[number] = decades[0];
	let selectedGenre: (typeof genres)[number] = genres[0];
	let order: Order = 'countdown'; // default option

	// Custom Random Play selections
	let selectedGrid: Record<string, boolean> = {};
	let showCustomSettings = false;

	let viewOption: ViewOpt = 'intro';
	let playMP3Option: PlayMp3Opt = 'intro';
	let languageOption: LanguageOpt = 'english';
	let playRangeOption: PlayRangeOpt = 'top40';

	interface SavedCustomSettings {
		selectedGrid: Record<string, boolean>;
		viewOption: ViewOpt;
		playMP3Option: PlayMp3Opt;
		languageOption: LanguageOpt;
		playRangeOption: PlayRangeOpt;
	}
	let savedCustomSettings: SavedCustomSettings | null = null;

	function toggleGrid(decade: string, genre: string) {
		const key = `${decade}|${genre}`;
		selectedGrid[key] = !selectedGrid[key];
	}

	function saveCustomSettings() {
		savedCustomSettings = {
			selectedGrid,
			viewOption,
			playMP3Option,
			languageOption,
			playRangeOption
		};
		showCustomSettings = false;
	}

	async function startPlaylist() {
		// Map UI selections into PlaylistSettings
		const selection: PlaylistSettings = {
			playOption: order,
			decades: selectedDecade ? [selectedDecade] : [],
			genres: selectedGenre ? [selectedGenre] : [],
			viewOption: [viewOption === 'all' ? 'intro' : viewOption], // adjust as needed
			playMP3Option: [playMP3Option === 'all' ? 'intro' : playMP3Option], // adjust as needed
			languageOption,
			playRangeOption:
				playRangeOption === 'top10'
					? 10
					: playRangeOption === 'top20'
						? 20
						: playRangeOption === 'top30'
							? 30
							: 40 // default top40
		};

		playlistSettingsStore.set(selection);
		onClose();
		goto('/player');
	}
</script>

{#if visible}
	<div class="overlay" on:click={onClose}>
		<div class="popup" on:click|stopPropagation>
			<h2>Get Started</h2>

			{#if order !== 'custom'}
				<label>
					Decade:
					<select bind:value={selectedDecade}>
						{#each decades as decade (decade)}
							<option value={decade}>{decade}</option>
						{/each}
					</select>
				</label>

				<label>
					Genre:
					<select bind:value={selectedGenre}>
						{#each genres as genre (genre)}
							<option value={genre}>{genre}</option>
						{/each}
					</select>
				</label>
			{/if}

			<label>Order:</label>
			<select bind:value={order} on:change={() => (showCustomSettings = order === 'custom')}>
				<option value="countdown">Countdown (40 → 1)</option>
				<option value="countup">Count Up (1 → 40)</option>
				<option value="random">Random Order</option>
				<option value="custom">Custom Random Play</option>
			</select>

			<!-- Custom Random Play Panel -->
			{#if order === 'custom' && showCustomSettings}
				<div class="custom-panel">
					<h3>Select Decades × Genres</h3>
					<table>
						<thead>
							<tr>
								<th></th>
								{#each genres as g (g)}
									<th>{g}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each decades as d (d)}
								<tr>
									<td>{d}</td>
									{#each genres as g (d + '|' + g)}
										<td>
											<input
												type="checkbox"
												checked={selectedGrid[`${d}|${g}`] || false}
												on:change={() => toggleGrid(d, g)}
											/>
										</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>

					<label>
						View:
						<select bind:value={viewOption}>
							<option value="intro">Intro</option>
							<option value="detail">Detail</option>
							<option value="artist">Artist</option>
							<option value="all">All</option>
						</select>
					</label>

					<label>
						Play MP3:
						<select bind:value={playMP3Option}>
							<option value="intro">Intro</option>
							<option value="detail">Detail</option>
							<option value="artist">Artist</option>
							<option value="all">All</option>
						</select>
					</label>

					<label>
						Language:
						<select bind:value={languageOption}>
							<option value="english">English</option>
							<option value="spanish">Spanish</option>
							<option value="brazil-portuguese">Brazil-Portuguese</option>
						</select>
					</label>

					<label>
						Play:
						<select bind:value={playRangeOption}>
							<option value="top10">Top 10</option>
							<option value="top20">Top 20</option>
							<option value="top30">Top 30</option>
							<option value="top40">Top 40</option>
						</select>
					</label>

					<button on:click={saveCustomSettings}>Save</button>
				</div>
			{/if}

			<!-- Summary -->
			{#if savedCustomSettings}
				<div class="summary">
					<p><strong>Custom Settings Saved:</strong></p>
					<p>• View: {savedCustomSettings.viewOption}</p>
					<p>• Play MP3: {savedCustomSettings.playMP3Option}</p>
					<p>• Language: {savedCustomSettings.languageOption}</p>
					<p>• Play: {savedCustomSettings.playRangeOption}</p>
					<button on:click={() => (showCustomSettings = true)}>Edit</button>
				</div>
			{/if}

			<div class="actions">
				<button on:click={startPlaylist}>Start</button>
				<button class="secondary" on:click={onClose}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(3px);
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden; /* prevent background scroll */
	}
	.popup {
		background: #1e1e1e;
		color: white;
		padding: 2rem;
		border-radius: 12px;
		width: 90%;
		max-width: 600px; /* keep desktop nice */
		max-height: 80vh; /* keep inside viewport */
		overflow-y: auto; /* allow internal scroll */
		text-align: left;
	}
	label {
		display: block;
		margin-bottom: 1rem;
	}
	input,
	select {
		width: 100%;
		padding: 0.5rem;
		margin-top: 0.3rem;
		border-radius: 6px;
		border: none;
	}
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-top: 1rem;
	}
	button {
		padding: 0.6rem 1.2rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	button:first-of-type {
		background: #1db954;
		color: white;
	}
	.secondary {
		background: #444;
		color: white;
	}

	.custom-panel {
		background: #2a2a2a;
		padding: 1rem;
		border-radius: 8px;
		margin-top: 1rem;
	}
	table {
		border-collapse: collapse;
		margin-bottom: 1rem;
		width: 100%;
	}
	th,
	td {
		border: 1px solid #555;
		padding: 0.4rem;
		text-align: center;
	}
	.summary {
		background: #333;
		padding: 0.8rem;
		border-radius: 8px;
		margin-top: 1rem;
	}
</style>
