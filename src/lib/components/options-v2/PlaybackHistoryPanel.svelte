<script lang="ts">
  import { programHistory } from '$lib/carmode/CarMode.store';
</script>

<section>
  <h3>Playback History</h3>

  {#if Object.keys($programHistory).length === 0}
    <p>No history yet.</p>
  {:else}
    <ul>
      {#each Object.entries($programHistory) as [key, set]}
        <li>{key} — {set.size} played</li>
      {/each}
    </ul>
  {/if}
</section>
