<script lang="ts">
  export let modeType: 'decade_genre' | 'collection';
  export let onToggleMode: () => void;
</script>

<div class="toggle-container">
  <span class="label">Decade–Genre</span>
  <label class="switch">
    <input type="checkbox" checked={modeType === 'collection'} on:change={onToggleMode} />
    <span class="slider"></span>
  </label>
  <span class="label">Collection</span>
</div>

<style>
  .toggle-container {
    display:flex; align-items:center; justify-content:center;
    gap:0.8rem; margin-bottom:0.75rem;
  }
  .label { font-size:0.95rem; color:#e6f3ff; }
  .switch { position:relative; display:inline-block; width:52px; height:24px; }
  .switch input { opacity:0; width:0; height:0; }
  .slider {
    position:absolute; inset:0; border-radius:999px;
    background:linear-gradient(90deg,#3b3b3b,#555); transition:.4s;
  }
  .slider:before {
    content:''; position:absolute; height:18px; width:18px; left:3px; bottom:3px;
    background:linear-gradient(135deg,#eee,#bbb); border-radius:50%;
    transition:transform .25s cubic-bezier(.4,0,.2,1);
  }
  input:checked + .slider {
    background:linear-gradient(90deg,#24c661,#1e90ff);
  }
  input:checked + .slider:before {
    transform:translateX(28px);
  }
</style>
