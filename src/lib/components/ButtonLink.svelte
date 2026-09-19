<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    variant?: 'primary' | 'secondary';
    children: Snippet;
  }

  let { href, variant = 'secondary', children }: Props = $props();
</script>

<a class="btn {variant}" {href}>{@render children()}</a>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: $space-2 $space-6;
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-size: 1rem;
    text-decoration: none;
    @include touch-target;
    transition: border-color $transition-fast;

    &:hover {
      border-color: var(--color-accent);
    }

    &.primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-bg);
      font-weight: 600;
    }
  }
</style>
