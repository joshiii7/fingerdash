<script lang="ts">
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';
  import { portal } from '../utils/portal';
  import { lockScroll, unlockScroll } from '../utils/scrollLock';
  import { openModalCount } from '../stores/palette';

  interface Props {
    open: boolean;
    /**
     * Esc and a backdrop click ask to close. The parent decides what closing means
     * (for example keeping an unsaved draft) and then sets `open` to false.
     */
    onClose: (reason: 'escape' | 'backdrop') => void;
    labelledby: string;
    describedby?: string;
    /** `alertdialog` for confirmations that need an answer. */
    role?: 'dialog' | 'alertdialog';
    placement?: 'center' | 'top';
    size?: 'sm' | 'md' | 'lg';
    /** Element to focus on open. Defaults to the first focusable control. */
    initialFocus?: () => HTMLElement | null | undefined;
    /** Element to return focus to on close. Defaults to whatever had focus when it opened. */
    returnFocusTo?: () => HTMLElement | null | undefined;
    /** Set false when the caller moves focus itself (for example after navigating). */
    restoreFocus?: boolean;
    /** Runs first for every keydown inside the dialog; call preventDefault to claim a key. */
    onKeydown?: (event: KeyboardEvent) => void;
    children: Snippet;
  }

  let {
    open,
    onClose,
    labelledby,
    describedby,
    role = 'dialog',
    placement = 'center',
    size = 'md',
    initialFocus,
    returnFocusTo,
    restoreFocus = true,
    onKeydown,
    children,
  }: Props = $props();

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const CLOSE_MS = 150;

  let dialogEl: HTMLDivElement | undefined = $state();
  // The dialog stays in the DOM briefly after `open` turns false so it can fade out.
  let visible = $state(false);
  let closing = $state(false);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  let registered = false;
  let opener: HTMLElement | null = null;
  // A backdrop click only counts if the press *and* the release were on the backdrop,
  // so selecting text inside the dialog and letting go outside doesn't close it.
  let pressedOnBackdrop = false;

  function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Before the DOM changes, note what had focus and count this modal in, so typing
  // is paused and the page goes inert from the very first frame.
  $effect.pre(() => {
    if (open && !registered) {
      registered = true;
      const active = document.activeElement;
      opener = active instanceof HTMLElement && active !== document.body ? active : null;
      openModalCount.update((n) => n + 1);
      lockScroll();
    }
  });

  function release(restore: boolean) {
    if (!registered) return;
    registered = false;
    openModalCount.update((n) => Math.max(0, n - 1));
    unlockScroll();
    if (restore) {
      void tick().then(() => {
        const target = returnFocusTo?.() ?? opener;
        if (target?.isConnected) target.focus();
      });
    }
  }

  $effect(() => {
    if (open) {
      clearTimeout(closeTimer);
      closing = false;
      visible = true;
      void tick().then(() => {
        const target = initialFocus?.() ?? dialogEl?.querySelector<HTMLElement>(FOCUSABLE);
        (target ?? dialogEl)?.focus();
      });
    } else if (visible) {
      release(restoreFocus);
      if (prefersReducedMotion()) {
        visible = false;
      } else {
        closing = true;
        closeTimer = setTimeout(() => {
          visible = false;
          closing = false;
        }, CLOSE_MS);
      }
    }
  });

  // If the modal's owner goes away while it is open (for example a page change), let go cleanly.
  $effect(() => () => {
    clearTimeout(closeTimer);
    release(false);
  });

  function trapTab(event: KeyboardEvent) {
    if (!dialogEl) return;
    const focusable = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    onKeydown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose('escape');
    } else if (event.key === 'Tab') {
      trapTab(event);
    }
  }

  // Esc should work even if focus somehow sits outside the dialog.
  function handleWindowKeydown(event: KeyboardEvent) {
    if (open && !event.defaultPrevented && event.key === 'Escape') {
      event.preventDefault();
      onClose('escape');
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    const onBackdrop = event.target === event.currentTarget;
    if (pressedOnBackdrop && onBackdrop) onClose('backdrop');
    pressedOnBackdrop = false;
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if visible}
  <!-- Keyboard users close with Esc; a backdrop click is a pointer shortcut for the same thing. -->
  <div
    class="backdrop"
    class:top={placement === 'top'}
    class:closing
    role="presentation"
    use:portal
    onpointerdown={(event) => (pressedOnBackdrop = event.target === event.currentTarget)}
    onclick={handleBackdropClick}
  >
    <div
      class="modal {size}"
      {role}
      aria-modal="true"
      aria-labelledby={labelledby}
      aria-describedby={describedby}
      tabindex="-1"
      bind:this={dialogEl}
      onkeydown={handleKeydown}
    >
      {@render children()}
    </div>
  </div>
{/if}

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-4;
    background: rgb(0 0 0 / 0.6);

    &.top {
      align-items: flex-start;
      padding-top: 15vh;
    }

    // Already leaving: ignore clicks so a second one can't land on whatever is behind.
    &.closing {
      pointer-events: none;
    }

    @media (prefers-reduced-motion: no-preference) {
      animation: backdrop-in 150ms ease-out;

      &.closing {
        animation: backdrop-out 150ms ease-in forwards;
      }
    }
  }

  .modal {
    @include card;
    width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-surface);
    box-shadow: 0 16px 48px rgb(0 0 0 / 0.4);

    &.sm {
      max-width: 28rem;
    }
    &.md {
      max-width: 36rem;
    }
    &.lg {
      max-width: 44rem;
    }

    &:focus {
      outline: none;
    }

    @media (prefers-reduced-motion: no-preference) {
      animation: modal-in 150ms ease-out;

      .closing & {
        animation: modal-out 150ms ease-in forwards;
      }
    }
  }

  @keyframes backdrop-in {
    from {
      opacity: 0;
    }
  }
  @keyframes backdrop-out {
    to {
      opacity: 0;
    }
  }
  @keyframes modal-in {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
  }
  @keyframes modal-out {
    to {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
  }
</style>
