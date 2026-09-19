<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Columns on wide screens. It always drops to 2, then 1, as the screen narrows. */
    columns?: 2 | 3 | 4;
    /** Adds space above, for a grid that follows a paragraph or intro. */
    spaced?: boolean;
    children: Snippet;
  }

  let { columns = 3, spaced = false, children }: Props = $props();
</script>

<ul class="grid c{columns}" class:spaced>
  {@render children()}
</ul>

<style lang="scss">
  @use '../../styles/variables' as *;

  .grid {
    display: grid;
    gap: $space-4;
    grid-template-columns: 1fr;
    margin: 0;
    padding: 0;
    list-style: none;

    @media (min-width: 40rem) {
      grid-template-columns: repeat(2, 1fr);
    }

    &.spaced {
      margin-top: $space-8;
    }

    &.c3 {
      @media (min-width: 64rem) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    &.c4 {
      @media (min-width: 64rem) {
        grid-template-columns: repeat(4, 1fr);
      }
    }
  }
</style>
