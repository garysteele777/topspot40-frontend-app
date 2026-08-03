<script lang="ts">
    import DriveInJukeboxPanel from '$lib/components/car/DriveInJukeboxPanel.svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {ArtistTrackItem} from '$lib/artistSpotlights/types';

    export let tracks: ArtistTrackItem[] = [];

    $: jukeboxTracks = tracks.map((track, index): CarModeTrack => ({
        id: track.track_id,
        rankingId: null,
        rank: index + 1,
        trackName: track.track_name,
        artistName: track.artist_name,
        albumArtwork: track.album_artwork ?? null,
        albumName: track.album_name ?? null,
        spotifyTrackId: track.spotify_track_id,
        spotifyArtistId: track.spotify_artist_id ?? null,
        durationMs: track.duration_ms
    }));
</script>

<DriveInJukeboxPanel
    tracks={jukeboxTracks}
    variant="embedded"
    eyebrow="TopSpot40 Artist Spotlight"
    heading="Program Contents"
/>
