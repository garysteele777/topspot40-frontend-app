<script lang="ts">
  export let overdubEnabled: boolean;
  export let overdubIntro: boolean;
  export let overdubDetail: boolean;
  export let overdubArtist: boolean;

  export let onToggleMaster: () => void;
  export let onToggleIntro: () => void;
  export let onToggleDetail: () => void;
  export let onToggleArtist: () => void;
</script>

<div class="overdub-block">
  <label class="main-label">🎙 Voice Overdub</label>
  <div class="btn-group">
    <button class:active={overdubEnabled} on:click={onToggleMaster}>
      {overdubEnabled ? 'On' : 'Off'}
    </button>
  </div>

  <div class="pill-group">
    <button class:active={overdubIntro}  disabled={!overdubEnabled} on:click={onToggleIntro}>Intro</button>
    <button class:active={overdubDetail} disabled={!overdubEnabled} on:click={onToggleDetail}>Detail</button>
    <button class:active={overdubArtist} disabled={!overdubEnabled} on:click={onToggleArtist}>Artist</button>
  </div>

  <p class="hint">Play selected voice tracks over the main song instead of the bed.</p>
</div>

<style>
  .overdub-block {
    background:#161616; border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:.8rem 1rem;
  }
  .main-label { display:block; font-weight:600; color:#61dafb; margin-bottom:.3rem; }
  .btn-group { display:flex; gap:.5rem; margin-bottom:.4rem; }
  .pill-group { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.4rem; }
  button {
    background:linear-gradient(180deg,#2c2c2c,#3c3c3c); color:#eafcff;
    border:1px solid rgba(100,255,200,.15); border-radius:6px;
    padding:.3rem .6rem; font-size:.85rem; cursor:pointer; transition:all .2s;
  }
  button.active { background:linear-gradient(180deg,#24c661,#1e90ff); color:#fff; border-color:transparent; }
  button:disabled { opacity:.4; pointer-events:none; }
  .hint { font-size:.8rem; color:#aaa; margin:0; }
</style>
