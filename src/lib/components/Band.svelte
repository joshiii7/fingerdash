<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** `bg` and `surface` alternate down the page; `dark` is the always-dark statistics strip. */
    tone?: 'bg' | 'surface' | 'dark';
    /** The id of the section's heading, for aria-labelledby. */
    labelledby: string;
    children: Snippet;
  }

  let { tone = 'bg', labelledby, children }: Props = $props();
</script>

<!-- A full-width background band. Its content sits in the shared 80rem container. -->
<section class="band {tone}" aria-labelledby={labelledby}>
  <div class="inner">
    {@render children()}
  </div>
</section>

<style lang="scss">
  @use '../../styles/mixins' as *;

  .band {
    padding-block: clamp(4rem, 8vw, 6rem);
    // Cards inside a band use whichever of the two theme surfaces differs from the band.
    --card-bg: var(--color-surface);

    &.bg {
      background: var(--color-bg);
    }

    &.surface {
      background: var(--color-surface);
      --card-bg: var(--color-bg);
    }

    // Always dark, like the page banners, so the figures read the same in every theme.
    // Darker than the dark theme's own page color, with a faint glow and border lines,
    // so it still reads as its own band there.
    &.dark {
      background:
        radial-gradient(48rem 14rem at 50% 0, rgb(47 129 247 / 0.16), transparent), #010409;
      border-block: 1px solid #21262d;
      color: #e6edf3;
    }
  }

  .inner {
    @include page-width;
  }
</style>
