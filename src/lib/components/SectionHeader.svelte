<script lang="ts">
  interface Props {
    /** Small uppercase label above the heading. */
    eyebrow: string;
    title: string;
    /** Heading id, referenced by the section's aria-labelledby. */
    id: string;
    align?: 'start' | 'center';
    /** Lighter text for use on the dark band. */
    onDark?: boolean;
  }

  let { eyebrow, title, id, align = 'start', onDark = false }: Props = $props();
</script>

<header class="section-header" class:center={align === 'center'} class:on-dark={onDark}>
  <p class="eyebrow">{eyebrow}</p>
  <h2 {id}>{title}</h2>
</header>

<style lang="scss">
  @use '../../styles/variables' as *;

  .section-header {
    margin-bottom: $space-8;

    &.center {
      text-align: center;
    }
  }

  .eyebrow {
    margin: 0 0 $space-2;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--color-accent);
  }

  h2 {
    margin: 0;
    font-size: clamp(1.75rem, 3.5vw, 2.5rem);
    line-height: 1.15;
  }

  // On the always-dark strip, use the light variants of the accent and text.
  .on-dark {
    .eyebrow {
      color: #58a6ff;
    }

    h2 {
      color: #ffffff;
    }
  }
</style>
