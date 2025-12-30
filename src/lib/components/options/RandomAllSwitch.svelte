<script lang="ts">
  export let randomAllCategories: boolean;
  export let onToggleRandomAll: () => void;
</script>

<div class="random-block">
  <label class="main-label">🎲 Random All Categories</label>
  <div class="btn-group">
    <button class:active={randomAllCategories} on:click={onToggleRandomAll}>
      {randomAllCategories ? 'On' : 'Off'}
    </button>
  </div>
  <p class="hint">Pull tracks randomly from all decade–genres or collections. Menus below are disabled.</p>
</div>

<style>
  .random-block {
    background:#161616; border:1px solid rgba(255,255,255,.08);
    border-radius:12px; padding:.8rem 1rem;
  }
  .main-label { display:block; font-weight:600; color:#61dafb; margin-bottom:.3rem; }
  .btn-group { display:flex; gap:.5rem; margin-bottom:.4rem; }
  button {
    background:linear-gradient(180deg,#2c2c2c,#3c3c3c); color:#eafcff;
    border:1px solid rgba(100,255,200,.15); border-radius:6px;
    padding:.3rem .6rem; font-size:.85rem; cursor:pointer; transition:all .2s;
  }
  button.active { background:linear-gradient(180deg,#24c661,#1e90ff); color:#fff; border-color:transparent; }
  .hint { font-size:.8rem; color:#aaa; margin:0; }
</style>
