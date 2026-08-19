<script lang="ts">
    import DriveInJukeboxPanel from '$lib/components/car/DriveInJukeboxPanel.svelte';
    import type {CarModeTrack} from '$lib/carmode/CarMode.store';
    import type {CollectionTrackPreview as TrackPreview} from '$lib/collections/types';

    export let tracks: TrackPreview[] = [];
    export let collectionName = '';

    $: jukeboxTracks = tracks.map((track): CarModeTrack => ({
        id: null,
        rankingId: track.rankingId ?? null,
        rank: track.rank,
        trackName: track.trackName,
        artistName: track.artistName,
        albumArtwork: null,
        spotifyTrackId: null
    }));
</script>

<DriveInJukeboxPanel
        tracks={jukeboxTracks}
        variant="embedded"
        eyebrow="TopSpot40 Collection"
        heading="Program Contents"
        programLabel={collectionName ? `Collections: ${collectionName}` : ''}
        exportFileName={
        collectionName
            ? `TopSpot40 Collections ${collectionName}.csv`
            : 'TopSpot40 Collections Track List.csv'
    }
/>