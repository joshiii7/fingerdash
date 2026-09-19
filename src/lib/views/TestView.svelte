<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { get } from 'svelte/store';
  import TypingArea from '../components/TypingArea.svelte';
  import ResultsScreen from '../components/ResultsScreen.svelte';
  import ModeSelector from '../components/ModeSelector.svelte';
  import CustomTextDialog from '../components/CustomTextDialog.svelte';
  import PageBanner from '../components/PageBanner.svelte';
  import PageContainer from '../components/PageContainer.svelte';
  import { createTypingSession } from '../engine/useTypingSession';
  import { bindSessionToOverlays } from '../palette/bindOverlays';
  import { customDialogRequest, overlayOpen } from '../stores/palette';
  import {
    challengeFromWords,
    generateCodeChallenge,
    generateQuoteChallenge,
    generateTimeChallenge,
    generateWordChallenge,
    type Challenge,
  } from '../engine/challenge';
  import { generatePunctuationBatch, generatePunctuationWords } from '../engine/punctuation';
  import type { TypingEngine } from '../engine/typingEngine';
  import { settings, type Settings, type TestMode } from '../stores/settings';
  import { results, type BestValue } from '../stores/results';
  import type { TypingStats, WpmSample } from '../engine/stats';
  import { pickQuote } from '../../data/quotes';
  import { codeLanguageLabel, pickSnippet } from '../../data/code';
  import wordList from '../../data/words/en.json';
  import contractionList from '../../data/words/contractions.json';

  const EXTEND_THRESHOLD = 20;
  const EXTEND_BATCH = 40;
  const INITIAL_TIME_WORDS = 200;

  /** Facts about the current run that the results screen shows. */
  interface RunMeta {
    mode: TestMode;
    source: string | null;
    language: string | null;
    characters: number | null;
    skipIndent: boolean | null;
  }
  interface Prepared {
    challenge: Challenge;
    meta: RunMeta;
  }

  const NO_META: RunMeta = {
    mode: 'words',
    source: null,
    language: null,
    characters: null,
    skipIndent: null,
  };
  // Shown briefly while a code snippet file loads; the engine ignores keys for empty text.
  const EMPTY_CHALLENGE: Challenge = { text: '', wordBoundaries: [], kind: 'text' };

  let lastQuoteId: string | null = null;
  let lastSnippetId: string | null = null;

  /** The settings that change what text a run uses. A change to any of them restarts the test. */
  function signatureOf(s: Settings): string {
    return JSON.stringify([
      s.mode,
      s.timeDuration,
      s.wordCount,
      s.punctuation,
      s.numbers,
      s.quoteLength,
      s.customText,
      s.codeLanguage,
      s.skipIndent,
    ]);
  }

  function punctuationOptions() {
    return {
      words: wordList as string[],
      contractions: contractionList as string[],
      numbers: $settings.numbers,
    };
  }

  /** Everything except code, which has to fetch its snippet file first. */
  function prepareLocal(): Prepared | null {
    const s = $settings;
    const meta: RunMeta = { ...NO_META, mode: s.mode };

    switch (s.mode) {
      case 'time':
        return {
          meta,
          challenge: s.punctuation
            ? challengeFromWords(generatePunctuationBatch(INITIAL_TIME_WORDS, punctuationOptions()))
            : generateTimeChallenge(wordList as string[], { numbers: s.numbers }),
        };
      case 'words':
        return {
          meta,
          challenge: s.punctuation
            ? challengeFromWords(generatePunctuationWords(s.wordCount, punctuationOptions()))
            : generateWordChallenge(wordList as string[], s.wordCount, { numbers: s.numbers }),
        };
      case 'quote': {
        const quote = pickQuote(s.quoteLength, lastQuoteId);
        lastQuoteId = quote.id;
        return {
          meta: { ...meta, source: quote.source },
          challenge: generateQuoteChallenge(quote.text),
        };
      }
      case 'custom':
        return {
          meta: { ...meta, characters: s.customText.length },
          challenge: generateQuoteChallenge(s.customText),
        };
      default:
        return null;
    }
  }

  async function prepareCode(): Promise<Prepared> {
    const { codeLanguage, skipIndent } = $settings;
    const snippet = await pickSnippet(codeLanguage, lastSnippetId);
    lastSnippetId = snippet.id;
    return {
      meta: {
        ...NO_META,
        mode: 'code',
        language: codeLanguageLabel(codeLanguage),
        skipIndent,
      },
      challenge: generateCodeChallenge(snippet.code, skipIndent),
    };
  }

  /** The value personal bests are kept under; custom text has none. */
  function bestValue(): BestValue | null {
    const s = get(settings);
    switch (s.mode) {
      case 'time':
        return s.timeDuration;
      case 'words':
        return s.wordCount;
      case 'quote':
        return s.quoteLength;
      case 'code':
        return s.codeLanguage;
      default:
        return null;
    }
  }

  const initial: Prepared = prepareLocal() ?? { challenge: EMPTY_CHALLENGE, meta: NO_META };
  const session = createTypingSession(initial.challenge, { onFinish: handleFinish });
  const snapshot = session.snapshot;

  let runMeta = $state<RunMeta>(initial.meta);
  let loading = $state($settings.mode === 'code');
  let loadError = $state('');
  let announcement = $state('');
  let wpmSamples = $state<WpmSample[]>([]);
  let lastSampledSecond = -1;
  let finalStats = $state<TypingStats | null>(null);
  let isNewBest = $state(false);
  let remainingSeconds = $state($settings.mode === 'time' ? $settings.timeDuration : 0);
  let timeLimitTimer: ReturnType<typeof setInterval> | null = null;
  let runToken = 0;
  let lastSignature = signatureOf($settings);

  let dialogOpen = $state(false);
  let dialogOpener: HTMLElement | null = null;

  function handleFinish(engine: TypingEngine) {
    const stats = engine.getFinalStats();
    finalStats = stats;
    const value = bestValue();
    isNewBest = value === null ? false : results.recordResult(get(settings).mode, value, stats);
    stopTimeLimitTimer();
  }

  function startTimeLimitTimer() {
    stopTimeLimitTimer();
    if ($settings.mode !== 'time') return;
    remainingSeconds = $settings.timeDuration;
    timeLimitTimer = setInterval(() => {
      const snap = session.engine.getSnapshot(performance.now());
      if (snap.status === 'idle') return;
      const elapsedSec = Math.floor(snap.elapsedMs / 1000);
      remainingSeconds = Math.max(0, $settings.timeDuration - elapsedSec);
      if (remainingSeconds <= 0) session.forceFinish();
    }, 200);
  }

  function stopTimeLimitTimer() {
    if (timeLimitTimer !== null) {
      clearInterval(timeLimitTimer);
      timeLimitTimer = null;
    }
  }

  function maybeExtend() {
    if ($settings.mode !== 'time') return;
    const snap = session.engine.getSnapshot();
    if (snap.words.length - snap.wordIndex < EXTEND_THRESHOLD) {
      // Punctuation text is built from whole sentences, so a new batch starts a fresh sentence.
      const more = $settings.punctuation
        ? generatePunctuationBatch(EXTEND_BATCH, punctuationOptions())
        : generateWordChallenge(wordList as string[], EXTEND_BATCH, {
            numbers: $settings.numbers,
          }).text.split(' ');
      session.extendWords(more);
    }
  }

  /** Starts a fresh run with new text for the current settings. */
  async function restart() {
    const token = ++runToken;
    finalStats = null;
    isNewBest = false;
    wpmSamples = [];
    lastSampledSecond = -1;
    loadError = '';
    stopTimeLimitTimer();

    let prepared = prepareLocal();
    if (prepared) {
      loading = false;
    } else {
      loading = true;
      try {
        prepared = await prepareCode();
      } catch {
        if (token === runToken) {
          loading = false;
          loadError = "Couldn't load the code snippets. Check your connection and try again.";
        }
        return;
      }
      // A newer restart started while the snippet file was loading.
      if (token !== runToken) return;
      loading = false;
    }

    runMeta = prepared.meta;
    session.reset(prepared.challenge);
    startTimeLimitTimer();
  }

  /** Any change to what the test types restarts it, including changes made from the command palette. */
  $effect(() => {
    const signature = signatureOf($settings);
    if (signature === lastSignature) return;
    lastSignature = signature;
    untrack(() => void restart());
  });

  /** Called by the mode bar after a change. Re-clicking the current option still gives fresh text. */
  function handleModeChange(message: string) {
    const changed = signatureOf($settings) !== lastSignature;
    announcement = message;
    if (!changed) void restart();
  }

  /** Where focus goes when the dialog closes: the button that opened it, or the Change button. */
  function changeButton(): HTMLElement | null {
    return dialogOpener?.isConnected
      ? dialogOpener
      : document.querySelector<HTMLElement>('[aria-label="Change custom text"]');
  }

  function openDialog(opener: HTMLElement | null) {
    dialogOpener = opener;
    dialogOpen = true;
  }

  function closeDialog() {
    dialogOpen = false;
  }

  function saveCustomText(text: string) {
    settings.patch({ customText: text, mode: 'custom' });
    announcement = 'Custom text saved.';
    // If the text was unchanged there is no settings change to trigger a restart.
    if (signatureOf($settings) === lastSignature) void restart();
    closeDialog();
  }

  // The command palette can ask for the dialog (after switching to custom mode).
  $effect(() => {
    if (!$customDialogRequest) return;
    customDialogRequest.set(false);
    untrack(() => openDialog(null));
  });

  function handleGlobalKeydown(e: KeyboardEvent) {
    // Tab/Esc belong to the open overlay (command palette or dialog).
    if (get(overlayOpen)) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      void restart();
    } else if (e.key === 'Tab') {
      // Keep focus in the typing area. Code mode leaves Tab as a no-op; Esc restarts there.
      e.preventDefault();
      if (get(settings).mode !== 'code') void restart();
    }
  }

  onMount(() => {
    session.start();
    const unbindOverlays = bindSessionToOverlays(session);
    startTimeLimitTimer();
    window.addEventListener('keydown', handleGlobalKeydown, { capture: true });
    // Code mode starts empty; fetch its first snippet now.
    if ($settings.mode === 'code') void restart();

    const unsubscribe = snapshot.subscribe((snap) => {
      if (snap.status !== 'running') return;
      const elapsedSec = Math.floor(snap.elapsedMs / 1000);
      if (elapsedSec > 0 && elapsedSec !== lastSampledSecond) {
        lastSampledSecond = elapsedSec;
        wpmSamples = [
          ...wpmSamples,
          { timeSeconds: elapsedSec, wpm: snap.liveWpm, rawWpm: snap.liveRawWpm },
        ];
      }
      maybeExtend();
    });

    return () => {
      unsubscribe();
      unbindOverlays();
    };
  });

  onDestroy(() => {
    runToken++;
    stopTimeLimitTimer();
    window.removeEventListener('keydown', handleGlobalKeydown, { capture: true });
    session.destroy();
  });

  const details = $derived.by(() => {
    const list: { label: string; value: string }[] = [];
    if (runMeta.mode === 'code') {
      if (runMeta.language) list.push({ label: 'Language', value: runMeta.language });
      list.push({
        label: 'Indentation',
        value: runMeta.skipIndent ? 'skipped for you' : 'typed by you',
      });
    } else if (runMeta.mode === 'quote' && runMeta.source) {
      list.push({ label: 'Source', value: runMeta.source });
    } else if (runMeta.mode === 'custom' && runMeta.characters !== null) {
      list.push({ label: 'Characters', value: runMeta.characters.toLocaleString('en-US') });
    }
    return list;
  });

  const isCode = $derived($settings.mode === 'code');
