<script lang="ts">
  import { tick } from 'svelte';
  import Logo from './Logo.svelte';
  import { hrefFor, router, ROUTE_LABELS, type Route } from '../router/router';
  import { openPalette } from '../stores/palette';
  import { paletteShortcutLabel } from '../palette/shortcut';

  const NAV_ROUTES: Route[] = ['about', 'tutorial', 'test'];
  const shortcutLabel = paletteShortcutLabel();

  let menuOpen = $state(false);
  let headerEl: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  // Any page change closes the menu (the link that was clicked has done its job).
  $effect(() => {
    void $router;
    menuOpen = false;
  });

  async function closeMenu(returnFocus: boolean) {
    menuOpen = false;
    if (returnFocus) {
      await tick();
      toggleEl?.focus();
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && menuOpen) {
      event.stopPropagation();
      void closeMenu(true);
    }
  }

  // A click outside the header closes an open menu.
  function onWindowClick(event: MouseEvent) {
    if (menuOpen && headerEl && !headerEl.contains(event.target as Node)) menuOpen = false;
  }

  function openCommands() {
    menuOpen = false;
    openPalette();
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<header class="app-header" bind:this={headerEl}>
  <div class="header-inner">
    <Logo />

    <!-- Centered on wide screens; hidden on phones, where there is no keyboard shortcut. -->
    <button type="button" class="palette-hint" onclick={openPalette}>
      <span class="hint-extra">Press</span>&nbsp;<kbd>{shortcutLabel}</kbd>&nbsp;<span
        class="hint-extra">for commands</span
      >
    </button>

    <button
      type="button"
      class="menu-toggle"
      aria-expanded={menuOpen}
      aria-controls="site-nav"
      bind:this={toggleEl}
      onclick={() => (menuOpen = !menuOpen)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        {#if menuOpen}
          <path d="M6 6l12 12M18 6L6 18" />
        {:else}
          <path d="M4 7h16M4 12h16M4 17h16" />
        {/if}
      </svg>
      Menu
    </button>

    <nav id="site-nav" aria-label="Main" class:open={menuOpen}>
      <ul>
        {#each NAV_ROUTES as route (route)}
          <li>
            <a
              href={hrefFor(route)}
              class:active={$router === route}
              aria-current={$router === route ? 'page' : undefined}
            >
              {ROUTE_LABELS[route]}
            </a>
          </li>
        {/each}
        <!-- Phones only: the header hint is hidden there, so keep the palette reachable. -->
        <li class="menu-commands">
          <button type="button" onclick={openCommands}>Commands</button>
        </li>
      </ul>
    </nav>
  </div>
</header>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  // Stays at the top while the page scrolls. It needs a solid background so content passes
  // behind it cleanly, and sits above page content (and the back-to-top button at 900) but
  // below dialogs (1100).
  .app-header {
    position: sticky;
    top: 0;
    z-index: 800;
    background: var(--color-bg);
    border-bottom: 1px solid var(--color-border);
  }

  // Three parts: logo on the left, the hint centered, the nav on the far right.
  // The outer columns are equal (1fr), so the hint stays centered whatever their widths.
  .header-inner {
    @include page-width;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: $space-4;
    padding-block: $space-3;
  }

  :global(.app-header .logo) {
    justify-self: start;
  }

  nav {
    grid-column: 3;
    justify-self: end;

    ul {
      display: flex;
      align-items: center;
      gap: $space-2;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    a,
    button {
      display: inline-flex;
      align-items: center;
      background: transparent;
      border: none;
      border-radius: $radius-sm;
      color: var(--color-text-muted);
      padding: $space-1 $space-3;
      font: inherit;
      font-size: 0.9rem;
      text-decoration: none;
      cursor: pointer;
      @include touch-target;
      transition: color $transition-fast;

      &:hover {
        color: var(--color-text);
      }
    }

    a.active {
      color: var(--color-accent);
    }
  }

  .menu-commands {
    display: none;
  }

  .palette-hint {
    grid-column: 2;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    color: var(--color-text-muted);
    padding: $space-1 $space-3;
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
    @include touch-target;

    &:hover {
      color: var(--color-text);
      border-color: var(--color-accent);
    }

    kbd {
      font-family: var(--font-mono);
      color: var(--color-text);
    }
  }

  .menu-toggle {
    display: none;
    grid-column: 2;
    justify-self: end;
    align-items: center;
    gap: $space-2;
    background: transparent;
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    color: var(--color-text);
    padding: $space-1 $space-3;
    font: inherit;
    font-size: 0.9rem;
    cursor: pointer;
    @include touch-target;

    svg {
      width: 1.25rem;
      height: 1.25rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
    }

    &:hover {
      border-color: var(--color-accent);
    }
  }

  // Tablets and narrow desktops: keep the hint centered by showing only the key combo.
  @include respond-below(56rem) {
    .hint-extra {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  }

  // Phones: no hint (there is no keyboard shortcut), and the nav becomes a menu button.
  @include respond-below(40rem) {
    .header-inner {
      grid-template-columns: 1fr auto;
    }

    .palette-hint {
      display: none;
    }

    .menu-toggle {
      display: inline-flex;
    }

    nav {
      display: none;
      position: absolute;
      top: 100%;
      inset-inline: 0;
      // The desktop rule right-aligns the nav in its grid cell; here it should span the header.
      justify-self: stretch;
      z-index: 50;
      padding: $space-2 var(--gutter) $space-3;
      background: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      box-shadow: 0 12px 24px rgb(0 0 0 / 0.3);

      &.open {
        display: block;
      }

      ul {
        flex-direction: column;
        align-items: stretch;
        gap: $space-1;
      }

      a,
      button {
        width: 100%;
        min-height: 2.75rem;
        padding-inline: $space-3;
      }
    }

    .menu-commands {
      display: block;
    }
  }
</style>
