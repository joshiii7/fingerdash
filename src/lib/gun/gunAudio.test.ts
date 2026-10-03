import { describe, it, expect } from 'vitest';
import { createGunAudio, MAX_LEVEL } from './gunAudio';
import { getWeapon } from './weapons';

describe('createGunAudio', () => {
  it('stays silent and never throws where there is no Web Audio (typing must not break)', () => {
    const audio = createGunAudio();
    const weapon = getWeapon('rakrak');
    expect(() => {
      audio.unlock();
      audio.setVolume(0.5);
      audio.setVolume(MAX_LEVEL);
      audio.setVolume(99);
      for (const kind of ['shot', 'miss'] as const) audio.play(kind, weapon);
    }).not.toThrow();
  });

  it('lets the volume go up to 200%', () => {
    expect(MAX_LEVEL).toBe(2);
  });
});
