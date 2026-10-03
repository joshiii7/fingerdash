<script lang="ts">
  import {
    AUTHOR_NAME,
    CODEPEN_URL,
    CODEWARS_URL,
    FACEBOOK_URL,
    GITHUB_PROFILE_URL,
    WHATSAPP_URL,
  } from '../config/site';

  interface SocialLink {
    name: string;
    href: string;
    /** The author's own profiles say so (rel="me"); a chat or Facebook link does not. */
    me: boolean;
    /** Accessible name; profile links also say whose profile it is. */
    label: string;
    /** `fill` icons are solid brand marks; `stroke` icons are drawn as outlines. */
    style: 'fill' | 'stroke';
  }

  const LINKS: SocialLink[] = [
    {
      name: 'GitHub',
      href: GITHUB_PROFILE_URL,
      me: true,
      label: `${AUTHOR_NAME} on GitHub`,
      style: 'fill',
    },
    {
      name: 'Codewars',
      href: CODEWARS_URL,
      me: true,
      label: `${AUTHOR_NAME} on Codewars`,
      style: 'stroke',
    },
    {
      name: 'CodePen',
      href: CODEPEN_URL,
      me: true,
      label: `${AUTHOR_NAME} on CodePen`,
      style: 'stroke',
    },
    { name: 'Facebook', href: FACEBOOK_URL, me: false, label: 'Facebook', style: 'fill' },
    { name: 'WhatsApp', href: WHATSAPP_URL, me: false, label: 'WhatsApp', style: 'fill' },
  ];
</script>

<!-- Icon-only links: the aria-label is the accessible name, the title is the hover tooltip. -->
<ul class="social-links">
  {#each LINKS as link (link.name)}
    <li>
      <a
        class="social-link"
        href={link.href}
        target="_blank"
        rel={link.me ? 'me noopener noreferrer' : 'noopener noreferrer'}
        aria-label={`${link.label} (opens in a new tab)`}
        title={link.name}
      >
        {#if link.style === 'fill'}
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            {#if link.name === 'GitHub'}
              <path
                d="M12 .5C5.73.5.5 5.73.5 12c0 5.09 3.29 9.4 7.86 10.93.57.1.78-.25.78-.55 0-.27-.01-1.16-.02-2.11-3.2.7-3.88-1.36-3.88-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.66.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"
              />
            {:else if link.name === 'Facebook'}
              <path
                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
              />
            {:else}
              <path
                d="M17.47 14.38c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.57-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.43 0 1.43 1.05 2.82 1.19 3.01.15.2 2.06 3.14 5 4.4.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.98-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.2-.55-.34ZM12.02 2C6.5 2 2.03 6.48 2.03 12c0 1.9.53 3.68 1.44 5.2L2 22l4.94-1.42A9.94 9.94 0 0 0 12.02 22c5.52 0 10-4.48 10-10s-4.48-10-10-10Zm0 18.2c-1.68 0-3.24-.47-4.58-1.28l-.33-.2-3.02.87.87-2.94-.21-.34a8.2 8.2 0 0 1-1.29-4.31c0-4.53 3.69-8.2 8.2-8.2 4.53 0 8.2 3.68 8.2 8.2 0 4.53-3.68 8.2-8.2 8.2Z"
              />
            {/if}
          </svg>
        {:else}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.8"
            aria-hidden="true"
            focusable="false"
          >
            {#if link.name === 'Codewars'}
              <line x1="4" y1="4" x2="18" y2="18" />
              <line x1="20" y1="4" x2="6" y2="18" />
              <line x1="12" y1="16" x2="16" y2="12" />
              <line x1="12" y1="12" x2="8" y2="16" />
              <line x1="18" y1="18" x2="20.5" y2="20.5" />
              <line x1="6" y1="18" x2="3.5" y2="20.5" />
            {:else}
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
              <polyline points="2 15.5 12 8.5 22 15.5" />
              <line x1="12" y1="2" x2="12" y2="8.5" />
            {/if}
          </svg>
        {/if}
      </a>
    </li>
  {/each}
</ul>

<style lang="scss">
  @use '../../styles/variables' as *;

  .social-links {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    margin: $space-3 0 0;
    padding: 0;
    list-style: none;
  }

  .social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
    text-decoration: none;
    transition:
      background-color $transition-fast,
      color $transition-fast;

    &:hover {
      color: var(--color-text);
      background: var(--color-border);
    }

    // Bigger tap target on touch screens.
    @media (pointer: coarse) {
      width: 2.75rem;
      height: 2.75rem;
    }

    svg {
      display: block;
      width: 1.125rem;
      height: 1.125rem;
    }
  }
</style>
