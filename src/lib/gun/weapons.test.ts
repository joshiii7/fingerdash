import { describe, it, expect } from 'vitest';
import { DEFAULT_WEAPON, getWeapon, WEAPONS, WEAPON_IDS } from './weapons';

describe('weapons', () => {
  it('makes the Rak-Rak rifle the default and lists it first', () => {
    expect(DEFAULT_WEAPON).toBe('rakrak');
    expect(WEAPONS[0].id).toBe('rakrak');
  });

  it('has a rifle, SMG, shotgun, pistol and revolver', () => {
    expect(WEAPON_IDS).toEqual(['rakrak', 'smg', 'shotgun', 'pistol', 'revolver']);
  });

  it('has no ammo or reload: a weapon is only a sound', () => {
    for (const w of WEAPONS) {
      expect(w, w.id).not.toHaveProperty('rounds');
      expect(w, w.id).not.toHaveProperty('reloadMs');
    }
  });

  it('gives every weapon its own id and a loud sound', () => {
    expect(new Set(WEAPON_IDS).size).toBe(WEAPONS.length);
    for (const w of WEAPONS) {
      expect(w.shot.noiseMs, w.id).toBeGreaterThan(0);
      expect(w.shot.gain, w.id).toBeGreaterThanOrEqual(0.7);
      expect(w.shot.gain, w.id).toBeLessThanOrEqual(1);
    }
  });

  it('makes the shotgun the longest, heaviest boom', () => {
    const shotgun = getWeapon('shotgun');
    for (const other of WEAPONS.filter((w) => w.id !== 'shotgun')) {
      expect(shotgun.shot.thumpMs, other.id).toBeGreaterThanOrEqual(other.shot.thumpMs);
    }
  });

  it('keeps the rattling weapons short, so fast typing blends into one sound', () => {
    expect(getWeapon('rakrak').shot.noiseMs).toBeLessThanOrEqual(60);
    expect(getWeapon('smg').shot.noiseMs).toBeLessThanOrEqual(60);
  });
});
