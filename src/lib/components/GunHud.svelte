<script lang="ts">
  import { onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { gun, runGunAction } from '../gun/gunController';
  import { WEAPONS } from '../gun/weapons';
  import {
    gunShortcutLabel,
    isGunToggleShortcut,
    isVolumeFocusShortcut,
    volumeShortcutLabel,
  } from '../gun/shortcuts';
  import { gunSettings, isSilent, MAX_VOLUME } from '../stores/gun';
  import { overlayOpen } from '../stores/palette';

  interface Props {
    /** The element that gets the light screen shake on each shot. */
    effectTarget?: () => HTMLElement | null | undefined;
  }

  let { effectTarget }: Props = $props();

  const gunMessage = gun.message;

  /** Keys a focused slider uses itself. They must not reach the typing session. */
  const SLIDER_KEYS = new Set([
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
    'PageUp',
    'PageDown',
  ]);

  let hudEl: HTMLDivElement | undefined = $state();
  let flashEl: HTMLSpanElement | undefined = $state();
  let volumeEl: HTMLInputElement | undefined = $state();

  const enabled = $derived($gunSettings.enabled);
  const silent = $derived(isSilent($gunSettings));
  const gunShortcut = gunShortcutLabel();
  const volumeShortcut = volumeShortcutLabel();

  function slideIn() {
    // The panel opens and closes smoothly, and not at all for people who ask for less motion.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { duration: reduce ? 0 : 200 };
  }

  function onWindowKeydown(e: KeyboardEvent) {
    if ($overlayOpen || e.defaultPrevented || e.isComposing) return;
    if (isGunToggleShortcut(e)) {
      e.preventDefault();
      runGunAction('toggle');
    } else if (isVolumeFocusShortcut(e) && enabled) {
      e.preventDefault();
      volumeEl?.focus();
    }
  }

  onMount(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    let flash: Animation | null = null;
    let shake: Animation | null = null;

    // Muzzle flash and a 1-2px shake on every shot. Cancelling the last one first keeps a long
    // burst from stacking up animations.
    const stopListening = gun.onFire(() => {
      if (reduce.matches) return;
      flash?.cancel();
      flash =
        flashEl?.animate(
          [
            { opacity: 0.95, transform: 'scale(0.6)' },
            { opacity: 0, transform: 'scale(1.7)' },
          ],
          { duration: 90, easing: 'ease-out' },
        ) ?? null;
      const target = effectTarget?.();
      if (!target) return;
      const dx = (Math.random() * 2 - 1) * 1.5;
      const dy = (Math.random() * 2 - 1) * 1.5;
      shake?.cancel();
      shake = target.animate(
        [
          { transform: 'translate(0, 0)' },
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 70, easing: 'ease-out' },
      );
    });

    // A control that has focus must never swallow typing. Letters (and Space) hand focus back to
    // the test and carry on to the typing session; only the slider keeps its own arrow keys.
    function onHudKeydown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target instanceof HTMLInputElement && target.type === 'range' && SLIDER_KEYS.has(e.key)) {
        e.stopPropagation();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) target.blur();
    }
    hudEl?.addEventListener('keydown', onHudKeydown);

    return () => {
      stopListening();
      flash?.cancel();
      shake?.cancel();
      hudEl?.removeEventListener('keydown', onHudKeydown);
    };
  });
</script>

<svelte:window onkeydown={onWindowKeydown} />

