<script lang="ts">
  // Built by Vite, so its URL is fingerprinted.
  import { imageSet } from '../config/images';
  import { hrefFor } from '../router/router';

  interface Props {
    /** `header` is the larger mark and text; `footer` is slightly smaller. */
    size?: 'header' | 'footer';
  }

  let { size = 'header' }: Props = $props();

  // Pixel size matches the 3.3rem / 1.5rem CSS heights (rounded) so there's no layout shift.
  const pixels = $derived(size === 'header' ? 53 : 24);
  const logo = imageSet('fingerdash-logo').fallback.src;
</script>

<a class="logo logo--{size}" href={hrefFor('home')}>
  <!-- Decorative: the visible text already says "Fingerdash". -->
  <!-- The header logo is above the fold; the footer one is far below it. -->
  <img
    class="mark"
    src={logo}
    alt=""
    width={pixels}
    height={pixels}
    decoding="async"
    loading={size === 'header' ? 'eager' : 'lazy'}
  />
  <span class="text">Fingerdash</span>
</a>

<style lang="scss">
  @use '../../styles/variables' as *;

  .logo {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    // Keep the mark and name on one line; the text shrinks instead of wrapping.
    white-space: nowrap;
    color: var(--color-text);
    text-decoration: none;
    border-radius: $radius-sm;

    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 4px;
    }
  }

  .mark {
    display: block;
    flex: none;
    height: 3.3rem;
    width: 3.3rem;
  }

  .text {
    font-family: var(--font-ui);
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1;
    font-size: clamp(1rem, 5vw, 1.25rem);
  }

  .logo--footer {
    .mark {
      height: 1.5rem;
      width: 1.5rem;
    }

    .text {
      font-size: clamp(0.9rem, 4.5vw, 1.05rem);
    }
  }
</style>
