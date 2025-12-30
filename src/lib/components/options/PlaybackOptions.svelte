<script lang="ts">
  export let playIntro: boolean;
  export let playDetail: boolean;
  export let playArtistDescription: boolean;
  export let textIntro: boolean;
  export let textDetail: boolean;
  export let textArtistDescription: boolean;
</script>

<div class="voice-text-section">
  <h3>🎙 Playback Options</h3>

  <div class="toggle-row">
    <label class="toggle-group">
      <input type="checkbox" bind:checked={playIntro} />
      <span class="label">Intro</span>
    </label>
    <label class="toggle-group">
      <input type="checkbox" bind:checked={playDetail} />
      <span class="label">Detail</span>
    </label>
    <label class="toggle-group">
      <input type="checkbox" bind:checked={playArtistDescription} />
      <span class="label">Artist</span>
    </label>
  </div>

  <div class="toggle-row">
    <label class="toggle-group">
      <input type="checkbox" bind:checked={textIntro} />
      <span class="label">Show Intro Text</span>
    </label>
    <label class="toggle-group">
      <input type="checkbox" bind:checked={textDetail} />
      <span class="label">Show Detail Text</span>
    </label>
    <label class="toggle-group">
      <input type="checkbox" bind:checked={textArtistDescription} />
      <span class="label">Show Artist Text</span>
    </label>
  </div>
</div>

<style>
  .voice-text-section {
    margin:1rem 0; padding:1rem 1.2rem; background:#161616;
    border-radius:12px; border:1px solid rgba(255,255,255,0.08);
  }
  h3 { color:#61dafb; text-align:center; margin:0 0 .6rem; }
  .toggle-row { display:flex; justify-content:center; flex-wrap:wrap; gap:1rem; margin:.4rem 0; }
  .toggle-group {
    display:flex; align-items:center; gap:.4rem;
    background:#222; border-radius:8px; padding:.3rem .7rem;
  }
  .toggle-group input[type='checkbox'] { accent-color:#24c661; width:1rem; height:1rem; }
  .label { color:#e8f4ff; font-size:.9rem; user-select:none; }
</style>
