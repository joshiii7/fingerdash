// Single source of truth for which finger types which key. Components read
// from here; nothing else should hard-code a key-to-finger relationship.

export type Hand = 'left' | 'right';
export type FingerName = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
export type FingerId = `${Hand}-${FingerName}`;
export type ShiftKeyId = 'ShiftLeft' | 'ShiftRight';

export const FINGER_NAMES: readonly FingerName[] = ['pinky', 'ring', 'middle', 'index', 'thumb'];

/** Base (unshifted) keys, lowercase, mapped to the finger that presses them. Touch-typing standard. */
export const KEY_FINGERS: Readonly<Record<string, FingerId>> = {
  '`': 'left-pinky',
  '1': 'left-pinky',
  '2': 'left-ring',
  '3': 'left-middle',
  '4': 'left-index',
  '5': 'left-index',
  '6': 'right-index',
  '7': 'right-index',
  '8': 'right-middle',
  '9': 'right-ring',
  '0': 'right-pinky',
  '-': 'right-pinky',
  '=': 'right-pinky',
  q: 'left-pinky',
  w: 'left-ring',
  e: 'left-middle',
  r: 'left-index',
  t: 'left-index',
  y: 'right-index',
  u: 'right-index',
  i: 'right-middle',
  o: 'right-ring',
  p: 'right-pinky',
  '[': 'right-pinky',
  ']': 'right-pinky',
  '\\': 'right-pinky',
  a: 'left-pinky',
  s: 'left-ring',
  d: 'left-middle',
  f: 'left-index',
  g: 'left-index',
  h: 'right-index',
  j: 'right-index',
  k: 'right-middle',
  l: 'right-ring',
  ';': 'right-pinky',
  "'": 'right-pinky',
  z: 'left-pinky',
  x: 'left-ring',
  c: 'left-middle',
  v: 'left-index',
  b: 'left-index',
  n: 'right-index',
  m: 'right-index',
  ',': 'right-middle',
  '.': 'right-ring',
  '/': 'right-pinky',
};

/** Shifted symbol -> the base key it shares (US layout). */
export const SHIFTED_KEYS: Readonly<Record<string, string>> = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
};

/** Either thumb can hit the space bar, so both are highlighted. */
export const SPACE_FINGERS: readonly FingerId[] = ['left-thumb', 'right-thumb'];

/**
 * The Shift key to use, keyed by the hand typing the character: hold Shift
 * with the pinky of the opposite hand.
 */
export const SHIFT_FOR_HAND: Readonly<Record<Hand, { keyId: ShiftKeyId; finger: FingerId }>> = {
  left: { keyId: 'ShiftRight', finger: 'right-pinky' },
  right: { keyId: 'ShiftLeft', finger: 'left-pinky' },
};

export interface KeyGuide {
  /** Identifier of the key to press, matching the on-screen keyboard's key ids. */
  keyId: string;
  /** Finger(s) that can press it. Two entries only for the space bar. */
  fingers: readonly FingerId[];
  /** Present when the character needs Shift (uppercase letters, shifted symbols). */
  shift: { keyId: ShiftKeyId; finger: FingerId } | null;
}

function handOf(finger: FingerId): Hand {
  return finger.startsWith('left') ? 'left' : 'right';
}

/** Returns how to type `char`, or null if it has no known key (e.g. accented letters). */
export function getKeyGuide(char: string): KeyGuide | null {
  if (char.length !== 1) return null;
  if (char === ' ') return { keyId: ' ', fingers: SPACE_FINGERS, shift: null };

  let baseKey = char;
  let needsShift = false;
  if (Object.hasOwn(SHIFTED_KEYS, char)) {
    baseKey = SHIFTED_KEYS[char];
    needsShift = true;
  } else if (char !== char.toLowerCase()) {
    baseKey = char.toLowerCase();
    needsShift = true;
  }

  if (!Object.hasOwn(KEY_FINGERS, baseKey)) return null;
  const finger = KEY_FINGERS[baseKey];
  return {
    keyId: baseKey,
    fingers: [finger],
    shift: needsShift ? SHIFT_FOR_HAND[handOf(finger)] : null,
  };
}

/** Fingers that press the key with this id (used to hint every key under the active finger). */
export function fingersForKeyId(keyId: string): readonly FingerId[] {
  if (keyId === ' ') return SPACE_FINGERS;
  if (keyId === 'ShiftLeft') return ['left-pinky'];
  if (keyId === 'ShiftRight') return ['right-pinky'];
  return Object.hasOwn(KEY_FINGERS, keyId) ? [KEY_FINGERS[keyId]] : [];
}

/** Human-readable finger name, e.g. "left index finger". */
export function fingerLabel(finger: FingerId): string {
  const [hand, name] = finger.split('-');
  return `${hand} ${name}${name === 'thumb' ? '' : ' finger'}`;
}

/** Physical order of the main keys, top row to bottom row, left to right. Used to list a finger's zone. */
const KEY_ORDER = [
  ...['`', ...'1234567890', '-', '='],
  ...'qwertyuiop',
  '[',
  ']',
  '\\',
  ...'asdfghjkl',
  ';',
  "'",
  ...'zxcvbnm',
  ',',
  '.',
  '/',
];

/** Every key a finger is responsible for, in keyboard order. Thumbs have only the space bar. */
export function keysForFinger(finger: FingerId): string[] {
  if (finger.endsWith('thumb')) return [' '];
  return KEY_ORDER.filter((key) => KEY_FINGERS[key] === finger);
}

/** The fingers that press any of `keys`, without repeats, in left-to-right hand order. */
export function fingersForKeys(keys: readonly string[]): FingerId[] {
  const found = new Set<FingerId>();
  for (const key of keys) {
    const guide = getKeyGuide(key);
    if (guide) for (const finger of guide.fingers) found.add(finger);
  }
  return [...found];
}

/** "R, T, F, G, V, B, 4, 5": a zone as text, so the words on screen always match the map. */
export function zoneText(finger: FingerId): string {
  return keysForFinger(finger)
    .map((key) => (key === ' ' ? 'Space' : key.toUpperCase()))
    .join(', ');
}
