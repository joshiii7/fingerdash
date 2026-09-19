<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLLiAttributes } from 'svelte/elements';
  import Icon, { type IconName } from './Icon.svelte';

  interface Props extends HTMLLiAttributes {
    icon: IconName;
    title: string;
    /** Plain-text description. Use `children` instead when the body needs links or markup. */
    body?: string;
    children?: Snippet;
  }

  // Extra attributes (for example data-aos on the homepage) go on the card itself.
  let { icon, title, body, children, ...rest }: Props = $props();
</script>

<!-- A card for a Band: it uses --card-bg, which the band sets to the surface that contrasts with it. -->
<li class="card" {...rest}>
  <span class="icon-wrap"><Icon name={icon} /></span>
  <h3>{title}</h3>
  {#if children}
    <div class="body">{@render children()}</div>
  {:else if body}
    <p class="body">{body}</p>
  {/if}
</li>

<style lang="scss">
  @use '../../styles/variables' as *;

  .card {
    padding: $space-6;
    background: var(--card-bg, var(--color-surface));
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    transition:
      transform $transition-normal,
      border-color $transition-normal,
      box-shadow $transition-normal;

    @media (prefers-reduced-motion: no-preference) {
      &:hover {
        transform: translateY(-4px);
        border-color: var(--color-accent);
        box-shadow: 0 10px 24px rgb(0 0 0 / 0.25);
      }
    }

    h3 {
      margin: $space-4 0 $space-2;
      font-size: 1.1rem;
    }
  }

  .body {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.95rem;
    line-height: 1.65;

    :global(p) {
      margin: 0 0 $space-2;
    }

    :global(p:last-child) {
      margin-bottom: 0;
    }

    :global(kbd) {
      font-family: var(--font-mono);
      font-size: 0.85em;
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: $radius-sm;
      padding: 0 $space-1;
    }
  }

  .icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: $radius-md;
    background: color-mix(in srgb, var(--color-accent) 16%, transparent);
    color: var(--color-accent);
    font-size: 1.4rem;
  }
</style>
