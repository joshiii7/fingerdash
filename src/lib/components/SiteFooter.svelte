<script lang="ts">
  import { AUTHOR_NAME, ISSUES_URL, PORTFOLIO_URL } from '../config/site';
  import ExternalLink from './ExternalLink.svelte';
  import EmailLink from './EmailLink.svelte';
  import { hrefFor } from '../router/router';
  import Logo from './Logo.svelte';
  import SocialLinks from './SocialLinks.svelte';

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
      <SocialLinks />
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
    <div class="footer-meta">
      <p>
        Built by
        {#if PORTFOLIO_URL}
          <ExternalLink href={PORTFOLIO_URL} me>{AUTHOR_NAME}</ExternalLink>.
        {:else}
          {AUTHOR_NAME}.
        {/if}
      </p>
      <nav class="footer-legal" aria-label="Legal">
        <a href={hrefFor('accessibility')}>Accessibility</a>
        <a href={hrefFor('privacy')}>Privacy</a>
      </nav>
    </div>
  </div>
</footer>

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .site-footer {
    padding-top: 2.5rem;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
  }

  .footer-content,
  .footer-bottom {
    @include page-width;
  }

  .footer-content {
    display: grid;
    gap: $space-6 1.75rem;
    grid-template-columns: 1fr;

    // Tablet: brand across the top, the two link columns side by side.
    @media (min-width: $breakpoint-sm) {
      grid-template-columns: 1fr 1fr;

      .brand-col {
        grid-column: 1 / -1;
      }
    }

    // Desktop: a wider brand column, then one column per link group.
    @media (min-width: $breakpoint-md) {
      grid-template-columns: 1.3fr 1fr 1fr;

      .brand-col {
        grid-column: auto;
      }
    }

    h2 {
      margin: 0 0 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-text);
    }

    p {
      margin: 0;
      max-width: 20rem;
      color: var(--color-text-muted);
      font-size: 0.8125rem;
      line-height: 1.6;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      margin-bottom: 0.375rem;
    }
  }

  .brand-col :global(.logo) {
    margin-bottom: $space-1;
  }

  .footer-bottom {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: $space-2 $space-4;
    margin-top: $space-6;
    padding-block: $space-4 calc(#{$space-4} + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid var(--color-border);

    p {
      margin: 0;
      font-size: 0.8125rem;
      color: var(--color-text-muted);
    }
  }

  .footer-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2 $space-4;

    // The back-to-top button is pinned to the window corner (3.5rem wide, 1.5rem in). On windows
    // narrower than the page container's margins, keep the links clear of it rather than
    // adding empty space under the footer.
    @media (max-width: 90rem) {
      padding-inline-end: 4.5rem;
    }
  }

  .footer-legal {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2 $space-4;
  }

  // :global so the rules also reach anchors rendered inside child components.
  .site-footer :global(a:not(.logo):not(.social-link)) {
    color: var(--color-text-muted);
    font-size: 0.8125rem;
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
</style>
