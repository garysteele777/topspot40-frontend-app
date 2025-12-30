<script lang="ts">
  import type { Track } from '$lib/types';
  export let track: Track;
</script>

{#if track}
  <div class="track-info">
    <div class="info-item"><div class="label">Rank #:</div><div class="pill">{track.rank}</div></div>
    <div class="info-item"><div class="label">Decade:</div><div class="pill">{track.decade_name}</div></div>
    <div class="info-item"><div class="label">Genre:</div><div class="pill">{track.genre_name}</div></div>
  </div>
{/if}

<style>
  .track-info{display:flex;justify-content:center;gap:2rem;margin-bottom:2rem}
  .info-item{display:flex;flex-direction:column;align-items:center}
  .label{font-weight:600;opacity:.75;margin-bottom:.4rem}
  .pill{background-color:rgba(255,255,255,.1);border-radius:9999px;padding:.6rem 1.2rem;font-weight:700}
</style>
