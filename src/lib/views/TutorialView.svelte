<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import TypingArea from '../components/TypingArea.svelte';
  import Keyboard from '../components/Keyboard.svelte';
  import HandsGuide from '../components/HandsGuide.svelte';
  import PageContainer from '../components/PageContainer.svelte';
  import ResultsScreen from '../components/ResultsScreen.svelte';
  import LessonIntro from '../components/LessonIntro.svelte';
  import Modal from '../components/Modal.svelte';
  import { get } from 'svelte/store';
  import { createTypingSession } from '../engine/useTypingSession';
  import { activeSession, lessonWhyRequest, overlayOpen } from '../stores/palette';
  import { introsSeen } from '../stores/introsSeen';
  import { generateWordChallenge } from '../engine/challenge';
  import type { TypingEngine, EngineSnapshot } from '../engine/typingEngine';
  import { lessons, type Lesson } from '../../data/lessons';
  import { tutorialProgress } from '../stores/tutorialProgress';
  import { showHands } from '../stores/showHands';
  import { getKeyGuide } from '../../data/fingerMap';
  import type { TypingStats, WpmSample } from '../engine/stats';

  function buildLessonChallenge(lesson: Lesson) {
    // Reading lessons have no drill, but the session still needs some text to hold.
    return lesson.words.length > 0
      ? generateWordChallenge(lesson.words, lesson.wordCount)
      : generateWordChallenge(['ok'], 1);
  }

  /** A drill's intro opens by itself the first time; a reading lesson is its intro, so it always does. */
  function shouldShowIntro(lesson: Lesson): boolean {
    return lesson.kind === 'reading' || !introsSeen.has(lesson.id);
  }

  // Pick up where you left off: the first lesson you haven't passed yet.
  const initialLesson =
    lessons.find((l) => !get(tutorialProgress).lessons[l.id]?.completed) ?? lessons[0];
  let selectedLesson = $state<Lesson>(initialLesson);
  let introOpen = $state(shouldShowIntro(initialLesson));
  let whyOpen = $state(false);
  let whyButton: HTMLButtonElement | undefined = $state();
  let lessonHeading: HTMLHeadingElement | undefined = $state();
  let lessonPanel: HTMLDivElement | undefined = $state();
  let lessonList: HTMLElement | undefined = $state();
  const selectedPosition = $derived(lessons.findIndex((l) => l.id === selectedLesson.id) + 1);
  let finalStats = $state<TypingStats | null>(null);
  let passed = $state(false);
  let wpmSamples = $state<WpmSample[]>([]);
  let lastSampledSecond = -1;

  // Sidebar section headings are one word each (nav-labels).
  const GROUP_LABELS: Record<string, string> = {
    basics: 'Basics',
    'home-row': 'Home',
    'top-row': 'Top',
    'bottom-row': 'Bottom',
    numbers: 'Numbers',
    punctuation: 'Punctuation',
    practice: 'Practice',
  };

  const lessonGroups = lessons.reduce<{ group: string; label: string; items: Lesson[] }[]>(
    (groups, lesson) => {
      const existing = groups.find((g) => g.group === lesson.group);
      if (existing) existing.items.push(lesson);
      else
        groups.push({
          group: lesson.group,
          label: GROUP_LABELS[lesson.group] ?? lesson.group,
          items: [lesson],
        });
      return groups;
    },
    [],
  );

  function handleFinish(engine: TypingEngine) {
    const stats = engine.getFinalStats();
    finalStats = stats;
    passed = stats.accuracy >= selectedLesson.minAccuracy && stats.wpm >= selectedLesson.minWpm;
    tutorialProgress.recordAttempt(selectedLesson.id, stats.wpm, stats.accuracy, passed);
  }

  const session = createTypingSession(buildLessonChallenge(initialLesson), {
    onFinish: handleFinish,
  });
  const snapshot = session.snapshot;

  function startLesson(lesson: Lesson) {
    selectedLesson = lesson;
    introOpen = shouldShowIntro(lesson);
    whyOpen = false;
    finalStats = null;
    passed = false;
    wpmSamples = [];
    lastSampledSecond = -1;
    session.reset(buildLessonChallenge(lesson));
    // A long intro is scrolled; bring the top of the new lesson back into view.
    void tick().then(() => {
      if (lessonPanel && lessonPanel.getBoundingClientRect().top < 0) {
        lessonPanel.scrollIntoView({ block: 'start' });
      }
    });
  }

  function retryLesson() {
    startLesson(selectedLesson);
  }

  function nextLesson() {
    const idx = lessons.findIndex((l) => l.id === selectedLesson.id);
    const next = lessons[idx + 1];
    if (next) startLesson(next);
  }

  /** Leaves the intro for the drill, and remembers it was seen. */
  async function beginPractice() {
    introsSeen.mark(selectedLesson.id);
    introOpen = false;
    await tick();
    lessonHeading?.focus({ preventScroll: true });
  }

  /** A reading lesson has no drill: finishing it counts as done, then on to the next. */
  function finishReading() {
    introsSeen.mark(selectedLesson.id);
    tutorialProgress.recordAttempt(selectedLesson.id, 0, 0, true);
    nextLesson();
  }

  // The lesson list scrolls on its own; keep the lesson you are on in view inside it.
  $effect(() => {
    void selectedLesson.id;
    void tick().then(() => {
      const list = lessonList;
      const item = list?.querySelector<HTMLElement>('.lesson-item.active');
      if (!list || !item) return;
      const pad = 8;
      if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop - pad;
      else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
        list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight + pad;
      }
      if (item.offsetLeft < list.scrollLeft) list.scrollLeft = item.offsetLeft - pad;
      else if (item.offsetLeft + item.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollLeft = item.offsetLeft + item.offsetWidth - list.clientWidth + pad;
      }
    });
  });

  // The session must stay paused while an intro or a dialog is open, so typing there
  // never reaches the drill and the clock doesn't run.
  let overlayIsOpen = false;
  function syncPause() {
    if (overlayIsOpen || introOpen) session.pause();
    else session.resume();
  }
  $effect(() => {
    void introOpen;
    untrack(syncPause);
  });

  // The command palette can ask for the explanation (Tab restarts a lesson, so it is the
  // keyboard route to it).
  $effect(() => {
    if (!$lessonWhyRequest) return;
    lessonWhyRequest.set(false);
    untrack(() => {
      if (!introOpen) whyOpen = true;
    });
  });

  function handleGlobalKeydown(e: KeyboardEvent) {
    // Tab/Esc belong to the open overlay (command palette or dialog), and to the intro,
    // where Tab has to move between its buttons.
    if (get(overlayOpen) || introOpen) return;
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      retryLesson();
    }
  }

  function nextKeyFor(snap: EngineSnapshot): string | null {
    const word = snap.words[snap.wordIndex];
    if (!word) return null;
    if (snap.charIndexInWord < word.chars.length) {
      return word.chars[snap.charIndexInWord].char;
    }
    return snap.wordIndex < snap.words.length - 1 ? ' ' : null;
  }

  /**
   * Shorten lesson titles for sidebar nav (1-3 words).
   * Removes prefixes like "Finger Zones:" and keeps the descriptive part.
   */
  function getSidebarLabel(title: string): string {
    // Remove common prefixes to shorten titles
    const cleanedTitle = title
      .replace(/^(?:Home Row|Top Row|Bottom Row|Numbers|Punctuation|Finger Zones):\s*/i, '')
      .trim();
    return cleanedTitle || title;
  }

  onMount(() => {
    session.start();
    activeSession.set(session);
    const unbindOverlays = overlayOpen.subscribe((open) => {
      overlayIsOpen = open;
      syncPause();
    });
    window.addEventListener('keydown', handleGlobalKeydown, { capture: true });

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
    });

    return () => {
      unsubscribe();
      unbindOverlays();
      activeSession.update((current) => (current === session ? null : current));
    };
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown, { capture: true });
    session.destroy();
  });
