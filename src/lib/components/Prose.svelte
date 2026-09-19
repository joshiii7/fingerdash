<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<!-- Long text in a centered readable column (about 50rem), left-aligned inside it. -->
<div class="prose">
  {@render children()}
</div>

<style lang="scss">
  @use '../../styles/variables' as *;

  .prose {
    max-width: 50rem;
    margin-inline: auto;
    color: var(--color-text-muted);
    line-height: 1.75;
    text-align: start;

    // Content is authored in the page, so it doesn't carry this component's scope class.
    :global(p),
    :global(ul) {
      margin: 0 0 $space-4;
    }

    :global(p:last-child),
    :global(ul:last-child) {
      margin-bottom: 0;
    }

    :global(ul) {
      padding-left: $space-6;
    }

    :global(li) {
      margin-bottom: $space-2;
    }

    :global(strong) {
      color: var(--color-text);
    }

    :global(code),
    :global(kbd) {
      font-family: var(--font-mono);
      font-size: 0.85em;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: $radius-sm;
      padding: 0 $space-1;
      color: var(--color-text);
    }
  }
</style>
