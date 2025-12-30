<script lang="ts">
  export let isPlaying = false;
  export let onPrev: () => void;
  export let onPlayToggle: () => void;
  export let onNext: () => void;
</script>

<div class="controls">
  <button class="control-btn" type="button" aria-label="Previous track" on:click={onPrev}>
    <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48" fill="#fff">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  </button>
  <button class="control-btn" type="button" on:click={onPlayToggle} aria-label="Play / Pause">
    {#if isPlaying}❚❚{:else}▶{/if}
  </button>
  <button class="control-btn" type="button" aria-label="Next track" on:click={onNext}>
    <svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 0 24 24" width="48" fill="#fff">
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  </button>
</div>

<style>
  .controls{display:flex;align-items:center;gap:2rem;margin-top:1rem}
  .control-btn{background:#1db954;color:#fff;border:none;border-radius:50%;width:80px;height:80px;font-size:1.8rem;font-weight:bold;box-shadow:0 4px 12px rgba(0,0,0,.3);cursor:pointer}
  .control-btn:hover{background:#1ed760}
</style>
