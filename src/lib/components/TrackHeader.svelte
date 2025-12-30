<script lang="ts">
  import type { Track } from '$lib/types';
  export let track: Track;
</script>

{#if track}
  <img src={track.album_artwork} alt="Album Cover" class="album-art" />
  <div class="album-details">
    <div class="album-name">Album: {track.album_name}</div>
    <div class="track-name">Track Name: {track.track_name}</div>
    <div class="artist-name">Artist: {track.artist_display_name}</div>
  </div>
{/if}

<style>
  .album-art{ width:300px;height:300px;border-radius:16px;object-fit:cover;box-shadow:0 8px 20px rgba(0,0,0,.5);margin-top:5rem;margin-bottom:1.5rem;}
  .album-details{margin:1rem 0 2rem;text-align:center}
  .album-name{font-weight:700;font-size:1.3rem}
  .track-name{font-weight:600;font-size:1.1rem;opacity:.85}
  .artist-name{font-weight:500;font-size:1rem;opacity:.75}
</style>
