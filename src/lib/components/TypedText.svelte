<script lang="ts">
  interface Props {
    text: string;
    /** Position of this text's first character in the whole animation. */
    offset: number;
    /** How many characters of the whole animation are showing. */
    revealed: number;
    /** Show the blinking caret after the last revealed character. */
    caret: boolean;
    /**
     * Headings carry the full text in `aria-label` on their own element. Other text gets a
     * visually hidden copy instead, because a label isn't reliably read on a plain paragraph.
     */
    hiddenCopy?: boolean;
  }

  let { text, offset, revealed, caret, hiddenCopy = false }: Props = $props();

  const chars = $derived(Array.from(text));
</script>

<!-- Every character is in the page from the start, only hidden until its turn (visibility, not
     display), so the line keeps its final size and nothing shifts while it types. -->
{#if hiddenCopy}<span class="visually-hidden">{text}</span>{/if}
<span class="typed" aria-hidden="true">
  {#each chars as char, i (i)}
    <span
      class="char"
      class:pending={offset + i >= revealed}
      class:caret={caret && offset + i === revealed - 1}
      class:caret-start={caret && offset === 0 && i === 0 && revealed === 0}>{char}</span
    >
  {/each}
</span>

<style lang="scss">
  @use '../../styles/variables' as *;

  .char {
    position: relative;

    &.pending {
      visibility: hidden;
    }

    // Drawn outside the text flow, so it never changes the line's width or wrapping.
    &.caret::after,
    &.caret-start::after {
      content: '';
      position: absolute;
      top: 0.12em;
      bottom: 0.08em;
      right: -0.14em;
      width: 0.09em;
      border-radius: 1px;
      background: var(--color-accent);
      animation: blink 1s steps(1) infinite;
    }
  }

  // While the text is deleted, the caret waits at the start of the line.
  // The first character is hidden then, and a hidden parent would hide the caret too.
  .char.caret-start::after {
    right: auto;
    left: -0.14em;
    visibility: visible;
  }

  @keyframes blink {
    50% {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .char.caret::after,
    .char.caret-start::after {
      display: none;
    }
  }
</style>
