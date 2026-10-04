<script lang="ts">
  import PageLayout from '../components/PageLayout.svelte';
  import ContactSection from '../components/ContactSection.svelte';
  import Modal from '../components/Modal.svelte';
  import { resetAllData } from '../stores/resetAll';

  let confirming = $state(false);
  let status = $state('');
  let clearButton: HTMLButtonElement | undefined = $state();
  let cancelButton: HTMLButtonElement | undefined = $state();

  function askToClear() {
    status = '';
    confirming = true;
  }

  function confirmClear() {
    resetAllData();
    confirming = false;
    status = 'Your Fingerdash data has been cleared from this browser.';
  }

  function cancelClear() {
    confirming = false;
  }
</script>

<PageLayout
  title="Privacy"
  lead="Fingerdash has no accounts, no tracking, and no analytics, and it doesn't send anything you do to any server."
>
  <h2>What stays on your device</h2>
  <p>
    Your theme, test settings, personal bests, and lesson progress (including which lesson
    introductions you've seen) are saved in your browser's
    <code>localStorage</code>, under keys that start with <code>fingerdash:</code>. That data never
    leaves your device, and nobody else can see it. It's only there so the site remembers you
    between visits.
  </p>

  <h2>What we don't do</h2>
  <ul>
    <li>No sign-up, login, or user accounts</li>
    <li>No cookies, analytics, advertising, or tracking scripts</li>
    <li>No requests to third-party services while you use the site</li>
  </ul>
  <p>
    Fingerdash is hosted on Vercel, so Vercel receives the ordinary request data any web host sees
    (such as your IP address) when your browser loads the page. Fingerdash itself doesn't collect or
    add to that.
  </p>

  <h2>Clear your data</h2>
  <p>
    You can wipe everything Fingerdash has stored in this browser at any time. Settings go back to
    their defaults and your bests and lesson progress are removed. This can't be undone.
  </p>

  <button type="button" bind:this={clearButton} onclick={askToClear}>Clear my data</button>
  <p class="status" role="status">{status}</p>

  <ContactSection heading="Questions about privacy">
    <p>If anything here is unclear, ask.</p>
  </ContactSection>
</PageLayout>

<Modal
  open={confirming}
  onClose={cancelClear}
  role="alertdialog"
  size="sm"
  labelledby="clear-dialog-title"
  describedby="clear-dialog-help"
  initialFocus={() => cancelButton}
  returnFocusTo={() => clearButton}
>
  <div class="dialog-body">
    <h2 id="clear-dialog-title">Clear all Fingerdash data?</h2>
    <p id="clear-dialog-help">
      This removes your settings, personal bests, and lesson progress from this browser. It can't be
      undone.
    </p>
    <div class="actions">
      <button type="button" bind:this={cancelButton} onclick={cancelClear}>Cancel</button>
      <button type="button" class="danger" onclick={confirmClear}>Yes, clear my data</button>
    </div>
  </div>
</Modal>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  button {
    background: var(--color-surface);
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

    &.danger {
      border-color: var(--color-error);
      color: var(--color-error);
      font-weight: 600;
    }
  }

  .dialog-body {
    padding: $space-6;

    h2 {
      margin: 0 0 $space-2;
      font-size: 1.15rem;
    }

    p {
      margin: 0 0 $space-4;
      color: var(--color-text-muted);
      line-height: 1.5;
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: $space-2;
  }

  .status {
    min-height: 1.5em;
    color: var(--color-text-muted);
  }
</style>
