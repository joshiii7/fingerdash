<script lang="ts">
  import { onMount, untrack, type Snippet } from 'svelte';
  import TypedText from './TypedText.svelte';
  import { imageSet, MOBILE_MEDIA } from '../config/images';
  import { buildSchedule, loopRevealed, prefersReducedMotion } from '../utils/typewriter';

  interface Props {
    /** The page's single <h1>. */
    title: string;
    lead?: string;
    /** `hero` is the taller homepage banner; `page` is the shorter one for every other page. */
    variant?: 'hero' | 'page';
    /** Optional extra content under the lead, such as call-to-action buttons. */
    children?: Snippet;
    /**
     * Type the title, then the lead, and keep going: it holds the finished text, deletes it, and
     * types it again, forever. Skipped for reduced motion. The full text is in the page from the
     * first render either way.
     */
    typewriter?: boolean;
  }

  let { title, lead, variant = 'page', children, typewriter = false }: Props = $props();

  // The hero uses the home banner; every other page uses the shorter page banner.
  const media = $derived(imageSet(variant === 'hero' ? 'banner-home' : 'banner-page'));

  // Decided once, when the banner is created; it doesn't change while the page is open.
  const animating = untrack(() => typewriter && !prefersReducedMotion());
  const titleLength = $derived(Array.from(title).length);
  const total = $derived(titleLength + Array.from(lead ?? '').length);

  let revealed = $state(untrack(() => (animating ? 0 : total)));

  onMount(() => {
    if (!animating) return;

    const schedule = buildSchedule([titleLength, total - titleLength]);
    let frame = 0;
    let startedAt = 0;

    // Types, holds, deletes, and types again, for as long as the page is open.
    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      revealed = loopRevealed(schedule, now - startedAt);
      frame = requestAnimationFrame(tick);
    };
    // Two frames, so the banner has painted before the first character appears.
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(frame);
  });
</script>

<!-- The background image is decorative (CSS only). It spans the full width; the inner
     wrapper keeps the content on the 80rem grid and above the overlay. -->
<div class="page-banner page-banner--{variant}">
  <!-- Decorative, so alt="" and hidden from assistive technology. A <picture>, not a CSS
       background: phones download a cropped mobile file, desktops a 1024 or 1584 wide one. The
       banner is above the fold, so it loads eagerly, and the home hero is the likely LCP
       element, so it also gets high priority. Explicit width and height reserve its space. -->
  <div class="banner-media" aria-hidden="true">
    <picture>
      {#if media.mobile}
        <source
          media={MOBILE_MEDIA}
          srcset={media.mobile.src}
          width={media.mobile.width}
          height={media.mobile.height}
        />
      {/if}
      <img
        src={media.fallback.src}
        srcset={media.srcset}
        sizes="100vw"
        alt=""
        width={media.fallback.width}
        height={media.fallback.height}
        decoding="async"
        loading="eager"
        fetchpriority={variant === 'hero' ? 'high' : undefined}
      />
    </picture>
  </div>
  <div class="page-banner-inner">
    {#if animating}
      <h1 aria-label={title}>
        <TypedText text={title} offset={0} {revealed} caret />
      </h1>
      {#if lead}
        <p class="lead">
          <TypedText text={lead} offset={titleLength} {revealed} caret hiddenCopy />
        </p>
      {/if}
    {:else}
      <h1>{title}</h1>
      {#if lead}<p class="lead">{lead}</p>{/if}
    {/if}
    {#if children}<div class="extra">{@render children()}</div>{/if}
  </div>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  // The banner is always dark (image plus overlay), so its text is light in every
  // theme instead of following --color-text, which turns dark in the light theme.
  $banner-heading: #ffffff;
  $banner-text: #e6edf3;

  .page-banner {
    position: relative;
    width: 100%;
    overflow: hidden;
    text-align: center;
    // Shown while the image loads.
    background-color: var(--color-surface);

    // Dark gradient so the text stays readable over the photo. Order, back to front: the
    // image (0), this overlay (1), the text (2).
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    &--hero {
      padding-block: $space-12 * 1.5;
      min-height: 22rem;
      display: flex;
      align-items: center;

      &::before {
        background: linear-gradient(180deg, rgb(13 17 23 / 0.45), rgb(13 17 23 / 0.7));
      }

      h1 {
        font-size: clamp(2.5rem, 6vw, 3.75rem);
      }
    }

    &--page {
      padding-block: $space-8;

      &::before {
        background: linear-gradient(180deg, rgb(13 17 23 / 0.65), rgb(13 17 23 / 0.85));
      }
    }
  }

  // The image fills the banner behind everything. It is one <picture> in a wrapper, which is
  // also where a transform such as parallax would go.
  .banner-media {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;

    picture {
      display: block;
      width: 100%;
      height: 100%;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  }

  .page-banner-inner {
    @include page-width;
    position: relative;
    z-index: 2;

    // Decorative accent bar; carries no information.
    &::after {
      content: '';
      display: block;
      width: 3rem;
      height: 3px;
      margin: $space-4 auto 0;
      border-radius: 2px;
      background: var(--color-accent);
    }
  }

  h1 {
    margin: 0;
    font-size: clamp(1.75rem, 4vw, 2.25rem);
    line-height: 1.2;
    color: $banner-heading;
    text-shadow: 0 2px 8px rgb(0 0 0 / 0.55);
  }

  .lead {
    max-width: 40rem;
    margin: $space-3 auto 0;
    color: $banner-text;
    font-size: 1.05rem;
    line-height: 1.6;
    text-shadow: 0 1px 4px rgb(0 0 0 / 0.55);
  }

  .extra {
    margin-top: $space-6;
  }
</style>
