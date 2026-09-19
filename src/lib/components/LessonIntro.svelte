<script lang="ts">
  import Keyboard from './Keyboard.svelte';
  import HandsGuide from './HandsGuide.svelte';
  import { fingerLabel, fingersForKeys, getKeyGuide, zoneText } from '../../data/fingerMap';
  import type { Lesson } from '../../data/lessons';

  interface Props {
    lesson: Lesson;
    /** Position in the tutorial, for the "Lesson 3 of 26" line. */
    position: number;
    total: number;
    /**
     * `page` is the first-visit screen before a drill; `dialog` is the "Why?" popup over a
     * drill, which closes back to it.
     */
    mode?: 'page' | 'dialog';
    /** Heading id, so a surrounding dialog can label itself with it. */
    titleId: string;
    onStart?: () => void;
    onSkip?: () => void;
    onClose?: () => void;
  }

  let {
    lesson,
    position,
    total,
    mode = 'page',
    titleId,
    onStart,
    onSkip,
    onClose,
  }: Props = $props();

  const explain = $derived(lesson.explain);
  const reading = $derived(lesson.kind === 'reading');

  // Everything on the keyboard and hands is worked out from the finger map, so the picture
  // and the words beside it can never disagree.
  const emphasized = $derived.by(() => {
    const ids: string[] = [];
    for (const key of lesson.targetKeys) {
      const guide = getKeyGuide(key);
      if (!guide) continue;
      ids.push(guide.keyId);
      if (guide.shift) ids.push(guide.shift.keyId);
    }
    return ids;
  });
  const pressingFingers = $derived(fingersForKeys(lesson.targetKeys));
  const zoneFingers = $derived(explain.fingers ?? pressingFingers);
  const legend = $derived(
    zoneFingers
      .filter((finger) => !finger.endsWith('thumb'))
      .map((finger) => ({ finger, label: fingerLabel(finger), keys: zoneText(finger) })),
  );
  const hasVisual = $derived(zoneFingers.length > 0 || emphasized.length > 0);
</script>

<article class="intro" aria-labelledby={titleId}>
  <header class="head">
    <div class="head-row">
      <p class="eyebrow">
        {reading ? 'Read first' : 'Before you practice'} · Lesson {position} of {total}
      </p>
      {#if mode === 'page' && !reading && onSkip}
        <button type="button" class="link-btn" onclick={onSkip}>Skip intro</button>
      {/if}
    </div>
    <h2 id={titleId} tabindex="-1">{lesson.title}</h2>
    <p class="goal">{explain.goal}</p>
  </header>

  {#if hasVisual}
    <figure class="visual">
      <Keyboard zone={zoneFingers} emphasize={emphasized} showLabel={false} />
      <HandsGuide zone={zoneFingers} active={pressingFingers} />
      {#if legend.length > 0}
        <figcaption>
          <p class="legend-title">
            Tinted keys are each finger's zone. Bright keys are the ones in this lesson.
          </p>
          <ul class="legend">
            {#each legend as item (item.finger)}
              <li><strong>{item.label}:</strong> {item.keys}</li>
            {/each}
          </ul>
        </figcaption>
      {/if}
    </figure>
  {/if}

  <section class="card" aria-labelledby="{titleId}-why">
    <h3 id="{titleId}-why">Why it matters</h3>
    {#each explain.why as paragraph, i (i)}
      <p>{paragraph}</p>
    {/each}
  </section>

  <section class="card" aria-labelledby="{titleId}-how">
    <h3 id="{titleId}-how">How to do it</h3>
    <ol>
      {#each explain.how as step, i (i)}
        <li>{step}</li>
      {/each}
    </ol>
  </section>

  <section aria-labelledby="{titleId}-mistakes">
    <h3 id="{titleId}-mistakes" class="plain-heading">Common mistakes</h3>
    <ul class="mistakes">
      {#each explain.mistakes as item, i (i)}
        <li class="card small">
          <p class="mistake">{item.mistake}</p>
          <p class="reason">{item.reason}</p>
        </li>
      {/each}
    </ul>
  </section>

  <section class="card recap" aria-labelledby="{titleId}-recap">
    <h3 id="{titleId}-recap">Remember</h3>
    <p>{explain.recap}</p>
  </section>

  <footer class="actions">
    {#if mode === 'dialog'}
      <button type="button" class="primary" onclick={onClose}>Back to practice</button>
    {:else if reading}
      <button type="button" class="primary" onclick={onStart}>Got it, next lesson</button>
    {:else}
      <button type="button" class="primary" onclick={onStart}>Start practice</button>
    {/if}
  </footer>
</article>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .intro {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    text-align: start;
  }

  .head-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-2;
  }

  .eyebrow {
    margin: 0;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  h2 {
    margin: $space-1 0 $space-2;

    &:focus {
      outline: none;
    }
  }

  .goal {
    margin: 0;
    font-size: 1.1rem;
    line-height: 1.5;
  }

  h3 {
    margin: 0 0 $space-2;
    font-size: 1.05rem;
  }

  .plain-heading {
    margin-bottom: $space-3;
  }

  .card {
    padding: $space-4 $space-6;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;

    p {
      margin: 0 0 $space-3;
      color: var(--color-text-muted);
      line-height: 1.7;
    }

    p:last-child {
      margin-bottom: 0;
    }

    ol {
      margin: 0;
      padding-left: $space-6;
      color: var(--color-text-muted);
      line-height: 1.7;
    }

    li + li {
      margin-top: $space-2;
    }

    &.small {
      padding: $space-3 $space-4;
    }

    &.recap {
      border-color: var(--color-accent);
    }
  }

  .visual {
    display: flex;
    flex-direction: column;
    gap: $space-3;
    margin: 0;
  }

  .legend-title {
    margin: 0 0 $space-2;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .legend {
    display: grid;
    gap: $space-1 $space-6;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: 0.9rem;
    color: var(--color-text-muted);
    font-family: var(--font-mono);

    strong {
      color: var(--color-text);
      font-family: var(--font-sans, inherit);
    }
  }

  .mistakes {
    display: grid;
    gap: $space-3;
    grid-template-columns: 1fr;
    margin: 0;
    padding: 0;
    list-style: none;

    @media (min-width: 48rem) {
      grid-template-columns: repeat(2, 1fr);
    }

    .card {
      margin: 0;
    }
  }

  .mistake {
    color: var(--color-text) !important;
    font-weight: 600;
  }

  .reason {
    font-size: 0.92rem;
  }

  .actions {
    display: flex;
    justify-content: center;
    padding-top: $space-2;
  }

  button {
    font: inherit;
    cursor: pointer;
    @include touch-target;
  }

  .primary {
    background: var(--color-accent);
    color: var(--color-bg);
    border: 1px solid var(--color-accent);
    border-radius: $radius-md;
    padding: $space-2 $space-6;
    font-weight: 600;
  }

  .link-btn {
    background: none;
    border: 0;
    padding: $space-1 $space-2;
    color: var(--color-accent);
    text-decoration: underline;
    text-underline-offset: 3px;
  }
</style>
