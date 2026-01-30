<script lang="ts">
  export let text: string = '';
</script>

{#if text}
  <div class="ticker" aria-label="Now playing">
    <div class="ticker__content">
      {text} &nbsp; • &nbsp; {text} &nbsp; • &nbsp; {text}
    </div>
  </div>
{/if}

<style>
  .ticker {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    margin-top: 0.75rem;
    opacity: 0.9;
  }

  .ticker__content {
    display: inline-block;
    padding-left: 100%;
    animation: ticker-scroll 18s linear infinite;
    letter-spacing: 0.08em;
    font-size: 0.85rem;
    color: #cfb991; /* Purdue gold */
  }

  @keyframes ticker-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-100%);
    }
  }
</style>
