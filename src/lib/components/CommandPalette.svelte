<script lang="ts">
  import { tick } from 'svelte';
  import { get } from 'svelte/store';
  import Modal from './Modal.svelte';
  import {
    customDialogRequest,
    lessonWhyRequest,
    paletteOpen,
    previewTheme,
  } from '../stores/palette';
  import { settings, THEMES } from '../stores/settings';
  import { router, ROUTE_LABELS } from '../router/router';
  import { buildCommands, filterCommands, type Command } from '../palette/commands';
  import { isPaletteShortcut } from '../palette/openRules';
  import { runGunAction } from '../gun/gunController';

  const commands = buildCommands();

  let query = $state('');
  let activeIndex = $state(0);
  let liveMessage = $state('');
  let inputEl: HTMLInputElement | undefined = $state();
  // Set false when a command moves focus itself (for example by changing page).
  let restoreOnClose = $state(true);

  const results = $derived(filterCommands(commands, query));
  const activeCommand = $derived(results[activeIndex] ?? null);
  const resultsSummary = $derived(
    results.length === 0
      ? 'No matching commands'
      : `${results.length} ${results.length === 1 ? 'command' : 'commands'} available`,
  );

  function optionId(command: Command): string {
    return `palette-option-${command.id}`;
  }

  function isCurrentTheme(command: Command): boolean {
    return command.kind === 'theme' && command.themeId === $settings.theme;
  }

  // Each time the palette opens: start with an empty search and highlight the
  // current theme, so the initial preview matches what's already showing.
  $effect(() => {
    if (!$paletteOpen) return;
    query = '';
    restoreOnClose = true;
    activeIndex = Math.max(
      0,
      commands.findIndex((c) => c.kind === 'theme' && c.themeId === $settings.theme),
    );
  });

  // Live-preview the highlighted theme; closing without choosing clears it.
  $effect(() => {
    if (!$paletteOpen) {
      previewTheme.set(null);
      return;
    }
    const command = activeCommand;
    previewTheme.set(command?.kind === 'theme' ? command.themeId : null);
  });

  // Announce result counts to screen readers while the palette is open.
  $effect(() => {
    if ($paletteOpen) liveMessage = resultsSummary;
  });

  $effect(() => {
    if (!$paletteOpen || !activeCommand) return;
    document.getElementById(optionId(activeCommand))?.scrollIntoView?.({ block: 'nearest' });
  });

  function close(restoreFocus = true) {
    restoreOnClose = restoreFocus;
    previewTheme.set(null);
    paletteOpen.set(false);
  }

  async function runCommand(command: Command) {
    if (command.kind === 'theme') {
      settings.patch({ theme: command.themeId });
      const label = THEMES.find((t) => t.id === command.themeId)?.label ?? command.themeId;
      liveMessage = `Theme set to ${label}`;
      close(true);
    } else if (command.kind === 'navigate') {
      liveMessage = `Opened ${ROUTE_LABELS[command.route]}`;
      // The new page takes focus itself, so don't hand it back to the old element.
      close(false);
      await tick();
      router.navigate(command.route);
    } else if (command.kind === 'lesson-why') {
      liveMessage = 'Opening the lesson explanation';
      close(false);
      await tick();
      router.navigate('tutorial');
      lessonWhyRequest.set(true);
    } else if (command.kind === 'gun') {
      // Gun Mode controls act in place; they don't change page.
      liveMessage = runGunAction(command.action, command.weapon);
      close(true);
    } else {
      // Test settings and actions: apply them, then show the test page. Focus only
      // goes back to the old element if we were already on the test page.
      const onTest = get(router) === 'test';
      liveMessage = command.kind === 'setting' ? command.announce : 'Editing custom text.';
      close(onTest);
      await tick();
      if (command.kind === 'setting') {
        settings.patch(command.patch);
      } else {
        settings.patch({ mode: 'custom' });
        customDialogRequest.set(true);
      }
      router.navigate('test');
    }
  }

  function move(delta: number) {
    if (results.length === 0) return;
    activeIndex = (activeIndex + delta + results.length) % results.length;
  }

  // Esc, Tab, focus trapping and the backdrop are handled by <Modal>.
  function onKeydown(event: KeyboardEvent) {
    if (isPaletteShortcut(event)) {
      event.preventDefault();
      close();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        move(-1);
        break;
      case 'Enter':
        event.preventDefault();
        if (!event.isComposing && activeCommand) void runCommand(activeCommand);
        break;
    }
  }

  function onModalClose(reason: 'escape' | 'backdrop') {
    if (reason === 'escape') liveMessage = '';
    close();
  }