</script>

<PageBanner
  title="Typing test"
  lead="Pick time, words, quote, custom text, or code, and see your speed, accuracy, and consistency."
/>

<PageContainer>
  <div class="test-view">
    <ModeSelector onAnnounce={handleModeChange} onEditCustom={openDialog} />

    <p class="visually-hidden" role="status" aria-live="polite">{announcement}</p>

    {#if finalStats}
      <ResultsScreen
        stats={finalStats}
        samples={wpmSamples}
        {isNewBest}
        {details}
        restartKey={isCode ? 'Esc' : 'Tab'}
        onRestart={() => void restart()}
      />
    {:else}
      <div class="stats-bar">
        {#if $settings.mode === 'time'}
          <span class="timer">{remainingSeconds}</span>
        {:else}
          <span class="timer">{$snapshot.liveWpm} wpm</span>
        {/if}
      </div>

      {#if loadError}
        <p class="load-error" role="alert">{loadError}</p>
      {:else if loading}
        <p class="loading" role="status">Loading code snippets...</p>
      {:else}
        <div class="typing-wrap">
          <TypingArea
            words={$snapshot.words}
            wordIndex={$snapshot.wordIndex}
            charIndexInWord={$snapshot.charIndexInWord}
            status={$snapshot.status}
            kind={$snapshot.kind}
            showMistakes={$settings.showMistakes}
          />
        </div>
      {/if}

      <p class="hint">
        {#if isCode}
          Enter for a new line, Esc to restart
        {:else}
          Tab or Esc to restart
        {/if}
      </p>
    {/if}
  </div>
</PageContainer>

<CustomTextDialog
  open={dialogOpen}
  initialText={$settings.customText}
  onSave={saveCustomText}
  onClose={closeDialog}
  returnFocusTo={changeButton}
/>

<style lang="scss">
  @use '../../styles/variables' as *;

  .test-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $space-6;
    padding-block: $space-8;
    width: 100%;
  }

  .typing-wrap {
    width: 100%;
  }

  .stats-bar {
    min-height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .timer {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 2rem;
    color: var(--color-accent);
  }

  .hint,
  .loading {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    margin: 0;
  }

  .load-error {
    color: var(--color-error);
    font-weight: 600;
    margin: 0;
  }
</style>
