<script lang="ts">
  import { onMount } from 'svelte';
  import { imageSet, MOBILE_MEDIA, type ImageName } from '../config/images';

  interface Props {
    /** Which image, from the manifest that `npm run images` writes. */
    name: ImageName;
    /** What the screenshot shows, for people who can't see it. */
    alt: string;
    /** One short line under the picture. */
    caption: string;
    /** How wide the picture is drawn at desktop sizes, so the browser picks the right file. */
    sizes?: string;
    /** Opens a larger version in a lightbox (Fancybox, started by the page) when clicked. */
    zoom?: boolean;
  }

  let {
    name,
    alt,
    caption,
    sizes = '(min-width: 56rem) 45vw, 100vw',
    zoom = false,
  }: Props = $props();

  const image = $derived(imageSet(name));

  // The lightbox shows the same file the page shows: the real mobile capture on a phone, the
  // largest desktop one otherwise.
  let onPhone = $state(false);
  onMount(() => {
    const query = window.matchMedia(MOBILE_MEDIA);
    onPhone = query.matches;
    const update = (event: MediaQueryListEvent) => (onPhone = event.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
  const largeSrc = $derived(onPhone && image.mobile ? image.mobile.src : image.fallback.src);
</script>

<!-- A <picture>: phones download the real mobile capture (the mobile layout at 390px), desktops a
     960 or 1440 wide one. Explicit width and height reserve the space, so nothing shifts as it
     loads, and it loads lazily because it sits below the top of the page. -->
<figure class="shot">
  {#if zoom}
    <a
      class="zoom"
      href={largeSrc}
      data-fancybox="about"
      data-caption={caption}
      aria-label="View larger: {caption}"
    >
      {@render picture()}
    </a>
  {:else}
    {@render picture()}
  {/if}
  <figcaption>{caption}</figcaption>
</figure>

{#snippet picture()}
  <picture>
    {#if image.mobile}
      <source
        media={MOBILE_MEDIA}
        srcset={image.mobile.src}
        width={image.mobile.width}
        height={image.mobile.height}
      />
    {/if}
    <img
      src={image.fallback.src}
      srcset={image.srcset}
      {sizes}
      {alt}
      width={image.fallback.width}
      height={image.fallback.height}
      loading="lazy"
      decoding="async"
    />
  </picture>
{/snippet}

<style lang="scss">
  @use '../../styles/variables' as *;

  .shot {
    margin: 0;
    overflow: hidden;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-lg;
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.28);

    // On a phone the capture is tall and narrow, so keep it a sensible width instead of
    // stretching it across the whole screen.
    @media (max-width: 48rem) {
      max-width: 22rem;
      margin-inline: auto;
    }
  }

  picture {
    display: block;
  }

  .zoom {
    display: block;
    cursor: zoom-in;

    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: -2px;
    }
  }

  img {
    display: block;
    width: 100%;
    height: auto;
  }

  figcaption {
    padding: $space-3 $space-4;
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
    text-align: center;
  }
</style>
