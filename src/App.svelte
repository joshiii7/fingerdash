<script lang="ts">
  import { router } from './lib/router/router';
  import { pageForRoute } from './lib/config/pages';
  import { settings } from './lib/stores/settings';
  import { activeSession, openPalette, overlayOpen, previewTheme } from './lib/stores/palette';
  import { shouldOpenPalette, type RunStatus } from './lib/palette/openRules';
  import CommandPalette from './lib/components/CommandPalette.svelte';
  import BackToTop from './lib/components/BackToTop.svelte';
  import SiteHeader from './lib/components/SiteHeader.svelte';
  import SiteFooter from './lib/components/SiteFooter.svelte';
  import HomeView from './lib/views/HomeView.svelte';
  import TestView from './lib/views/TestView.svelte';
  import TutorialView from './lib/views/TutorialView.svelte';
  import AboutView from './lib/views/AboutView.svelte';
  import AccessibilityView from './lib/views/AccessibilityView.svelte';
  import PrivacyView from './lib/views/PrivacyView.svelte';

  let mainEl: HTMLElement | undefined = $state();
  let hasNavigated = false;

  $effect(() => {
    document.documentElement.dataset.theme = $previewTheme ?? $settings.theme;
  });

  $effect(() => {
    const route = $router;
    // The static HTML already carries this title; keep it right when navigating in-app.
    document.title = pageForRoute(route).title;
    // Move focus to the new page on navigation (not on first load) so keyboard
    // and screen-reader users land on the content rather than the old link.
    // preventScroll: the router has already put the page at the top (or restored it on Back).
    if (hasNavigated) mainEl?.focus({ preventScroll: true });
    hasNavigated = true;
  });

  function currentRunStatus(): RunStatus {
    const session = $activeSession;
    return session ? session.engine.getStatus() : 'none';
  }

  function onWindowKeydown(event: KeyboardEvent) {
    const open = shouldOpenPalette({
      key: event.key,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      isComposing: event.isComposing,
      defaultPrevented: event.defaultPrevented,
      target: event.target,
      runStatus: currentRunStatus(),
      paletteOpen: $overlayOpen,
    });
    if (!open) return;
    event.preventDefault();
    openPalette();
  }

  // Move keyboard focus to the content instead of relying on the browser's jump.
  function skipToMain(event: MouseEvent) {
    event.preventDefault();
    mainEl?.focus();
  }
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="app-shell" inert={$overlayOpen}>
  <a href="#main-content" class="skip-nav" onclick={skipToMain}>Skip to Main Content</a>

  <SiteHeader />

  <main id="main-content" tabindex="-1" bind:this={mainEl}>
    {#if $router === 'home'}
      <HomeView />
    {:else if $router === 'test'}
      <TestView />
    {:else if $router === 'tutorial'}
      <TutorialView />
    {:else if $router === 'about'}
      <AboutView />
    {:else if $router === 'accessibility'}
      <AccessibilityView />
    {:else if $router === 'privacy'}
      <PrivacyView />
    {/if}
  </main>

  <SiteFooter />
  <BackToTop />
</div>

<CommandPalette />

<style lang="scss">
  .app-shell {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;

    // Focus is moved here programmatically; it isn't an interactive control.
    &:focus {
      outline: none;
    }
  }
</style>
