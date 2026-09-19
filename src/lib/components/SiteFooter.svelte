<script lang="ts">
  import { FACEBOOK_URL, GITHUB_PROFILE_URL, ISSUES_URL, WHATSAPP_URL } from '../config/site';
  import ExternalLink from './ExternalLink.svelte';
  import EmailLink from './EmailLink.svelte';
  import { hrefFor } from '../router/router';
  import Logo from './Logo.svelte';

  const year = new Date().getFullYear();
</script>

<footer class="site-footer">
  <div class="footer-content">
    <div class="brand-col">
      <Logo size="footer" />
      <p>
        A free touch-typing tutorial and typing test. No accounts, no tracking, everything stays in
        your browser.
      </p>
      <div class="social-links">
        <a
          href={GITHUB_PROFILE_URL}
          target="_blank"
          rel="me noopener noreferrer"
          aria-label="Joshi Angelo Z. Adlawan on GitHub (opens in a new tab)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path
              d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"
            />
          </svg>
        </a>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook (opens in a new tab)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
        </a>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp (opens in a new tab)"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path
              d="M17.47 14.38c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.19 3.01.15.2 2.06 3.14 5 4.4.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.2-.55-.34ZM12.02 2C6.5 2 2.03 6.48 2.03 12c0 1.9.53 3.68 1.44 5.2L2 22l4.94-1.42A9.94 9.94 0 0 0 12.02 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2c-1.68 0-3.24-.47-4.58-1.28l-.33-.2-3.02.87.87-2.94-.21-.34a8.2 8.2 0 0 1-1.29-4.31c0-4.53 3.69-8.2 8.2-8.2 4.53 0 8.2 3.68 8.2 8.2 0 4.53-3.68 8.2-8.2 8.2Z"
            />
          </svg>
        </a>
      </div>
    </div>

    <nav aria-label="Footer">
      <h2>Site</h2>
      <ul>
        <li><a href={hrefFor('home')}>Home</a></li>
        <li><a href={hrefFor('test')}>Test</a></li>
        <li><a href={hrefFor('tutorial')}>Tutorial</a></li>
        <li><a href={hrefFor('about')}>About</a></li>
      </ul>
    </nav>

    <div>
      <h2>Get in touch</h2>
      <ul>
        <li><ExternalLink href={ISSUES_URL}>Report an issue on GitHub</ExternalLink></li>
        <li><EmailLink /></li>
      </ul>
    </div>
  </div>

  <div class="footer-bottom">
    <p>&copy; {year} Fingerdash. Free and open source.</p>
    <nav class="footer-legal" aria-label="Legal">
      <a href={hrefFor('accessibility')}>Accessibility</a>
      <a href={hrefFor('privacy')}>Privacy</a>
    </nav>
  </div>
</footer>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .site-footer {
    padding-top: $space-8;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .footer-content,
  .footer-bottom {
    @include page-width;
  }

  .footer-content {
    display: grid;
    gap: $space-8;
    grid-template-columns: 1fr;

    // Tablet: brand across the top, the two link columns side by side.
    @media (min-width: $breakpoint-sm) {
      grid-template-columns: 1fr 1fr;

      .brand-col {
        grid-column: 1 / -1;
      }
    }

    @media (min-width: $breakpoint-md) {
      grid-template-columns: 1.5fr 1fr 1fr;

      .brand-col {
        grid-column: auto;
      }
    }

    h2 {
      margin: 0 0 $space-4;
      font-size: 1rem;
      color: var(--color-text);
    }

    p {
      margin: 0;
      max-width: 20rem;
      color: var(--color-text-muted);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      margin-bottom: $space-2;
    }
  }

  .brand-col :global(.logo) {
    margin-bottom: $space-3;
  }

  // Icon-only links are circular so they read as buttons; the aria-label
  // supplies the accessible name since there's no visible text.
  .social-links {
    display: flex;
    gap: $space-3;
    margin-top: $space-4;

    a {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      background: var(--color-surface-raised);
      color: var(--color-text-muted);
      transition:
        background-color $transition-fast,
        color $transition-fast;

      &:hover {
        color: var(--color-text);
        background: var(--color-border);
      }
    }

    svg {
      display: block;
      width: 1.1rem;
      height: 1.1rem;
    }
  }

  .footer-bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-2 $space-6;
    margin-top: $space-8;
    padding-block-start: $space-4;
    // Room below the links for the back-to-top button (3.5rem + its offset), so it never
    // covers them when you are at the very bottom of the page.
    padding-block-end: calc(5.5rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border);

    p {
      margin: 0;
      font-size: 0.85rem;
      color: var(--color-text-muted);
    }
  }

  .footer-legal {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2 $space-4;
  }

  // :global so the rules also reach anchors rendered inside child components.
  .site-footer :global(a:not(.logo)) {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    text-decoration: none;

    @media (pointer: coarse) {
      display: inline-block;
      padding-block: $space-2;
    }

    &:hover {
      color: var(--color-text);
      text-decoration: underline;
    }
  }

  .site-footer :global(.social-links a) {
    text-decoration: none;
  }
</style>