</script>

<PageContainer>
  <h1 class="visually-hidden">Tutorial</h1>
  <div class="tutorial-view">
    <aside class="lesson-list" aria-label="Lessons" bind:this={lessonList}>
      {#each lessonGroups as { group, label, items } (group)}
        <div class="lesson-group">
          <h3 class="group-heading">{label}</h3>
          {#each items as lesson (lesson.id)}
            {@const progress = $tutorialProgress.lessons[lesson.id]}
            <button
              type="button"
              class="lesson-item"
              class:active={lesson.id === selectedLesson.id}
              class:completed={progress?.completed}
              aria-current={lesson.id === selectedLesson.id ? 'true' : undefined}
              onclick={() => startLesson(lesson)}
            >
              <span class="title nav-label" title={lesson.title}
                >{getSidebarLabel(lesson.title)}</span
              >
              {#if progress && lesson.kind !== 'reading'}
                <span class="score"
                  >{Math.round(progress.bestWpm)} wpm · {Math.round(progress.bestAccuracy)}%</span
                >
              {/if}
              {#if progress?.completed}
                <span class="check" aria-label="Completed">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      {/each}
    </aside>

    <div class="lesson-main" bind:this={lessonPanel}>
      {#if introOpen}
        <LessonIntro
          lesson={selectedLesson}
          position={selectedPosition}
          total={lessons.length}
          titleId="lesson-intro-title"
          onStart={selectedLesson.kind === 'reading' ? finishReading : beginPractice}
          onSkip={beginPractice}
        />
      {:else}
        <div class="lesson-head">
          <h2 tabindex="-1" bind:this={lessonHeading}>{selectedLesson.title}</h2>
          <button
            type="button"
            class="why-btn"
            bind:this={whyButton}
            onclick={() => (whyOpen = true)}>Why?</button
          >
        </div>
        <p class="thresholds">
          Pass: {selectedLesson.minWpm}+ wpm at {selectedLesson.minAccuracy}%+ accuracy
        </p>

        {#if finalStats}
          <div class="lesson-result">
            <p class:pass={passed} class:fail={!passed} class="verdict">
              {passed ? 'Lesson passed!' : 'Not quite — try again.'}
            </p>
            <ResultsScreen
              stats={finalStats}
              samples={wpmSamples}
              isNewBest={false}
              onRestart={retryLesson}
            />
            {#if passed}
              <button class="next-btn" onclick={nextLesson}>Next lesson</button>
            {/if}
          </div>
        {:else}
          {@const snap = $snapshot}
          <TypingArea
            words={snap.words}
            wordIndex={snap.wordIndex}
            charIndexInWord={snap.charIndexInWord}
            status={snap.status}
          />
          {@const nextKey = nextKeyFor(snap)}
          {@const guide = nextKey ? getKeyGuide(nextKey) : null}
          <div class="guide">
            <label class="hands-toggle">
              <input
                type="checkbox"
                checked={$showHands}
                onchange={(e) => showHands.set(e.currentTarget.checked)}
              />
              Show hands
            </label>
            <Keyboard {nextKey} {guide} zone={guide?.fingers ?? []} />
            {#if $showHands}
              <HandsGuide
                active={guide?.fingers ?? []}
                zone={guide?.fingers ?? []}
                shift={guide?.shift?.finger ?? null}
              />
            {/if}
          </div>
          <p class="hint">Tab or Esc to restart this lesson</p>
        {/if}
      {/if}
    </div>
  </div>
</PageContainer>

<Modal
  open={whyOpen}
  onClose={() => (whyOpen = false)}
  size="lg"
  labelledby="lesson-why-title"
  initialFocus={() => document.getElementById('lesson-why-title')}
  returnFocusTo={() => whyButton}
>
  <div class="why-dialog">
    <LessonIntro
      lesson={selectedLesson}
      position={selectedPosition}
      total={lessons.length}
      mode="dialog"
      titleId="lesson-why-title"
      onClose={() => (whyOpen = false)}
    />
  </div>
</Modal>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .tutorial-view {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: $space-6;
    padding-block: $space-6;
    width: 100%;

    @include respond-below($breakpoint-md) {
      grid-template-columns: 1fr;
    }
  }

  // Wide screens: a column that stays beside the lesson and scrolls on its own, so all the
  // lessons are reachable without scrolling the whole page. Sections are always open, split
  // by thin dividers, like the lesson sidebar on Syntaxia.
  .lesson-list {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 5.5rem;
    align-self: start;
    max-height: calc(100vh - 7rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-right: $space-1;
    scrollbar-width: thin;

    // Tablet/phone: the lesson itself stays near the top, so the list becomes a short scroller.
    @include respond-below($breakpoint-md) {
      position: static;
      max-height: 16rem;
    }
  }

  .lesson-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-block: 2px 4px;

    & + & {
      margin-top: 10px;
      padding-top: 18px;
      border-top: 1px solid var(--color-border);
    }
  }

  .group-heading {
    margin: 0 0 $space-1;
    padding-inline: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .lesson-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: 7px 6px 7px $space-3;
    border: none;
    border-radius: $radius-sm;
    background: transparent;
    color: var(--color-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    @include touch-target;

    &:hover {
      background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    }

    // The current lesson: accent text, a bar on the left edge and a soft tint.
    &.active {
      background: color-mix(in srgb, var(--color-accent) 14%, transparent);

      &::before {
        content: '';
        position: absolute;
        inset: 6px auto 6px 0;
        width: 3px;
        border-radius: 2px;
        background: var(--color-accent);
      }

      .title {
        font-weight: 700;
        color: var(--color-accent);
      }
    }

    .title {
      flex: 1;
      min-width: 0;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .score {
      font-size: 0.7rem;
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      color: var(--color-text-muted);
    }

    .check {
      color: var(--color-correct);
    }
  }

  .lesson-main {
    scroll-margin-top: 5.5rem;
    @include card;
    padding: $space-6;
    display: flex;
    flex-direction: column;
    gap: $space-4;
  }

  .lesson-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $space-3;

    h2 {
      margin: 0;

      &:focus {
        outline: none;
      }
    }
  }

  .why-btn {
    background: transparent;
    color: var(--color-accent);
    border: 1px solid var(--color-accent);
    border-radius: $radius-md;
    padding: $space-1 $space-4;
    font: inherit;
    cursor: pointer;
    @include touch-target;

    &:hover {
      background: color-mix(in srgb, var(--color-accent) 14%, transparent);
    }
  }

  // The "Why?" popup scrolls inside itself, so a long explanation never cuts off.
  .why-dialog {
    overflow-y: auto;
    min-height: 0;
    padding: $space-6;
  }

  .thresholds {
    color: var(--color-text-muted);
    font-size: 0.85rem;
    margin: 0;
  }

  .verdict {
    text-align: center;
    font-weight: 600;

    &.pass {
      color: var(--color-correct);
    }
    &.fail {
      color: var(--color-error);
    }
  }

  .next-btn {
    align-self: center;
    background: var(--color-accent);
    color: var(--color-bg);
    border: none;
    border-radius: $radius-md;
    padding: $space-2 $space-4;
    cursor: pointer;
  }

  // Spans the lesson card edge to edge, keeping only a small gutter.
  .guide {
    display: flex;
    flex-direction: column;
    gap: $space-4;
    margin-inline: -$space-6;
    padding-inline: $space-2;
  }

  .hands-toggle {
    align-self: flex-end;
    margin-inline-end: $space-4;
    display: flex;
    align-items: center;
    gap: $space-2;
    font-size: 0.85rem;
    color: var(--color-text-muted);
    cursor: pointer;
  }

  .hint {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
  }
</style>
