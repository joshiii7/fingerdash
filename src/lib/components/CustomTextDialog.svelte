<script lang="ts">
  import Modal from './Modal.svelte';
  import {
    CUSTOM_TEXT_MAX,
    DEFAULT_CUSTOM_TEXT,
    countText,
    normalizeCustomText,
    validateCustomText,
  } from '../text/customText';

  interface Props {
    open: boolean;
    /** The currently saved custom text. */
    initialText: string;
    /** Receives the normalized text. */
    onSave: (text: string) => void;
    /** Any way of closing: Cancel, Esc, the backdrop, or after saving. */
    onClose: () => void;
    /** Where focus should go when the dialog closes (the Change button). */
    returnFocusTo?: () => HTMLElement | null | undefined;
  }

  let { open, initialText, onSave, onClose, returnFocusTo }: Props = $props();

  let draft = $state('');
  let error = $state('');
  let announcement = $state('');
  let restored = $state(false);
  let textareaEl: HTMLTextAreaElement | undefined = $state();
  // Unsaved text kept when the dialog is closed by Esc or a backdrop click, so a
  // stray click never throws away a pasted essay. Cancel and Save clear it.
  let keptDraft: string | null = null;

  // Counts and notes describe what will actually be typed, so they use the
  // normalized text rather than the raw box contents.
  const result = $derived(normalizeCustomText(draft));
  const counts = $derived(countText(result.text));

  // Each time the dialog opens: load the kept draft or the saved text.
  $effect(() => {
    if (!open) return;
    restored = keptDraft !== null;
    draft = keptDraft ?? initialText;
    error = '';
    announcement = restored ? 'Restored your unsaved draft.' : '';
    void Promise.resolve().then(() => {
      textareaEl?.setSelectionRange(textareaEl.value.length, textareaEl.value.length);
    });
  });

  function save() {
    const message = validateCustomText(result.text);
    if (message) {
      error = message;
      textareaEl?.focus();
      return;
    }
    keptDraft = null;
    onSave(result.text);
  }

  function cancel() {
    keptDraft = null;
    onClose();
  }

  /** Esc or a click outside: close, but hold on to anything unsaved. */
  function closeKeepingDraft() {
    keptDraft = draft !== initialText ? draft : null;
    onClose();
  }

  function resetToDefault() {
    draft = DEFAULT_CUSTOM_TEXT;
    error = '';
    restored = false;
    announcement = 'Text reset to the default. Choose Save to use it.';
    textareaEl?.focus();
  }
</script>

<Modal
  {open}
  onClose={closeKeepingDraft}
  labelledby="custom-dialog-title"
  describedby="custom-dialog-help"
  size="lg"
  initialFocus={() => textareaEl}
  {returnFocusTo}
>
  <div class="body">
    <h2 id="custom-dialog-title">Custom text</h2>
    <p id="custom-dialog-help" class="help">
      Type or paste the text you want to practice, up to {CUSTOM_TEXT_MAX.toLocaleString('en-US')} characters.
      Line breaks become spaces, and anything that can't be typed on a US keyboard is tidied up.
    </p>

    <label class="label" for="custom-text-input">Text to type</label>
    <textarea
      id="custom-text-input"
      bind:this={textareaEl}
      bind:value={draft}
      oninput={() => {
        error = '';
        restored = false;
      }}
      maxlength={CUSTOM_TEXT_MAX}
      rows="9"
      spellcheck="false"
      aria-describedby="custom-counter{error ? ' custom-error' : ''}"
      aria-invalid={error ? 'true' : undefined}></textarea>

    <p id="custom-counter" class="counter">
      {counts.characters.toLocaleString('en-US')} / {CUSTOM_TEXT_MAX.toLocaleString('en-US')} characters,
      {counts.words.toLocaleString('en-US')}
      {counts.words === 1 ? 'word' : 'words'}
    </p>

    {#if restored}
      <p class="restored">Restored your unsaved draft from earlier.</p>
    {/if}

    {#if result.notes.length > 0}
      <div class="notes" role="status">
        <p class="notes-title">This text will be adjusted:</p>
        <ul>
          {#each result.notes as note (note)}
            <li>{note}</li>
          {/each}
        </ul>
      </div>
    {/if}

    {#if error}
      <p id="custom-error" class="error" role="alert">{error}</p>
    {/if}

    <p class="visually-hidden" role="status">{announcement}</p>

    <div class="actions">
      <button type="button" class="reset" onclick={resetToDefault}>Reset to default</button>
      <button type="button" onclick={cancel}>Cancel</button>
      <button type="button" class="primary" onclick={save}>Save</button>
    </div>
  </div>
</Modal>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .body {
    overflow-y: auto;
    padding: $space-6;
  }

  h2 {
    margin: 0 0 $space-2;
    font-size: 1.25rem;
  }

  .help {
    margin: 0 0 $space-4;
    color: var(--color-text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .label {
    display: block;
    margin-bottom: $space-1;
    font-weight: 600;
    font-size: 0.9rem;
  }

  textarea {
    display: block;
    width: 100%;
    min-height: 12rem;
    resize: vertical;
    background: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    padding: $space-3;
    font-family: var(--font-mono);
    font-size: 1rem;
    line-height: 1.6;

    &[aria-invalid='true'] {
      border-color: var(--color-error);
    }
  }

  .counter {
    margin: $space-2 0 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }

  .restored {
    margin: $space-2 0 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }

  .notes {
    margin-top: $space-3;
    padding: $space-3;
    border: 1px solid var(--color-extra);
    border-radius: $radius-md;
    font-size: 0.85rem;

    p {
      margin: 0 0 $space-1;
      font-weight: 600;
    }

    ul {
      margin: 0;
      padding-left: $space-4;
    }
  }

  .error {
    margin: $space-3 0 0;
    color: var(--color-error);
    font-weight: 600;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: $space-2;
    margin-top: $space-4;
  }

  button {
    background: var(--color-surface-raised);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: $radius-md;
    padding: $space-2 $space-4;
    font: inherit;
    cursor: pointer;
    @include touch-target;

    &:hover {
      border-color: var(--color-accent);
    }

    &.primary {
      background: var(--color-accent);
      border-color: var(--color-accent);
      color: var(--color-bg);
      font-weight: 600;
    }

    // Pushed to the left so it isn't mistaken for the main action.
    &.reset {
      margin-right: auto;
    }
  }
</style>
