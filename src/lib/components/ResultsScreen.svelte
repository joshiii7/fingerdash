<script lang="ts">
  import type { TypingStats, WpmSample } from '../engine/stats';
  import WpmChart from './WpmChart.svelte';

  interface Props {
    stats: TypingStats;
    samples: WpmSample[];
    isNewBest: boolean;
    onRestart: () => void;
    /** Extra facts about the run, such as the code language or a quote's source. */
    details?: { label: string; value: string }[];
    /** Which key restarts in the current mode (Tab does nothing in code mode). */
    restartKey?: string;
  }

  let { stats, samples, isNewBest, onRestart, details = [], restartKey = 'Tab' }: Props = $props();
</script>

<div class="results">
  {#if isNewBest}
    <p class="new-best">New personal best!</p>
  {/if}

  <div class="headline">
    <div class="stat primary">
      <span class="value">{stats.wpm}</span>
      <span class="label">wpm</span>
    </div>
    <div class="stat primary">
      <span class="value">{stats.accuracy}%</span>
      <span class="label">accuracy</span>
    </div>
  </div>

  {#if details.length > 0}
    <dl class="details">
      {#each details as detail (detail.label)}
        <div>
          <dt>{detail.label}</dt>
          <dd>{detail.value}</dd>
        </div>
      {/each}
    </dl>
  {/if}

  <div class="chart">
    <WpmChart {samples} />
  </div>

  <div class="grid">
    <div class="stat">
      <span class="value">{stats.rawWpm}</span>
      <span class="label">raw wpm</span>
    </div>
    <div class="stat">
      <span class="value">{stats.consistency}%</span>
      <span class="label">consistency</span>
    </div>
    <div class="stat">
      <span class="value">{stats.correctChars}</span>
      <span class="label">correct</span>
    </div>
    <div class="stat">
      <span class="value">{stats.incorrectChars}</span>
      <span class="label">incorrect</span>
    </div>
    <div class="stat">
      <span class="value">{stats.elapsedSeconds}s</span>
      <span class="label">time</span>
    </div>
  </div>

  <button class="restart" onclick={onRestart}>Next test ({restartKey})</button>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .results {
    @include card;
    padding: $space-6;
    display: flex;
    flex-direction: column;
    gap: $space-4;
    max-width: 700px;
    margin: 0 auto;
  }

  .new-best {
    color: var(--color-correct);
    font-weight: 600;
    margin: 0;
    text-align: center;
  }

  .headline {
    display: flex;
    justify-content: center;
    gap: $space-12;
  }

  .details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $space-1 $space-6;
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.9rem;

    div {
      display: flex;
      gap: $space-2;
    }

    dt {
      font-weight: 600;
    }

    dd {
      margin: 0;
      color: var(--color-text);
    }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: $space-4;
    text-align: center;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;

    .value {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      font-size: 1.25rem;
      color: var(--color-text);
    }

    .label {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    &.primary .value {
      font-size: 2.5rem;
      color: var(--color-accent);
    }
  }

  .restart {
    align-self: center;
    background: transparent;
    border: 1px solid var(--color-border);
    color: var(--color-text);
    border-radius: $radius-md;
    padding: $space-2 $space-4;
    cursor: pointer;
    transition: border-color $transition-fast;

    &:hover {
      border-color: var(--color-accent);
    }
  }
</style>
