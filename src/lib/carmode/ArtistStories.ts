import type {CarModeTrack} from '$lib/carmode/CarMode.store';

/** Primary-artist identity for the current browser session only. */
export function artistStoryIdentity(track: CarModeTrack): string {
    if (track.spotifyArtistId) return `spotify:${track.spotifyArtistId}`;
    if (track.artistKey) return `artist-key:${track.artistKey}`;
    return `artist-name:${track.artistName.trim().toLocaleLowerCase()}`;
}

export function shouldPlayArtistStory(
    enabled: boolean,
    playedArtists: ReadonlySet<string>,
    track: CarModeTrack,
    hasBio: boolean
): boolean {
    return enabled && hasBio && !playedArtists.has(artistStoryIdentity(track));
}
