<script lang="ts">
  import { fingerLabel, fingersForKeyId, type FingerId, type KeyGuide } from '../../data/fingerMap';

  interface KeyDef {
    key: string;
    /** Defaults to the lowercase key; set where labels repeat (the two Shift keys). */
    id?: string;
    width?: number;
  }

  const ROWS: KeyDef[][] = [
    [
      { key: '`' },
      { key: '1' },
      { key: '2' },
      { key: '3' },
      { key: '4' },
      { key: '5' },
      { key: '6' },
      { key: '7' },
      { key: '8' },
      { key: '9' },
      { key: '0' },
      { key: '-' },
      { key: '=' },
      { key: 'Backspace', width: 2 },
    ],
    [
      { key: 'Tab', width: 1.5 },
      { key: 'q' },
      { key: 'w' },
      { key: 'e' },
      { key: 'r' },
      { key: 't' },
      { key: 'y' },
      { key: 'u' },
      { key: 'i' },
      { key: 'o' },
      { key: 'p' },
      { key: '[' },
      { key: ']' },
      { key: '\\', width: 1.5 },
    ],
    [
      { key: 'CapsLock', width: 1.75 },
      { key: 'a' },
      { key: 's' },
      { key: 'd' },
      { key: 'f' },
      { key: 'g' },
      { key: 'h' },
      { key: 'j' },
      { key: 'k' },
      { key: 'l' },
      { key: ';' },
      { key: "'" },
      { key: 'Enter', width: 2.25 },
    ],
    [
      { key: 'Shift', id: 'ShiftLeft', width: 2.25 },
      { key: 'z' },
      { key: 'x' },
      { key: 'c' },
      { key: 'v' },
      { key: 'b' },
      { key: 'n' },
      { key: 'm' },
      { key: ',' },
      { key: '.' },
      { key: '/' },
      { key: 'Shift', id: 'ShiftRight', width: 2.75 },
    ],
    [{ key: ' ', width: 6.25 }],
  ];

  interface Props {
    nextKey?: string | null;
    /** How to type `nextKey`, from getKeyGuide(); null when there is no next key or it has no mapping. */
    guide?: KeyGuide | null;
    /** Fingers whose whole zone is tinted (used by the lesson introductions). */
    zone?: readonly FingerId[];
    /** Key ids to show strongly, when there is no single next key (also used by the introductions). */
    emphasize?: readonly string[];
    /** Hide the "Next key" line, for an introduction that isn't a drill. */
    showLabel?: boolean;
  }

  let {
    nextKey = null,
    guide = null,
    zone = [],
    emphasize = [],
    showLabel = true,
  }: Props = $props();

  function keyId(def: KeyDef): string {
    return def.id ?? (def.key.length === 1 ? def.key.toLowerCase() : def.key);
  }

  function isActive(def: KeyDef): boolean {
    const id = keyId(def);
    if (emphasize.includes(id)) return true;
    return guide !== null && (id === guide.keyId || id === guide.shift?.keyId);
  }

  function inZone(def: KeyDef): boolean {
    return fingersForKeyId(keyId(def)).some((f) => zone.includes(f));
  }

  const instruction = $derived.by(() => {
    if (!guide) return '';
    const press =
      guide.fingers.length > 1 ? 'use either thumb' : `use your ${fingerLabel(guide.fingers[0])}`;
    return guide.shift
      ? `${press} and hold Shift with your ${fingerLabel(guide.shift.finger)}`
      : press;
  });

  function isFingerHint(def: KeyDef): boolean {
    if (guide === null) return false;
    return fingersForKeyId(keyId(def)).some((f) => guide.fingers.includes(f));
  }
</script>

<div class="keyboard" aria-hidden="true">
  {#each ROWS as row, rIdx (rIdx)}
    <div class="row">
      {#each row as keyDef, kIdx (kIdx)}
        <div
          class="key"
          class:active={isActive(keyDef)}
          class:finger-hint={isFingerHint(keyDef)}
          class:zone={inZone(keyDef)}
          style:flex={keyDef.width ?? 1}
        >
          {keyDef.key === ' ' ? '' : keyDef.key}
        </div>
      {/each}
    </div>
  {/each}
</div>

{#if nextKey && showLabel}
  <p class="finger-label">
    Next key: <strong>{nextKey === ' ' ? 'space' : nextKey}</strong>{instruction
      ? `, ${instruction}`
      : ''}
  </p>
{/if}

<style lang="scss">
  @use '../../styles/variables' as *;
  @use '../../styles/mixins' as *;

  .keyboard {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  .row {
    display: flex;
    gap: 4px;
  }

  .key {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: $radius-sm;
    min-width: 0;
    // Long labels ("backspace") clip instead of pushing the page wider on small screens.
    overflow: hidden;
    height: clamp(2.25rem, 4.5vw, 3.75rem);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono);
    font-size: clamp(0.5rem, 1.2vw, 1rem);
    color: var(--color-text-muted);
    text-transform: lowercase;
    transition:
      background-color $transition-fast,
      color $transition-fast,
      border-color $transition-fast;

    &.finger-hint {
      border-color: var(--color-accent);
    }

    // A finger's whole zone: a soft tint plus an accent edge, so the group reads as one.
    &.zone {
      background: color-mix(in srgb, var(--color-accent) 20%, var(--color-surface));
      border-color: color-mix(in srgb, var(--color-accent) 65%, var(--color-border));
      color: var(--color-text);
    }

    // Solid fill plus a heavy outline and glow, so the key doesn't rely on color alone.
    &.active {
      background: var(--color-accent);
      color: var(--color-bg);
      border-color: var(--color-text);
      outline: 2px solid var(--color-text);
      outline-offset: 1px;
      box-shadow: 0 0 8px var(--color-accent);
      font-weight: 700;
    }
  }

  .finger-label {
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    margin-top: $space-2;

    strong {
      color: var(--color-text);
    }
  }
</style>
