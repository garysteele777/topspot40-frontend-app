<script lang="ts">
  export let startRank: number;
  export let endRank: number;
  export let onSetRange: (start: number, end: number) => void;

  // quick select ranges
  const ranges: [number, number][] = [
    [1, 10],
    [11, 20],
    [21, 30],
    [31, 40],
    [1, 20],
    [1, 30],
    [1, 40],
  ];

  function clamp(n: number, min = 1, max = 40) {
    return Math.max(min, Math.min(max, n));
  }

  function emitClamped(start: number, end: number) {
    const s = clamp(start);
    const e = clamp(end);
    onSetRange(s <= e ? s : e, s <= e ? e : s);
  }
</script>

<div class="row rank-row">
  <div class="field mini">
    <label for="startRank">Start:</label>
    <input
      id="startRank"
      type="number"
      min="1"
      max="40"
      bind:value={startRank}
      on:change={() => emitClamped(startRank, endRank)}
    />
  </div>

  <div class="field mini">
    <label for="endRank">End:</label>
    <input
      id="endRank"
      type="number"
      min="1"
      max="40"
      bind:value={endRank}
      on:change={() => emitClamped(startRank, endRank)}
    />
  </div>

  <div class="quick-buttons-inline">
    {#each ranges as [s, e] (s + '-' + e)}
      <button type="button" on:click={() => emitClamped(s, e)}>{s}–{e}</button>
    {/each}
  </div>
</div>

<style>
  .row.rank-row { display:flex; align-items:center; flex-wrap:wrap; gap:1rem; margin-top:1rem; }
  .field.mini input { width:65px; text-align:center; font-size:.9rem; }
  .quick-buttons-inline { display:flex; gap:.3rem; overflow-x:auto; white-space:nowrap; }
  .quick-buttons-inline button {
    background:linear-gradient(180deg,#2c2c2c,#3c3c3c);
    color:#eafcff; border:1px solid rgba(100,255,200,.15);
    border-radius:6px; padding:.2rem .45rem; font-size:.75rem; line-height:1;
    cursor:pointer; transition:all .2s;
  }
  .quick-buttons-inline button:hover {
    background:linear-gradient(180deg,#28b463,#1abc9c);
    color:#fff; box-shadow:0 0 8px rgba(36,198,97,.5);
  }
</style>