</script>

<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{liveMessage}</div>

<Modal
  open={$paletteOpen}
  onClose={onModalClose}
  labelledby="palette-title"
  placement="top"
  size="md"
  restoreFocus={restoreOnClose}
  initialFocus={() => inputEl}
  {onKeydown}
>
  <h2 id="palette-title" class="visually-hidden">Command palette</h2>

  <div class="search">
    <input
      bind:this={inputEl}
      bind:value={query}
      oninput={() => (activeIndex = 0)}
      type="text"
      role="combobox"
      aria-label="Search commands"
      aria-expanded="true"
      aria-controls="palette-listbox"
      aria-autocomplete="list"
      aria-activedescendant={activeCommand ? optionId(activeCommand) : undefined}
      placeholder="Type a command or page name"
      autocomplete="off"
      spellcheck="false"
    />
    <button type="button" class="close" onclick={() => close()}>Close</button>
  </div>

  <ul id="palette-listbox" role="listbox" aria-label="Commands">
    {#each results as command, index (command.id)}
      <!-- Keyboard use goes through the combobox input (arrows + Enter); a click is the pointer route. -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <li
        id={optionId(command)}
        role="option"
        tabindex="-1"
        aria-selected={index === activeIndex}
        class:active={index === activeIndex}
        onmousemove={() => {
          if (activeIndex !== index) activeIndex = index;
        }}
        onmousedown={(e) => e.preventDefault()}
        onclick={() => runCommand(command)}
      >
        <span>{command.label}</span>
        {#if isCurrentTheme(command)}<span class="badge">Current</span>{/if}
      </li>
    {/each}
  </ul>

  {#if results.length === 0}
    <p class="empty">No matching commands</p>
  {/if}

  <p class="help" aria-hidden="true">
    <kbd>↑</kbd> <kbd>↓</kbd> to move &middot; <kbd>Enter</kbd> to select &middot;
    <kbd>Esc</kbd> to close
  </p>
</Modal>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .search {
    display: flex;
    gap: $space-2;
    padding: $space-3;
    border-bottom: 1px solid var(--color-border);
  }

  input {
    flex: 1;
    min-width: 0;
    background: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    padding: $space-2 $space-3;
    font: inherit;
  }

  .close {
    background: transparent;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    padding: $space-1 $space-3;
    cursor: pointer;
    @include touch-target;

    &:hover {
      color: var(--color-text);
    }
  }

  ul {
    list-style: none;
    margin: 0;
    padding: $space-2;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;
    padding: $space-2 $space-3;
    border-radius: $radius-sm;
    color: var(--color-text);
    cursor: pointer;

    // Outline as well as background so the highlighted row doesn't rely on color alone.
    &.active {
      background: var(--color-surface-raised);
      outline: 2px solid var(--color-accent);
      outline-offset: -2px;
    }
  }

  .badge {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    padding: 0 $space-2;
  }

  .empty {
    margin: 0;
    padding: $space-3 $space-4;
    color: var(--color-text-muted);
  }

  .help {
    margin: 0;
    padding: $space-2 $space-4;
    border-top: 1px solid var(--color-border);
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  kbd {
    font-family: var(--font-mono);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    padding: 0 $space-1;
  }
</style>
