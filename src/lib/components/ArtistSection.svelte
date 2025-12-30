<script lang="ts">
  import type { Track } from '$lib/types';
  export let track: Track;
</script>

{#if track}
  <div class="artist-section">
    <img class="artist-image" src={track.artist_artwork} alt="Artist" />
    <div class="artist-description">
      <h2>About {track.artist_display_name}</h2>
      <p>{track.artist_description}</p>
    </div>
  </div>
{/if}

<style>
  .artist-section{display:flex;flex-direction:column;gap:2rem;align-items:center;margin-top:3rem;max-width:1000px;width:100%}
  .artist-image{width:300px;border-radius:1rem;box-shadow:0 8px 20px rgba(0,0,0,.5)}
  @media (min-width:768px){.artist-section{flex-direction:row;align-items:flex-start}}
  .artist-description{flex:1;text-align:center}
</style>
