<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    /** The real value. It is what the markup contains, and what screen readers read. */
    value: number;
    /** Length of the count-up, in milliseconds. */
    duration?: number;
  }

  let { value, duration = 1400 }: Props = $props();

  // While counting up this holds the in-between number. Otherwise it is null and the real
  // value shows, so the number is correct before (or without) any animation.
  let animated = $state<number | null>(null);
  const shown = $derived(animated ?? value);
  let root: HTMLElement | undefined = $state();

  onMount(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Nothing to animate for zero, and reduced motion gets the final value straight away.
    if (value === 0 || reduceMotion || !('IntersectionObserver' in window) || !root) return;

    let frame = 0;
    let safety: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        animated = 0;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          animated = Math.round(value * (1 - (1 - t) ** 3)); // ease-out
          if (t < 1) frame = requestAnimationFrame(step);
          else animated = null;
        };
        frame = requestAnimationFrame(step);
        // If animation frames are paused (a background tab), still end on the real value.
        safety = setTimeout(() => (animated = null), duration + 400);
      },
      { threshold: 0.4 },
    );
    observer.observe(root);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      clearTimeout(safety);
    };
  });
</script>

<span bind:this={root} class="count">
  <!-- The animated digits are decorative; assistive tech reads the final value once. -->
  <span aria-hidden="true">{shown.toLocaleString('en-US')}</span>
  <span class="visually-hidden">{value.toLocaleString('en-US')}</span>
</span>

<style>
  .count {
    font-variant-numeric: tabular-nums;
  }
</style>
