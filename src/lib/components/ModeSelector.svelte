<script lang="ts">
  import {
    settings,
    TEST_MODES,
    TIME_OPTIONS,
    WORD_OPTIONS,
    type TestMode,
  } from '../stores/settings';
  import { CODE_LANGUAGES, codeLanguageLabel, type CodeLanguage } from '../../data/code';
  import { QUOTE_LENGTH_OPTIONS, type QuoteLengthFilter } from '../../data/quotes';

  interface Props {
    /** Called after any change with a message for screen readers; the test view restarts the run. */
    onAnnounce: (announcement: string) => void;
    /** Open the custom-text dialog. */
    onEditCustom: (opener: HTMLElement) => void;
  }

  let { onAnnounce, onEditCustom }: Props = $props();

  const PREVIEW_LENGTH = 44;
  const customPreview = $derived(
    $settings.customText.length > PREVIEW_LENGTH
      ? `${$settings.customText.slice(0, PREVIEW_LENGTH).trimEnd()}...`
      : $settings.customText,
  );

  function setMode(mode: TestMode) {
    settings.patch({ mode });
    onAnnounce(`Mode: ${mode}.`);
  }

  function setTime(timeDuration: (typeof TIME_OPTIONS)[number]) {
    settings.patch({ timeDuration });
    onAnnounce(`Time: ${timeDuration} seconds.`);
  }

  function setWordCount(wordCount: (typeof WORD_OPTIONS)[number]) {
    settings.patch({ wordCount });
    onAnnounce(`Words: ${wordCount}.`);
  }

  function toggle(key: 'punctuation' | 'numbers') {
    const next = !$settings[key];
    settings.patch({ [key]: next });
    onAnnounce(`${key} ${next ? 'on' : 'off'}.`);
  }

  function setQuoteLength(quoteLength: QuoteLengthFilter) {
    settings.patch({ quoteLength });
    onAnnounce(`Quote length: ${quoteLength}.`);
  }

  function setLanguage(codeLanguage: CodeLanguage) {
    settings.patch({ codeLanguage });
    onAnnounce(`Code language: ${codeLanguageLabel(codeLanguage)}.`);
  }

  function setShowMistakes(showMistakes: boolean) {
    settings.patch({ showMistakes });
    onAnnounce(`Typed mistakes ${showMistakes ? 'shown' : 'hidden'}.`);
  }

  function setSkipIndent(skipIndent: boolean) {
    settings.patch({ skipIndent });
    onAnnounce(`Indentation is ${skipIndent ? 'skipped for you' : 'typed by you'}.`);
  }
</script>

<div class="mode-selector" role="group" aria-label="Test settings">
  <div class="cluster" role="group" aria-label="Mode">
    {#each TEST_MODES as m (m.id)}
      <button
        type="button"
        class:active={$settings.mode === m.id}
        aria-pressed={$settings.mode === m.id}
        onclick={() => setMode(m.id)}
      >
        {m.label}
      </button>
    {/each}
  </div>

  <span class="divider" aria-hidden="true"></span>

  {#if $settings.mode === 'time' || $settings.mode === 'words'}
    <div class="cluster" role="group" aria-label="Text options">
      <button
        type="button"
        class="toggle"
        class:active={$settings.punctuation}
        aria-pressed={$settings.punctuation}
        onclick={() => toggle('punctuation')}
      >
        punctuation
      </button>
      <button
        type="button"
        class="toggle"
        class:active={$settings.numbers}
        aria-pressed={$settings.numbers}
        onclick={() => toggle('numbers')}
      >
        numbers
      </button>
    </div>

    <span class="divider" aria-hidden="true"></span>

    {#if $settings.mode === 'time'}
      <div class="cluster" role="group" aria-label="Time limit">
        {#each TIME_OPTIONS as t (t)}
          <button
            type="button"
            class:active={$settings.timeDuration === t}
            aria-pressed={$settings.timeDuration === t}
            aria-label="{t} seconds"
            onclick={() => setTime(t)}
          >
            {t}
          </button>
        {/each}
      </div>
    {:else}
      <div class="cluster" role="group" aria-label="Word count">
        {#each WORD_OPTIONS as w (w)}
          <button
            type="button"
            class:active={$settings.wordCount === w}
            aria-pressed={$settings.wordCount === w}
            aria-label="{w} words"
            onclick={() => setWordCount(w)}
          >
            {w}
          </button>
        {/each}
      </div>
    {/if}
  {:else if $settings.mode === 'quote'}
    <label class="field">
      <span>Length</span>
      <select
        value={$settings.quoteLength}
        onchange={(e) => setQuoteLength(e.currentTarget.value as QuoteLengthFilter)}
      >
        {#each QUOTE_LENGTH_OPTIONS as option (option.id)}
          <option value={option.id}>{option.label}</option>
        {/each}
      </select>
    </label>
  {:else if $settings.mode === 'custom'}
    <span class="custom-preview" title={$settings.customText}>{customPreview}</span>
    <button
      type="button"
      class="change"
      data-custom-change
      aria-label="Change custom text"
      onclick={(e) => onEditCustom(e.currentTarget)}
    >
      Change
    </button>
  {:else if $settings.mode === 'code'}
    <label class="field">
      <span>Language</span>
      <select
        value={$settings.codeLanguage}
        onchange={(e) => setLanguage(e.currentTarget.value as CodeLanguage)}
      >
        {#each CODE_LANGUAGES as language (language.id)}
          <option value={language.id}>{language.label}</option>
        {/each}
      </select>
    </label>
    <label class="check">
      <input
        type="checkbox"
        checked={$settings.skipIndent}
        onchange={(e) => setSkipIndent(e.currentTarget.checked)}
      />
      <span>Skip indentation</span>
    </label>
  {/if}

  <label class="check">
    <input
      type="checkbox"
      checked={$settings.showMistakes}
      onchange={(e) => setShowMistakes(e.currentTarget.checked)}
    />
    <span>Show typed mistakes</span>
  </label>
</div>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .mode-selector {
    @include card;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-3;
    font-size: 0.85rem;
  }

  .cluster {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;
  }

  .divider {
    width: 1px;
    height: 1.25rem;
    background: var(--color-border);
    margin: 0 $space-1;
  }

  button {
    background: transparent;
    border: none;
    color: var(--color-text-muted);
    padding: $space-1 $space-2;
    border-radius: $radius-sm;
    cursor: pointer;
    @include touch-target;
    transition: color $transition-fast;

    &:hover {
      color: var(--color-text);
    }

    &.active {
      color: var(--color-accent);
      // Underline as well as color, so the selected option isn't shown by color alone.
      text-decoration: underline;
      text-underline-offset: 0.3em;
    }
  }

  .toggle.active {
    color: var(--color-correct);
  }

  .field,
  .check {
    display: inline-flex;
    align-items: center;
    gap: $space-2;
    color: var(--color-text-muted);
  }

  .check {
    cursor: pointer;
    @include touch-target;

    input {
      accent-color: var(--color-accent);
    }
  }

  select {
    background: var(--color-bg);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    padding: $space-1 $space-2;
    font: inherit;
    @include touch-target;
  }

  .custom-preview {
    max-width: 22rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
    color: var(--color-text-muted);
  }

  .change {
    border: 1px solid var(--color-border);
    color: var(--color-text);

    &:hover {
      border-color: var(--color-accent);
    }
  }
</style>