<div class="gun-hud" class:on={enabled} bind:this={hudEl}>
  <button
    type="button"
    class="gun-toggle"
    aria-pressed={enabled}
    aria-label="Gun Mode"
    aria-keyshortcuts="Control+G Meta+G"
    data-tip="Gun Mode ({gunShortcut})"
    onclick={() => runGunAction('toggle')}
  >
    <span class="flash" bind:this={flashEl} aria-hidden="true"></span>
    <Icon name="crosshair" />
    <span class="toggle-label" aria-hidden="true">Gun Mode</span>
    <span class="toggle-state" aria-hidden="true">{enabled ? 'On' : 'Off'}</span>
  </button>

  {#if enabled}
    <div class="panel" transition:slide={slideIn()}>
      <div class="panel-inner">
        <div class="weapons" role="group" aria-label="Weapon">
          {#each WEAPONS as w (w.id)}
            <button
              type="button"
              class:active={$gunSettings.weapon === w.id}
              aria-pressed={$gunSettings.weapon === w.id}
              onclick={() => gunSettings.patch({ weapon: w.id })}
            >
              {w.label}
            </button>
          {/each}
        </div>

        <div class="volume">
          <button
            type="button"
            class="mute"
            aria-pressed={silent}
            aria-label="Mute gun sounds"
            data-tip={silent ? 'Unmute' : 'Mute'}
            onclick={() => gunSettings.toggleMute()}
          >
            <Icon name={silent ? 'speaker-off' : 'speaker'} />
          </button>
          <input
            bind:this={volumeEl}
            class="slider"
            type="range"
            min="0"
            max={MAX_VOLUME}
            step="5"
            value={$gunSettings.volume}
            aria-label="Gun volume"
            aria-valuetext="{$gunSettings.volume} percent{$gunSettings.muted ? ', muted' : ''}"
            aria-keyshortcuts="Control+Shift+V Meta+Shift+V"
            title="Gun volume ({volumeShortcut} to focus)"
            style:--fill="{($gunSettings.volume / MAX_VOLUME) * 100}%"
            oninput={(e) => gunSettings.setVolume(Number(e.currentTarget.value))}
          />
          <output class="percent" aria-hidden="true">
            {$gunSettings.muted ? 'Muted' : `${$gunSettings.volume}%`}
          </output>
        </div>
      </div>
    </div>
  {/if}

  <p class="visually-hidden" role="status" aria-live="polite">{$gunMessage}</p>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .gun-hud {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-2;
    width: 100%;
  }

  // The toggle: a small game-HUD pill with a crosshair and a state word.
  .gun-toggle {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    padding: $space-1 $space-3;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-surface);
    color: var(--color-text-muted);
    font: inherit;
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    cursor: pointer;
    @include touch-target;
    @include focus-ring;
    transition:
      color $transition-fast,
      border-color $transition-fast,
      box-shadow $transition-normal;

    &:hover {
      color: var(--color-text);
      border-color: var(--color-accent);
    }

    :global(.icon) {
      font-size: 1.1rem;
    }

    .toggle-label {
      text-transform: uppercase;
      font-weight: 600;
    }

    // A word as well as a glow, so the state is never shown by color alone.
    .toggle-state {
      padding: 0 $space-2;
      border-radius: $radius-sm;
      background: var(--color-surface-raised);
      font-family: var(--font-mono);
      font-size: 0.7rem;
      text-transform: uppercase;
    }
  }

  .on .gun-toggle {
    color: var(--color-text);
    border-color: var(--color-accent);
    box-shadow:
      0 0 0 1px var(--color-accent),
      0 0 16px color-mix(in srgb, var(--color-accent) 40%, transparent);

    .toggle-state {
      background: var(--color-accent);
      color: var(--color-bg);
    }
  }

  // The muzzle flash: a quick glow over the crosshair, driven by the Web Animations API.
  .flash {
    position: absolute;
    inset-block: -6px;
    inset-inline-start: -2px;
    width: 2.4rem;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      #fff 0,
      color-mix(in srgb, var(--color-accent) 70%, transparent) 40%,
      transparent 70%
    );
    opacity: 0;
    pointer-events: none;
  }

  // A small tooltip on hover or keyboard focus. It names the shortcut.
  [data-tip] {
    &::after {
      content: attr(data-tip);
      position: absolute;
      inset-block-start: calc(100% + 6px);
      inset-inline-start: 50%;
      translate: -50% 0;
      padding: $space-1 $space-2;
      border: 1px solid var(--color-border);
      border-radius: $radius-sm;
      background: var(--color-surface-raised);
      color: var(--color-text);
      font-size: 0.75rem;
      letter-spacing: normal;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: opacity $transition-fast;
      z-index: 5;
    }

    &:hover::after,
    &:focus-visible::after {
      opacity: 1;
      visibility: visible;
    }

    @media (pointer: coarse) {
      &::after {
        display: none;
      }
    }
  }

  .panel {
    width: 100%;
    max-width: 44rem;
  }

  .panel-inner {
    @include card;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-3 $space-4;
    padding: $space-3 $space-4;
    // A HUD feel: a thin accent edge on the left.
    border-inline-start: 3px solid var(--color-accent);
    font-size: 0.85rem;
  }

  .weapons {
    display: flex;
    flex-wrap: wrap;
    gap: $space-1;

    button {
      padding: $space-1 $space-3;
      border: 1px solid transparent;
      border-radius: $radius-sm;
      background: transparent;
      color: var(--color-text-muted);
      font: inherit;
      cursor: pointer;
      @include touch-target;
      @include focus-ring;

      &:hover {
        color: var(--color-text);
      }

      // Underlined as well as colored, so the chosen weapon isn't shown by color alone.
      &.active {
        border-color: var(--color-accent);
        color: var(--color-accent);
        text-decoration: underline;
        text-underline-offset: 0.3em;
      }
    }
  }

  .volume {
    display: flex;
    align-items: center;
    gap: $space-2;
  }

  .mute {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 50%;
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
    font-size: 1.1rem;
    cursor: pointer;
    @include focus-ring;

    &:hover {
      color: var(--color-text);
    }

    &[aria-pressed='true'] {
      color: var(--color-error);
    }

    @media (pointer: coarse) {
      width: 2.75rem;
      height: 2.75rem;
    }
  }

  .percent {
    min-width: 3.2rem;
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--color-text);
  }

  // The slider is drawn like a HUD gauge: a thin track that fills with the accent color, and a
  // squared thumb. The same rules are repeated for WebKit and Firefox.
  .slider {
    --track: 6px;
    appearance: none;
    width: 10rem;
    height: 1.5rem;
    margin: 0;
    background: transparent;
    cursor: pointer;
    @include focus-ring;

    &::-webkit-slider-runnable-track {
      height: var(--track);
      border-radius: 3px;
      background: linear-gradient(
        to right,
        var(--color-accent) var(--fill),
        var(--color-border) var(--fill)
      );
    }

    &::-moz-range-track {
      height: var(--track);
      border-radius: 3px;
      background: var(--color-border);
    }

    &::-moz-range-progress {
      height: var(--track);
      border-radius: 3px;
      background: var(--color-accent);
    }

    &::-webkit-slider-thumb {
      appearance: none;
      width: 0.6rem;
      height: 1.1rem;
      margin-top: calc((var(--track) - 1.1rem) / 2);
      border: none;
      border-radius: 2px;
      background: var(--color-text);
      box-shadow: 0 0 8px color-mix(in srgb, var(--color-accent) 60%, transparent);
    }

    &::-moz-range-thumb {
      width: 0.6rem;
      height: 1.1rem;
      border: none;
      border-radius: 2px;
      background: var(--color-text);
      box-shadow: 0 0 8px color-mix(in srgb, var(--color-accent) 60%, transparent);
    }
  }
</style>
