import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { defaultGunSettings, gunSettings, isSilent, MAX_VOLUME, sanitizeGunSettings } from './gun';

beforeEach(() => gunSettings.reset());

describe('sanitizeGunSettings', () => {
  it('is off by default, with the Rak-Rak rifle at 200% volume', () => {
    expect(sanitizeGunSettings(undefined)).toEqual(defaultGunSettings);
    expect(defaultGunSettings.enabled).toBe(false);
    expect(defaultGunSettings.weapon).toBe('rakrak');
    expect(defaultGunSettings.volume).toBe(200);
    expect(MAX_VOLUME).toBe(200);
  });

  it('replaces junk and clamps the volume to 0-200', () => {
    expect(sanitizeGunSettings({ weapon: 'bazooka' }).weapon).toBe('rakrak');
    expect(sanitizeGunSettings({ volume: 400 }).volume).toBe(200);
    expect(sanitizeGunSettings({ volume: 150 }).volume).toBe(150);
    expect(sanitizeGunSettings({ volume: -5 }).volume).toBe(0);
    expect(sanitizeGunSettings({ volume: 'loud' }).volume).toBe(defaultGunSettings.volume);
    expect(sanitizeGunSettings({ enabled: 'yes' }).enabled).toBe(false);
  });

  it('keeps valid saved values', () => {
    const saved = { enabled: true, weapon: 'revolver', volume: 25, muted: true };
    expect(sanitizeGunSettings(saved)).toMatchObject(saved);
  });
});

describe('gunSettings', () => {
  it('toggles Gun Mode', () => {
    gunSettings.toggle();
    expect(get(gunSettings).enabled).toBe(true);
    gunSettings.toggle();
    expect(get(gunSettings).enabled).toBe(false);
  });

  it('remembers the previous volume across mute and unmute', () => {
    gunSettings.setVolume(35);
    gunSettings.toggleMute();
    expect(isSilent(get(gunSettings))).toBe(true);
    expect(get(gunSettings).volume).toBe(35);
    gunSettings.toggleMute();
    expect(isSilent(get(gunSettings))).toBe(false);
    expect(get(gunSettings).volume).toBe(35);
  });

  it('unmutes when the slider moves', () => {
    gunSettings.toggleMute();
    gunSettings.setVolume(80);
    expect(get(gunSettings).muted).toBe(false);
  });

  it('unmutes a slider dragged to 0 back to the last audible level', () => {
    gunSettings.setVolume(45);
    gunSettings.setVolume(0);
    expect(isSilent(get(gunSettings))).toBe(true);
    gunSettings.toggleMute();
    expect(get(gunSettings).volume).toBe(45);
    expect(isSilent(get(gunSettings))).toBe(false);
  });

  it('can be turned up past 100%', () => {
    gunSettings.setVolume(180);
    expect(get(gunSettings).volume).toBe(180);
    gunSettings.setVolume(999);
    expect(get(gunSettings).volume).toBe(200);
  });

  it('drops the old auto-reload setting', () => {
    expect(sanitizeGunSettings({ autoReload: true })).not.toHaveProperty('autoReload');
  });

  it('saves to localStorage', () => {
    gunSettings.setVolume(70);
    expect(JSON.parse(localStorage.getItem('fingerdash:gun') ?? '{}').volume).toBe(70);
  });
});
