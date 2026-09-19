<script lang="ts">
  import type { WpmSample } from '../engine/stats';

  interface Props {
    samples: WpmSample[];
  }

  let { samples }: Props = $props();

  const width = 600;
  const height = 200;
  const padding = { top: 12, right: 12, bottom: 24, left: 36 };

  function scale(value: number, from: number, to: number, min: number, max: number) {
    if (max === min) return (from + to) / 2;
    return from + ((value - min) / (max - min)) * (to - from);
  }

  const maxTime = $derived(Math.max(1, ...samples.map((s) => s.timeSeconds)));
  const maxWpm = $derived(Math.max(10, ...samples.map((s) => Math.max(s.wpm, s.rawWpm))));

  function toPoint(s: WpmSample, key: 'wpm' | 'rawWpm'): [number, number] {
    const x = scale(s.timeSeconds, padding.left, width - padding.right, 0, maxTime);
    const y = scale(s[key], height - padding.bottom, padding.top, 0, maxWpm);
    return [x, y];
  }

  const wpmPath = $derived(
    samples.length > 0
      ? samples
          .map((s, i) => {
            const [x, y] = toPoint(s, 'wpm');
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '',
  );

  const rawPath = $derived(
    samples.length > 0
      ? samples
          .map((s, i) => {
            const [x, y] = toPoint(s, 'rawWpm');
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(' ')
      : '',
  );

  const yTicks = $derived(Array.from({ length: 4 }, (_, i) => Math.round((maxWpm / 3) * i)));
</script>

<svg
  viewBox="0 0 {width} {height}"
  role="img"
  aria-label="Words per minute over time"
  class="wpm-chart"
>
  {#each yTicks as tick (tick)}
    {@const y = scale(tick, height - padding.bottom, padding.top, 0, maxWpm)}
    <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} class="gridline" />
    <text x={padding.left - 8} y={y + 4} class="axis-label" text-anchor="end">{tick}</text>
  {/each}

  {#if samples.length > 1}
    <path d={rawPath} class="line raw" />
    <path d={wpmPath} class="line wpm" />
  {/if}

  {#each samples as s, i (i)}
    {@const [x, y] = toPoint(s, 'wpm')}
    <circle cx={x} cy={y} r="2.5" class="point" />
  {/each}
</svg>

<div class="legend">
  <span class="legend-item"><span class="swatch wpm"></span>WPM</span>
  <span class="legend-item"><span class="swatch raw"></span>Raw WPM</span>
</div>

<style lang="scss">
  .wpm-chart {
    width: 100%;
    height: auto;
    display: block;
  }

  .gridline {
    stroke: var(--color-border);
    stroke-width: 1;
  }

  .axis-label {
    fill: var(--color-text-muted);
    font-size: 10px;
    font-family: inherit;
  }

  .line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;

    &.wpm {
      stroke: var(--color-accent);
    }
    &.raw {
      stroke: var(--color-text-muted);
      stroke-dasharray: 4 3;
    }
  }

  .point {
    fill: var(--color-accent);
  }

  .legend {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    display: inline-block;

    &.wpm {
      background: var(--color-accent);
    }
    &.raw {
      background: var(--color-text-muted);
    }
  }
</style>
