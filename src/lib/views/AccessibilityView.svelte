<script lang="ts">
  import PageLayout from '../components/PageLayout.svelte';
  import ContactSection from '../components/ContactSection.svelte';
</script>

<PageLayout title="Accessibility">
  <p>
    Fingerdash is meant to be usable without a mouse and to stay readable in every theme. This page
    covers what's in place today and where it still falls short.
  </p>

  <h2>What's supported</h2>
  <ul>
    <li>
      <strong>Keyboard-first use.</strong> Pages, links, and forms work from the keyboard. During a
      test or lesson, <kbd>Tab</kbd> restarts the run, so the mode bar is reached through the
      command palette instead (see below). In code mode <kbd>Tab</kbd> does nothing and
      <kbd>Esc</kbd> restarts.
    </li>
    <li>
      <strong>Visible focus.</strong> Focused links, buttons, and inputs get a clear outline in the accent
      color of the current theme.
    </li>
    <li>
      <strong>Contrast.</strong> Body text has a contrast ratio above 10:1 in all four themes, and the
      GitHub Dark and GitHub Light themes keep secondary text above 4.5:1 on their backgrounds.
    </li>
    <li>
      <strong>Reduced motion.</strong> If your system asks for reduced motion, animations and transitions
      are turned off, including the caret blink, the finger highlight pulse, and the typing animation
      on the home page.
    </li>
    <li>
      <strong>Not color alone.</strong> The next key and finger in a lesson are marked with an outline
      and a text description as well as color.
    </li>
    <li>
      <strong>Command palette.</strong> Press <kbd>Ctrl</kbd>+<kbd>K</kbd> (<kbd>Cmd</kbd>+<kbd
        >K</kbd
      >
      on macOS), or <kbd>/</kbd> when you aren't in the middle of typing, to switch themes, jump to
      a page, or change any test setting: the mode, the code language, the quote length, the time or
      word count, and whether indentation is skipped. It works with screen readers and closes with
      <kbd>Esc</kbd>.
    </li>
    <li>
      <strong>Custom text dialog.</strong> The dialog for your own practice text is labelled, keeps
      focus inside while it's open, closes with <kbd>Esc</kbd>, returns focus to the button that
      opened it, and announces what it adjusts and any error.
    </li>
    <li>
      <strong>Skip link.</strong> A "Skip to Main Content" link is the first thing you reach with the
      Tab key on every page.
    </li>
  </ul>

  <h2>Known limitations</h2>
  <ul>
    <li>
      Code mode shows code that is meant to be read on screen. Screen readers can't follow along as
      you type it, and lines that don't fit a narrow screen scroll sideways.
    </li>
    <li>
      The typing area isn't a text field. Screen readers won't announce characters as you type, so
      the test and the lessons are not a good experience with a screen reader today.
    </li>
    <li>
      A physical keyboard is required. Phones and tablets that only have an on-screen keyboard can't
      run a test.
    </li>
    <li>
      The on-screen keyboard and hands diagram are visual aids and are hidden from screen readers.
      The line under the keyboard ("Next key: f, use your left index finger") carries the same
      information as text.
    </li>
    <li>
      The results chart has a short text label but no data table, so the per-second numbers aren't
      available to a screen reader.
    </li>
    <li>
      A few color pairs are below the 4.5:1 guideline for small text: secondary text on raised
      surfaces in the Nord theme, and text on the accent color in the Solarized theme. Switching to
      GitHub Dark or GitHub Light avoids both.
    </li>
  </ul>

  <ContactSection heading="Reporting accessibility problems">
    <p>
      If something here doesn't work for you, please say so. Include the page, your browser, and any
      assistive technology you use if you can.
    </p>
  </ContactSection>
</PageLayout>
