<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';

  /**
   * Public props
   */
  export let value = 0;        // current time (seconds)
  export let max = 0;          // duration (seconds)
  export let step = 0.01;
  export let disabled = false;
  export let ariaLabel: string = 'Seek';

  /**
   * Events:
   *  - seekstart: user started dragging / seeking
   *  - seek: emits the current numeric value while dragging
   *  - seekend: user released and we commit the new value
   */
  const dispatch = createEventDispatcher<{
    seekstart: void;
    seek: number;
    seekend: number;
  }>();

  let sliderEl: HTMLInputElement | null = null;

  function updateSliderBackground(slider: HTMLInputElement | null): void {
    if (!slider) return;
    const v = Number(slider.value);
    const min = Number(slider.min || 0);
    const mx = Number(slider.max || 0);
    const pct = mx > min ? ((v - min) / (mx - min)) * 100 : 0;
    slider.style.background =
      `linear-gradient(to right, #22c55e 0%, #22c55e ${pct}%, #333 ${pct}%, #333 100%)`;
  }

  function handleInput(e: Event): void {
    const target = e.currentTarget as HTMLInputElement;
    value = parseFloat(target.value);
    updateSliderBackground(target);
    dispatch('seek', value);
  }

  function handleMouseDown(): void {
    dispatch('seekstart');
  }
  function handleTouchStart(): void {
    dispatch('seekstart');
  }

  function handleMouseUp(): void {
    dispatch('seekend', value);
  }
  function handleTouchEnd(): void {
    dispatch('seekend', value);
  }

  // keep background gradient in sync when props change
  $: {
    if (sliderEl) updateSliderBackground(sliderEl);
  }

  onMount(() => {
    if (sliderEl) updateSliderBackground(sliderEl);
  });
</script>

<div class="slider-container">
  <input
    bind:this={sliderEl}
    type="range"
    class="slider"
    min="0"
    {step}
    {disabled}
    {max}
    {value}
    aria-label={ariaLabel}
    on:input={handleInput}
    on:mousedown={handleMouseDown}
    on:touchstart={handleTouchStart}
    on:mouseup={handleMouseUp}
    on:touchend={handleTouchEnd}
  />
  <div class="time-display">
    <slot />
  </div>
</div>

<style>
  .slider-container {
    width: 80%;
    margin: 1rem auto 2rem auto;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  input[type='range'] {
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    transition: background 450ms ease-in;
    background: #333;
  }
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: white;
    border: 2px solid #22c55e;
    cursor: pointer;
    margin-top: -6px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }
  input[type='range']::-moz-range-thumb {
    height: 16px;
    width: 16px;
    border-radius: 50%;
    background: white;
    border: 2px solid #22c55e;
    cursor: pointer;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  }
  input[type='range']::-moz-range-track {
    height: 6px;
    background: #333;
    border-radius: 3px;
  }
  .time-display {
    color: white;
    font-size: 0.85rem;
    margin-top: 0.4rem;
    font-family: 'Inter', sans-serif;
  }
</style>
