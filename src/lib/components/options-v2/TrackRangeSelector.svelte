<script lang="ts">
  // Small helper type so TS stays happy
  type RangePreset = {
    label: string;
    start: number;
    end: number;
  };

  export let startRank = 1;
  export let endRank = 40;

  const presets: RangePreset[] = [
    { label: 'Top 10', start: 1, end: 10 },
    { label: 'Top 20', start: 1, end: 20 },
    { label: 'Top 30', start: 1, end: 30 },
    { label: 'Top 40', start: 1, end: 40 },
    { label: '21-30', start: 21, end: 30 },
    { label: '31-40', start: 31, end: 40 }
  ];

  function setPreset(start: number, end: number): void {
    startRank = start;
    endRank = end;
  }
</script>

<div class="card">
  <h3>Top Tracks Range</h3>
  <p class="hint">Choose the rank range you want to hear.</p>

  <div class="range-row">
    <label>
      Start
      <input
        type="number"
        min="1"
        max={endRank}
        bind:value={startRank}
      />
    </label>
    <label>
      End
      <input
        type="number"
        min={startRank}
        max="40"
        bind:value={endRank}
      />
    </label>
  </div>

  <div class="presets">
    {#each presets as preset (preset.label)}
      <button
        type="button"
        on:click={() => setPreset(preset.start, preset.end)}
      >
        {preset.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .card {
    background: #181818;
    border-radius: 10px;
    padding: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  h3 {
    margin: 0 0 0.25rem;
    font-size: 1rem;
  }

  .hint {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: #b3b3b3;
  }

  .range-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  label {
    flex: 1;
    font-size: 0.85rem;
  }

  input {
    width: 100%;
    margin-top: 0.2rem;
    padding: 0.25rem 0.35rem;
    border-radius: 6px;
    border: 1px solid #333;
    background: #101010;
    color: #fff;
    font-size: 0.85rem;
  }

  .presets {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .presets button {
    border-radius: 999px;
    border: 0;
    padding: 0.25rem 0.7rem;
    font-size: 0.8rem;
    cursor: pointer;
    background: #282828;
    color: #e0e0e0;
  }

  .presets button:hover {
    background: #1db954;
    color: #000;
  }
</style>
