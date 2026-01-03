import { tracks, currentTrack, currentRank, status } from '$lib/carmode/CarMode.store';
import { loadDecadeGenrePauseMode } from '$lib/api/playbackPauseLoader';
import { normalizeTrack, type LoadedTrack } from '$lib/utils/normalizeTrack';
import type { SelectionState } from '$lib/stores/selection';

export async function loadPauseModeTracks(sel: SelectionState) {
	if (!sel.context?.decade || !sel.context?.genre) {
		console.warn('Pause mode missing decade/genre');
		return;
	}

	status.set('Loading tracks…');

	const data = await loadDecadeGenrePauseMode({
		decade: sel.context.decade,
		genre: sel.context.genre
	});

	const loaded: LoadedTrack[] = data.tracks.map((t: any) =>
		normalizeTrack({
			rank: t.rank,
			track_id: t.track_id,
			title: t.title,
			artist: t.artist,
			duration_ms: t.duration_ms
		})
	);

	tracks.set(loaded);

	const first = loaded[0] ?? null;
	currentTrack.set(first);
	currentRank.set(first?.rank ?? 1);

	status.set(`Loaded ${loaded.length} tracks. Press Play.`);
}
