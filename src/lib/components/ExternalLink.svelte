<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    href: string;
    /** Set for links to the author's own profile, so the link says "this is me" (rel="me"). */
    me?: boolean;
    children: Snippet;
  }

  let { href, me = false, children }: Props = $props();
</script>

<a {href} target="_blank" rel={me ? 'me noopener noreferrer' : 'noopener noreferrer'}>
  {@render children()}<span class="visually-hidden"> (opens in a new tab)</span>
</a>
