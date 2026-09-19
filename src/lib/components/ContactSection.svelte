<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ISSUES_URL } from '../config/site';
  import ExternalLink from './ExternalLink.svelte';
  import EmailLink from './EmailLink.svelte';

  interface Props {
    heading?: string;
    children?: Snippet;
  }

  let { heading = 'Contact', children }: Props = $props();
</script>

<section aria-labelledby="contact-heading">
  <h2 id="contact-heading">{heading}</h2>
  {#if children}{@render children()}{/if}
  <ul>
    <li>
      Preferred: <ExternalLink href={ISSUES_URL}>open an issue on GitHub</ExternalLink>
    </li>
    <li>Or email <EmailLink /></li>
  </ul>
</section>
