<script lang="ts">
  import type { Snippet } from 'svelte';
  import SectionHeader from './SectionHeader.svelte';

  interface Props {
    eyebrow: string;
    title: string;
    /** The heading id, for the surrounding Band's aria-labelledby. */
    id: string;
    /** One short line under the heading. */
    line: string;
    /** The buttons. */
    actions: Snippet;
    /** Smaller text under the buttons (extra links, contact details). */
    more?: Snippet;
  }

  let { eyebrow, title, id, line, actions, more }: Props = $props();
</script>

<div class="cta">
  <SectionHeader {eyebrow} {title} {id} align="center" />
  <p class="line">{line}</p>
  <div class="actions">{@render actions()}</div>
  {#if more}<div class="more">{@render more()}</div>{/if}
</div>

<style lang="scss">
  @use '../../styles/variables' as *;

  .cta {
    text-align: center;

    :global(.section-header) {
      margin-bottom: $space-4;
    }
  }

  .line {
    margin: 0 auto $space-6;
    max-width: 36rem;
    color: var(--color-text-muted);
    font-size: 1.05rem;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $space-3;
  }

  .more {
    margin-top: $space-6;
    color: var(--color-text-muted);
    font-size: 0.9rem;

    :global(p) {
      margin: 0 0 $space-2;
    }
  }
</style>
