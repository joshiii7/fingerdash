<script lang="ts">
  import { untrack } from 'svelte';
  import Icon from './Icon.svelte';

  interface AccordionItem {
    id: string;
    question: string;
    answer: string;
  }

  interface Props {
    items: readonly AccordionItem[];
    /** Prefix for element ids, so two accordions on one page never clash. */
    idPrefix?: string;
    /** Which item starts open. */
    initialOpen?: string | null;
    /** Level of the question headings, so they fit the page's outline. */
    headingLevel?: 2 | 3 | 4;
  }

  let {
    items,
    idPrefix = 'accordion',
    initialOpen = undefined,
    headingLevel = 3,
  }: Props = $props();

  // Only one item is open at a time. The first one starts open unless told otherwise.
  let openId: string | null = $state(
    untrack(() => (initialOpen === undefined ? (items[0]?.id ?? null) : initialOpen)),
  );
  let buttons: HTMLButtonElement[] = $state([]);

  function toggle(id: string) {
    openId = openId === id ? null : id;
  }

  // Up and Down move between questions (wrapping), Home and End jump to the first and last.
  // Enter and Space are the button's own behavior.
  function onKeydown(event: KeyboardEvent, index: number) {
    const last = items.length - 1;
    let next: number;
    switch (event.key) {
      case 'ArrowDown':
        next = index === last ? 0 : index + 1;
        break;
      case 'ArrowUp':
        next = index === 0 ? last : index - 1;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    buttons[next]?.focus();
  }
</script>

<div class="accordion">
  {#each items as item, index (item.id)}
    {@const open = openId === item.id}
    <div class="item" class:open>
      <svelte:element this={`h${headingLevel}`} class="heading">
        <button
          type="button"
          id="{idPrefix}-{item.id}-button"
          class="trigger"
          aria-expanded={open}
          aria-controls="{idPrefix}-{item.id}-panel"
          bind:this={buttons[index]}
          onclick={() => toggle(item.id)}
          onkeydown={(event) => onKeydown(event, index)}
        >
          <span class="question">{item.question}</span>
          <span class="chevron"><Icon name="chevron" /></span>
        </button>
      </svelte:element>
      <div
        id="{idPrefix}-{item.id}-panel"
        class="panel"
        role="region"
        aria-labelledby="{idPrefix}-{item.id}-button"
      >
        <div class="panel-clip">
          <p>{item.answer}</p>
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .accordion {
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    background: var(--card-bg, var(--color-surface));
    overflow: hidden;
  }

  .item + .item {
    border-top: 1px solid var(--color-border);
  }

  .heading {
    margin: 0;
    font-size: 1rem;
  }

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;
    width: 100%;
    padding: $space-4 $space-6;
    background: transparent;
    color: var(--color-text);
    border: 0;
    font: inherit;
    font-weight: 600;
    text-align: start;
    cursor: pointer;
    @include touch-target;

    &:hover {
      color: var(--color-accent);
    }

    // Inset, so the outline isn't cut off by the rounded, overflow-hidden frame.
    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: -2px;
    }
  }

  .chevron {
    display: inline-flex;
    flex: none;
    font-size: 1.25rem;
    color: var(--color-accent);
    transition: transform $transition-normal;
  }

  .open .chevron {
    transform: rotate(180deg);
  }

  // Animating 0fr to 1fr grows the row to the answer's real height, with no fixed max-height.
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows $transition-normal,
      visibility 0s linear $transition-normal;
  }

  .open .panel {
    grid-template-rows: 1fr;
    visibility: visible;
    transition:
      grid-template-rows $transition-normal,
      visibility 0s;
  }

  .panel-clip {
    min-height: 0;
    overflow: hidden;

    p {
      margin: 0;
      padding: 0 $space-6 $space-6;
      color: var(--color-text-muted);
      line-height: 1.7;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .chevron,
    .panel,
    .open .panel {
      transition: none;
    }
  }
</style>
