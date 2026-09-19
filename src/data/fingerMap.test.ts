import { describe, it, expect } from 'vitest';
import {
  FINGER_NAMES,
  KEY_FINGERS,
  SHIFTED_KEYS,
  fingerLabel,
  fingersForKeyId,
  getKeyGuide,
  fingersForKeys,
  keysForFinger,
  zoneText,
} from './fingerMap';

describe('KEY_FINGERS', () => {
  it('assigns every letter, digit, and punctuation key on the main rows a finger', () => {
    const keys = [...'abcdefghijklmnopqrstuvwxyz1234567890-=[]\\;,./`', "'"];
    for (const key of keys) expect(KEY_FINGERS[key], key).toBeDefined();
  });

  it('follows the home-row convention', () => {
    expect(KEY_FINGERS.a).toBe('left-pinky');
    expect(KEY_FINGERS.s).toBe('left-ring');
    expect(KEY_FINGERS.d).toBe('left-middle');
    expect(KEY_FINGERS.f).toBe('left-index');
    expect(KEY_FINGERS.j).toBe('right-index');
    expect(KEY_FINGERS.k).toBe('right-middle');
    expect(KEY_FINGERS.l).toBe('right-ring');
    expect(KEY_FINGERS[';']).toBe('right-pinky');
  });

  it('never assigns a thumb to a printable key (thumbs are for space)', () => {
    for (const finger of Object.values(KEY_FINGERS)) expect(finger).not.toMatch(/thumb/);
  });

  it('uses the eight non-thumb fingers', () => {
    expect(new Set(Object.values(KEY_FINGERS)).size).toBe(8);
    expect(FINGER_NAMES).toHaveLength(5);
  });
});

describe('SHIFTED_KEYS', () => {
  it('only points at base keys that have a finger', () => {
    for (const [shifted, base] of Object.entries(SHIFTED_KEYS)) {
      expect(KEY_FINGERS[base], `${shifted} -> ${base}`).toBeDefined();
    }
  });
});

describe('getKeyGuide', () => {
  it('maps a lowercase letter to its finger with no Shift', () => {
    expect(getKeyGuide('f')).toEqual({ keyId: 'f', fingers: ['left-index'], shift: null });
  });

  it('maps an uppercase letter to the same key plus the opposite-hand Shift pinky', () => {
    expect(getKeyGuide('F')).toEqual({
      keyId: 'f',
      fingers: ['left-index'],
      shift: { keyId: 'ShiftRight', finger: 'right-pinky' },
    });
    expect(getKeyGuide('J')?.shift).toEqual({ keyId: 'ShiftLeft', finger: 'left-pinky' });
  });

  it('maps shifted symbols to their base key and the opposite-hand Shift', () => {
    expect(getKeyGuide('!')).toEqual({
      keyId: '1',
      fingers: ['left-pinky'],
      shift: { keyId: 'ShiftRight', finger: 'right-pinky' },
    });
    expect(getKeyGuide('?')).toEqual({
      keyId: '/',
      fingers: ['right-pinky'],
      shift: { keyId: 'ShiftLeft', finger: 'left-pinky' },
    });
    expect(getKeyGuide(':')?.keyId).toBe(';');
    expect(getKeyGuide('"')?.keyId).toBe("'");
  });

  it('never requires Shift for unshifted digits and punctuation', () => {
    for (const key of ['1', '0', ';', ',', '.', '/', "'", '[']) {
      expect(getKeyGuide(key)?.shift, key).toBeNull();
    }
  });

  it('maps space to both thumbs with no Shift', () => {
    expect(getKeyGuide(' ')).toEqual({
      keyId: ' ',
      fingers: ['left-thumb', 'right-thumb'],
      shift: null,
    });
  });

  it('returns null for characters with no key mapping', () => {
    expect(getKeyGuide('é')).toBeNull();
    expect(getKeyGuide('Enter')).toBeNull();
    expect(getKeyGuide('')).toBeNull();
  });
});

describe('fingersForKeyId', () => {
  it('returns the finger for a key, both thumbs for space, and the Shift pinkies', () => {
    expect(fingersForKeyId('s')).toEqual(['left-ring']);
    expect(fingersForKeyId(' ')).toEqual(['left-thumb', 'right-thumb']);
    expect(fingersForKeyId('ShiftLeft')).toEqual(['left-pinky']);
    expect(fingersForKeyId('ShiftRight')).toEqual(['right-pinky']);
  });

  it('returns nothing for keys with no assigned finger', () => {
    expect(fingersForKeyId('Backspace')).toEqual([]);
  });
});

describe('fingerLabel', () => {
  it('reads naturally', () => {
    expect(fingerLabel('left-index')).toBe('left index finger');
    expect(fingerLabel('right-pinky')).toBe('right pinky finger');
    expect(fingerLabel('left-thumb')).toBe('left thumb');
  });
});

describe('finger zones', () => {
  const zone = (finger: Parameters<typeof keysForFinger>[0]) => keysForFinger(finger).join('');

  it('gives each index finger two columns of keys', () => {
    expect(zone('left-index')).toBe('45rtfgvb');
    expect(zone('right-index')).toBe('67yuhjnm');
  });

  it('matches the territories the tutorial teaches for the other fingers', () => {
    expect(zone('left-middle')).toBe('3edc');
    expect(zone('right-middle')).toBe('8ik,');
    expect(zone('left-ring')).toBe('2wsx');
    expect(zone('right-ring')).toBe('9ol.');
    expect(zone('left-pinky').replace('`', '')).toBe('1qaz');
    for (const key of '0p;/') expect(keysForFinger('right-pinky')).toContain(key);
  });

  it('lists a thumb as only the space bar', () => {
    expect(keysForFinger('left-thumb')).toEqual([' ']);
  });

  it('never assigns one key to two fingers', () => {
    const owners = new Map<string, string>();
    for (const finger of new Set(Object.values(KEY_FINGERS))) {
      for (const key of keysForFinger(finger)) {
        expect(owners.has(key), key).toBe(false);
        owners.set(key, finger);
      }
    }
  });

  it('describes a zone as text straight from the map', () => {
    expect(zoneText('right-index')).toBe('6, 7, Y, U, H, J, N, M');
  });

  it('finds the fingers for a set of keys, including Shift and uppercase', () => {
    expect(fingersForKeys(['f', 'j'])).toEqual(['left-index', 'right-index']);
    expect(fingersForKeys(['A'])).toEqual(['left-pinky']);
    expect(fingersForKeys(['?'])).toEqual(['right-pinky']);
  });
});
