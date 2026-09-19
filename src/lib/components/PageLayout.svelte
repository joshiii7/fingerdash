<script lang="ts">
  import type { Snippet } from 'svelte';
  import PageBanner from './PageBanner.svelte';
  import PageContainer from './PageContainer.svelte';

  interface Props {
    title: string;
    lead?: string;
    children: Snippet;
  }

  let { title, lead, children }: Props = $props();
</script>

<PageBanner {title} {lead} />

<PageContainer>
  <article class="page-body">
    {@render children()}
  </article>
</PageContainer>

<style lang="scss">
  @use '../../styles/variables' as *;

  // Page content is authored in each view, so its elements don't carry this
  // component's scope class; :global under .page-body keeps prose consistent.
  // A readable column centered inside the shared container (which supplies the gutters).
  // Body text and lists stay left-aligned inside it; the banner above centers the title and intro.
  .page-body {
    width: 100%;
    max-width: 50rem;
    margin-inline: auto;
    padding-block: $space-8 $space-12;
    line-height: 1.7;

    :global(h2) {
      margin: $space-12 0 $space-3;
      font-size: 1.35rem;
      line-height: 1.3;
    }

    :global(h2:first-child) {
      margin-top: 0;
    }

    :global(p),
    :global(ul) {
      margin: 0 0 $space-4;
    }

    :global(ul) {
      padding-left: $space-6;
    }

    :global(li) {
      margin-bottom: $space-1;
    }

    :global(code),
    :global(kbd) {
      font-family: var(--font-mono);
      font-size: 0.85em;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: $radius-sm;
      padding: 0 $space-1;
    }
  }
</style>
