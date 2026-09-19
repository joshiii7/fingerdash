<script lang="ts">
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    items: { icon: IconName; label: string }[];
    /** Accessible name for the list, for example "Fingerdash is". */
    label: string;
  }

  let { items, label }: Props = $props();
</script>

<!-- Small pills for a page hero. They sit on the always-dark banner, so their colors are fixed light. -->
<ul class="badges" aria-label={label}>
  {#each items as item (item.label)}
    <li><Icon name={item.icon} /><span>{item.label}</span></li>
  {/each}
</ul>

<style lang="scss">
  @use '../../styles/variables' as *;

  .badges {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: $space-2 $space-3;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: inline-flex;
      align-items: center;
      gap: $space-2;
      padding: $space-1 $space-4;
      border: 1px solid rgb(255 255 255 / 0.28);
      border-radius: 999px;
      background: rgb(255 255 255 / 0.12);
      color: #ffffff;
      font-size: 0.9rem;
      font-weight: 600;
      text-shadow: 0 1px 3px rgb(0 0 0 / 0.5);
    }
  }
</style>
