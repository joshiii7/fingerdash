<script lang="ts">
  import type { RenderWord, EngineStatus } from '../engine/typingEngine';
  import type { ChallengeKind } from '../engine/challenge';

  interface Props {
    /** Words, or (for `kind="text"`) lines. */
    words: RenderWord[];
    wordIndex: number;
    charIndexInWord: number;
    status: EngineStatus;
    /** `text` renders each entry as its own line with indentation preserved (code). */
    kind?: ChallengeKind;
    /** Show the key that was actually typed, small, above each wrong character. */
    showMistakes?: boolean;
  }

  let {
    words,
    wordIndex,
    charIndexInWord,
    status,
    kind = 'words',
    showMistakes = false,
  }: Props = $props();

  /** What to draw for a typed key. Blanks would be invisible, so a space and Enter get symbols. */
  function typedLabel(typed: string): string {
    if (typed === ' ') return '␣';
    if (typed === '\n') return '↵';
    return typed;
  }

  let containerEl: HTMLDivElement | undefined = $state();
  let caretEl: HTMLDivElement | undefined = $state();
  const charRefs: (HTMLSpanElement | null)[][] = [];

  function registerCharRef(el: HTMLSpanElement, [wIdx, cIdx]: [number, number]) {
    (charRefs[wIdx] ??= [])[cIdx] = el;
    return {
      destroy() {
        if (charRefs[wIdx]) charRefs[wIdx][cIdx] = null;
      },
    };
  }

  function positionCaret() {
    if (!containerEl || !caretEl) return;
    const wordEls = charRefs[wordIndex];
    let rect: DOMRect | null = null;
    let atEnd = false;

    if (wordEls?.[charIndexInWord]) {
      rect = wordEls[charIndexInWord]!.getBoundingClientRect();
    } else if (wordEls && wordEls.length > 0) {
      const last = wordEls[wordEls.length - 1];
      if (last) {
        rect = last.getBoundingClientRect();
        atEnd = true;
      }
    }

    if (!rect) return;
    const containerRect = containerEl.getBoundingClientRect();
    const left = (atEnd ? rect.right : rect.left) - containerRect.left + containerEl.scrollLeft;
    const top = rect.top - containerRect.top + containerEl.scrollTop;

    caretEl.style.transform = `translate(${left}px, ${top}px)`;
    caretEl.style.height = `${rect.height}px`;

    if (kind === 'words') {
      // The area shows four lines; scroll so the line being typed stays the second one.
      const lineHeight = parseFloat(getComputedStyle(containerEl).lineHeight);
      const first = charRefs[0]?.[0];
      if (first && lineHeight > 0) {
        const firstTop =
          first.getBoundingClientRect().top - containerRect.top + containerEl.scrollTop;
        const lineIndex = Math.round((top - firstTop) / lineHeight);
        containerEl.scrollTop = Math.max(0, lineIndex - 1) * lineHeight;
      }
    }

    // Long code lines scroll sideways on small screens; keep the caret in view.
    if (kind === 'text') {
      const margin = 24;
      const visibleLeft = containerEl.scrollLeft;
      const visibleRight = visibleLeft + containerEl.clientWidth;
      if (left < visibleLeft + margin) {
        containerEl.scrollLeft = Math.max(0, left - margin);
      } else if (left > visibleRight - margin) {
        containerEl.scrollLeft = left - containerEl.clientWidth + margin;
      }
    }
  }

  $effect(() => {
    void words;
    void wordIndex;
    void charIndexInWord;
    // Run after DOM update so char refs reflect the latest render.
    requestAnimationFrame(positionCaret);
  });
</script>

<div
  class="typing-area"
  class:text={kind === 'text'}
  class:finished={status === 'finished'}
  class:with-mistakes={showMistakes}
  bind:this={containerEl}
