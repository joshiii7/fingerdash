<script lang="ts">
  import type { FingerId, FingerName, Hand } from '../../data/fingerMap';

  interface Props {
    /** Fingers that should press the next key. */
    active?: readonly FingerId[];
    /** Finger that should hold Shift, if the next character needs it. */
    shift?: FingerId | null;
    /** Fingers whose zone is being taught: tinted, so the group of keys reads as one. */
    zone?: readonly FingerId[];
  }

  let { active = [], shift = null, zone = [] }: Props = $props();

  interface FingerShape {
    name: FingerName;
    x: number;
    y: number;
    width: number;
    height: number;
    transform?: string;
  }

  // Left hand, drawn once. The right hand is this same drawing mirrored, so the
  // two stay symmetrical and only need one set of coordinates.
  const PALM = { x: 28, y: 105, width: 140, height: 80 };
  const FINGERS: FingerShape[] = [
    { name: 'pinky', x: 30, y: 58, width: 26, height: 77 },
    { name: 'ring', x: 62, y: 38, width: 26, height: 97 },
    { name: 'middle', x: 94, y: 28, width: 26, height: 107 },
    { name: 'index', x: 126, y: 40, width: 26, height: 95 },
    { name: 'thumb', x: 160, y: 118, width: 28, height: 62, transform: 'rotate(28 174 172)' },
  ];
  const HANDS: { hand: Hand; transform?: string }[] = [
    { hand: 'left' },
    { hand: 'right', transform: 'translate(480 0) scale(-1 1)' },
  ];
</script>

<svg class="hands" viewBox="0 0 480 200" aria-hidden="true" focusable="false">
  {#each HANDS as { hand, transform } (hand)}
    <g {transform}>
      <rect class="palm" x={PALM.x} y={PALM.y} width={PALM.width} height={PALM.height} rx="24" />
      {#each FINGERS as finger (finger.name)}
        {@const id = `${hand}-${finger.name}` as FingerId}
        <rect
          class="finger"
          class:active={active.includes(id)}
          class:zone={zone.includes(id)}
          class:shift={shift === id}
          data-finger={id}
          x={finger.x}
          y={finger.y}
          width={finger.width}
          height={finger.height}
          rx="13"
          transform={finger.transform}
        />
      {/each}
    </g>
  {/each}
</svg>

<style lang="scss">
  .hands {
    display: block;
    width: 100%;
    height: auto;
    max-height: 16rem;
  }

  .palm,
  .finger {
    fill: var(--color-surface);
    stroke: var(--color-border);
    stroke-width: 2;
    transition:
      fill 100ms ease,
      stroke 100ms ease;
  }

  // A finger whose zone is being taught: a soft tint and an accent outline.
  .finger.zone {
    fill: color-mix(in srgb, var(--color-accent) 28%, var(--color-surface));
    stroke: var(--color-accent);
    stroke-width: 3;
  }

  // The finger to use: accent fill plus a heavy solid outline and a glow, so it
  // reads without relying on color alone.
  .finger.active {
    fill: var(--color-accent);
    stroke: var(--color-text);
    stroke-width: 4;
    filter: drop-shadow(0 0 6px var(--color-accent));
  }

  // The Shift finger: same accent, but a dashed outline so it's distinct from
  // the finger that presses the key.
  .finger.shift {
    fill: color-mix(in srgb, var(--color-accent) 35%, var(--color-surface));
    stroke: var(--color-accent);
    stroke-width: 4;
    stroke-dasharray: 6 4;
  }

  @media (prefers-reduced-motion: no-preference) {
    .finger.active {
      animation: glow 1.6s ease-in-out infinite;
    }
  }

  @keyframes glow {
    0%,
    100% {
      filter: drop-shadow(0 0 3px var(--color-accent));
    }
    50% {
      filter: drop-shadow(0 0 9px var(--color-accent));
    }
  }
</style>
