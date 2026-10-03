import { describe, it, expect, vi } from 'vitest';
import { get, writable } from 'svelte/store';
import { createGunController } from './gunController';
import { defaultGunSettings, type GunSettings } from '../stores/gun';
import type { GunAudio } from './gunAudio';

function setup(overrides: Partial<GunSettings> = {}) {
  const play = vi.fn();
  const audio: GunAudio = { unlock: vi.fn(), setVolume: vi.fn(), play };
  const settings = writable<GunSettings>({ ...defaultGunSettings, enabled: true, ...overrides });
  const controller = createGunController({ audio, settings });
  const sounds = () => play.mock.calls.map((c) => c[0]);
  return { audio, play, settings, controller, sounds };
}

describe('firing', () => {
  it('plays a shot for each hit', () => {
    const { controller, sounds } = setup();
    controller.onKeystroke('hit');
    controller.onKeystroke('hit');
    expect(sounds()).toEqual(['shot', 'shot']);
  });

  it('plays a ricochet after the shot for a wrong key', () => {
    const { controller, sounds } = setup();
    controller.onKeystroke('miss');
    expect(sounds()).toEqual(['shot', 'miss']);
  });

  it('plays the chosen weapon', () => {
    const { controller, play } = setup({ weapon: 'shotgun' });
    controller.onKeystroke('hit');
    expect(play.mock.calls[0][1].id).toBe('shotgun');
  });

  it('never runs dry: the sounds keep going for thousands of keys', () => {
    const { controller, play } = setup();
    for (let i = 0; i < 5000; i++) controller.onKeystroke('hit');
    expect(play).toHaveBeenCalledTimes(5000);
    expect(new Set(play.mock.calls.map((c) => c[0]))).toEqual(new Set(['shot']));
  });

  it('does nothing at all while Gun Mode is off', () => {
    const { controller, play } = setup({ enabled: false });
    controller.onKeystroke('hit');
    expect(play).not.toHaveBeenCalled();
  });

  it('tells listeners about each shot, for the flash and shake', () => {
    const { controller } = setup();
    const listener = vi.fn();
    const off = controller.onFire(listener);
    controller.onKeystroke('hit');
    controller.onKeystroke('miss');
    off();
    controller.onKeystroke('hit');
    expect(listener.mock.calls).toEqual([['hit'], ['miss']]);
  });
});

describe('settings changes', () => {
  it('unlocks audio when Gun Mode is switched on, and announces it', () => {
    const { audio, settings, controller } = setup({ enabled: false });
    expect(audio.unlock).not.toHaveBeenCalled();
    settings.update((s) => ({ ...s, enabled: true }));
    expect(audio.unlock).toHaveBeenCalled();
    expect(get(controller.message)).toContain('Gun Mode on');
    settings.update((s) => ({ ...s, enabled: false }));
    expect(get(controller.message)).toBe('Gun Mode off.');
  });

  it('announces a weapon change', () => {
    const { settings, controller } = setup();
    settings.update((s) => ({ ...s, weapon: 'pistol' }));
    expect(get(controller.message)).toBe('Weapon: Pistol.');
  });

  it('sends the volume to the audio as a multiple of normal, up to 200%', () => {
    const { audio, settings } = setup({ volume: 40 });
    expect(audio.setVolume).toHaveBeenLastCalledWith(0.4);
    settings.update((s) => ({ ...s, volume: 200 }));
    expect(audio.setVolume).toHaveBeenLastCalledWith(2);
  });

  it('sends 0 to the audio while muted, and the saved volume again after unmuting', () => {
    const { audio, settings } = setup({ volume: 150 });
    settings.update((s) => ({ ...s, muted: true }));
    expect(audio.setVolume).toHaveBeenLastCalledWith(0);
    settings.update((s) => ({ ...s, muted: false }));
    expect(audio.setVolume).toHaveBeenLastCalledWith(1.5);
  });
});