>
  <div class="caret" class:hidden={status === 'finished'} bind:this={caretEl}></div>
  {#if kind === 'text'}
    {#each words as line, wIdx (wIdx)}
      <div class="line">
        {#each line.chars as c, cIdx (cIdx)}<span
            class="char {c.state}"
            class:newline={c.char === '\n'}
            use:registerCharRef={[wIdx, cIdx]}
            >{#if showMistakes && c.typed !== undefined}<span class="mistake" aria-hidden="true"
                >{typedLabel(c.typed)}</span
              >{/if}{c.char === '\n' ? '↵' : c.char}</span
          >{/each}
      </div>
    {/each}
  {:else}
    {#each words as word, wIdx (wIdx)}
      <span class="word" class:current={wIdx === wordIndex}
        >{#each word.chars as c, cIdx (cIdx)}<span
            class="char {c.state}"
            use:registerCharRef={[wIdx, cIdx]}
            >{#if showMistakes && c.typed !== undefined}<span class="mistake" aria-hidden="true"
                >{typedLabel(c.typed)}</span
              >{/if}{c.char}</span
          >{/each}</span
      ><!-- eslint-disable-line svelte/no-useless-mustaches -->{' '}
    {/each}
  {/if}
</div>

<style lang="scss">
  @use '../../styles/variables' as *;

  .typing-area {
    position: relative;
    font-family: var(--font-mono);
    // 1.25rem on phones up to 2rem on desktop.
    font-size: clamp(1.25rem, 1rem + 1.5vw, 2rem);
    // Spacing for the mistake labels: with them on, lines are taller and there is room above
    // the first line. Both are reserved up front, so a label appearing never moves anything.
    --lh: 1.7;
    --label-room: 0em;
    line-height: var(--lh);
    padding-top: var(--label-room);
    // Four lines, in this element's own em so it tracks the fluid font size.
    max-height: calc(var(--lh) * 4em + var(--label-room));

    &.with-mistakes {
      --lh: 2.2;
      --label-room: 0.6em;
    }
    overflow: hidden;
    color: var(--color-text-muted);
    word-spacing: 0.25em;
    // Default letter-spacing keeps the caret aligned with the characters, and
    // ligatures stay off so sequences like -> never merge into one glyph.
    letter-spacing: normal;
    font-variant-ligatures: none;
    font-feature-settings:
      'liga' 0,
      'calt' 0;
    user-select: none;

    // Code: every line is visible, indentation is preserved, and long lines
    // scroll sideways instead of wrapping.
    &.text {
      max-height: none;
      overflow-x: auto;
      overflow-y: hidden;
      font-size: clamp(1rem, 0.85rem + 1vw, 1.5rem);
      --lh: 1.6;
      word-spacing: normal;
      padding-bottom: $space-2;

      &.with-mistakes {
        --lh: 2.1;
        --label-room: 0.6em;
      }
    }
  }

  .word {
    display: inline;
  }

  .line {
    white-space: pre;
    // A blank line still needs height for the newline marker's row.
    min-height: calc(var(--lh) * 1em);
  }

  .char {
    // The anchor for the mistake label; it changes nothing about the character's own width.
    position: relative;

    &.correct {
      color: var(--color-text);
    }
    &.incorrect {
      color: var(--color-error);
      text-decoration: underline;
      text-decoration-color: var(--color-error);
    }
    &.extra {
      color: var(--color-extra);
      text-decoration: underline;
      text-decoration-color: var(--color-extra);
    }
    &.pending {
      color: var(--color-text-muted);
    }
    // Indentation the app jumped past for the user: shown, but clearly not typed.
    &.skipped {
      color: var(--color-text-muted);
      opacity: 0.4;
    }
    // The end-of-line marker: a hint to press Enter, quieter than real characters.
    &.newline {
      opacity: 0.55;
    }
    &.newline.incorrect {
      opacity: 1;
    }
  }

  // The key that was actually typed, small, centered above the wrong character. Drawn outside
  // the text flow, so it never changes a character's width or where the line wraps.
  .mistake {
    position: absolute;
    left: 50%;
    bottom: 100%;
    transform: translateX(-50%);
    font-size: 0.55em;
    line-height: 1;
    white-space: pre;
    color: var(--color-error);
    text-decoration: none;
    pointer-events: none;
    user-select: none;
  }

  .caret {
    position: absolute;
    top: 0;
    left: 0;
    width: max(2px, 0.075em);
    background: var(--color-caret);
    border-radius: 1px;
    transition:
      transform 100ms ease,
      height 100ms ease;
    animation: blink 1s step-end infinite;

    &.hidden {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      animation: none;
      transition: none;
    }
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
</style>
