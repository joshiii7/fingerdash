<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<!-- Constrains page content to the shared 80rem width. Full-width elements such as
     the page banner sit outside it. -->
<div class="page-container">
  {@render children()}
</div>

<style lang="scss">
  @use '../../styles/mixins' as *;

  .page-container {
    @include page-width;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
</style>
