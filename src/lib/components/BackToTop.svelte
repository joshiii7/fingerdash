<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from '../router/router';

  /** Appears after scrolling this far down. */
  const SHOW_AFTER = 400;

  let visible = $state(false);
  let frame = 0;

  // Only the window scrolls (no wrapper has its own overflow), so window scroll is the signal.
  function update() {
    frame = 0;
    const pageScrolls = document.documentElement.scrollHeight - window.innerHeight > SHOW_AFTER;
    visible = pageScrolls && window.scrollY > SHOW_AFTER;
  }

  // At most one update per frame.
  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  onMount(() => {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Page content changes height as views load (snippets, results), so watch it too.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  });

  // A new page has a new height.
  $effect(() => {
    void $router;
    schedule();
  });

  function scrollToTop() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    // Move keyboard focus to the top of the page (the logo), not to this button, which is
    // about to hide. preventScroll so the smooth scroll above isn't interrupted.
    document.querySelector<HTMLElement>('.app-header .logo')?.focus({ preventScroll: true });
  }
</script>

<button
  type="button"
  class="back-to-top"
  class:visible
  aria-label="Back to top"
  onclick={scrollToTop}
>
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
  <span aria-hidden="true">Top</span>
</button>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  // Look and behavior follow the portfolio's scroll-to-top button (a 3.5rem rounded
  // square, arrow over a small TOP label, lifts on hover), using Fingerdash's theme colors.
  //
  // It is pinned to the corner of the browser window. Its only positioning is
  // fixed + the viewport edges below; nothing here depends on the content container
  // or the footer. The footer leaves room for it instead (see SiteFooter).
  .back-to-top {
    --edge: #{$space-4};

    position: fixed;
    // Logical offsets, plus the safe areas so it clears a phone's rounded corners and home bar.
    inset-block-end: calc(var(--edge) + env(safe-area-inset-bottom, 0px));
    inset-inline-end: calc(var(--edge) + env(safe-area-inset-right, 0px));
    // Above page content, below modal dialogs and their backdrops (z-index 1100).
    z-index: 900;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    width: 3.5rem;
    height: 3.5rem;
    padding: 0.4rem 0 0;
    background: color-mix(in srgb, var(--color-accent) 35%, var(--color-surface));
    color: var(--color-text);
    border: 1px solid color-mix(in srgb, var(--color-accent) 55%, transparent);
    border-radius: $radius-md;
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.35);
    cursor: pointer;
    opacity: 0;
    // visibility (not display) keeps the fade, and still removes it from the tab order while hidden.
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity $transition-normal,
      transform $transition-normal,
      visibility $transition-normal,
      background-color $transition-fast;

    @media (min-width: 48rem) {
      --edge: #{$space-6};
    }

    &.visible {
      opacity: 0.95;
      visibility: visible;
      pointer-events: auto;
    }

    &:hover {
      opacity: 1;
      transform: translateY(-3px);
      background: color-mix(in srgb, var(--color-accent) 50%, var(--color-surface));
    }

    svg {
      width: 1.1rem;
      height: 1.1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    span {
      font-size: 0.6rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
  }
</style>
