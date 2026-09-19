<script lang="ts">
  import { onMount } from 'svelte';
  import { buildContactEmail } from '../config/site';

  // Built after mount so the address is never in the served HTML.
  let address = $state('');

  onMount(() => {
    address = buildContactEmail();
  });
</script>

{#if address}
  <a href={`mailto:${address}`}>{address}</a>
{/if}
