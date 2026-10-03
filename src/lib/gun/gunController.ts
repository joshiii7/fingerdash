import { get, writable, type Readable } from 'svelte/store';
import { gunSettings, isSilent, VOLUME_STEP, type GunSettings } from '../stores/gun';
import { createGunAudio, type GunAudio } from './gunAudio';
import { getWeapon, WEAPONS, type WeaponId } from './weapons';

/** What the engine saw for a key: a correct character, or a wrong one. */
export type KeystrokeResult = 'hit' | 'miss';

export type GunAction = 'toggle' | 'mute' | 'volume-up' | 'volume-down' | 'weapon';

export interface GunControllerDeps {
  audio: GunAudio;
  settings: Readable<GunSettings>;
}

/**
 * Decides which sound a key makes. The gun has no ammo and never needs reloading, so every
 * keystroke the typing session reports is a shot. It only listens to the session; it never
 * touches the engine, the timer or the stats, so Gun Mode cannot change accuracy or WPM.
 */
export function createGunController({ audio, settings }: GunControllerDeps) {
  let cfg: GunSettings = get(settings);
  /** Short status text for the HUD's live region (never one per shot). */
  const message = writable('');
  const fireListeners = new Set<(result: KeystrokeResult) => void>();

  /** Called by the typing session after every key the engine accepted as a character. */
  function onKeystroke(result: KeystrokeResult): void {
    if (!cfg.enabled) return;
    const weapon = getWeapon(cfg.weapon);
    audio.play('shot', weapon);
    // A wrong key is a miss: the shot is followed by a bullet skipping off metal.
    if (result === 'miss') audio.play('miss', weapon, 0.03);
    fireListeners.forEach((listener) => listener(result));
  }

  let previous = cfg;
  const unsubscribe = settings.subscribe((next) => {
    cfg = next;
    audio.setVolume(isSilent(next) ? 0 : next.volume / 100);
    if (next.enabled !== previous.enabled) {
      message.set(next.enabled ? `Gun Mode on. ${getWeapon(next.weapon).label}.` : 'Gun Mode off.');
      // Switching on is a user gesture, so it is the moment the browser lets audio start.
      if (next.enabled) audio.unlock();
    } else if (next.enabled && next.weapon !== previous.weapon) {
      message.set(`Weapon: ${getWeapon(next.weapon).label}.`);
    }
    previous = next;
  });

  return {
    message: { subscribe: message.subscribe } as Readable<string>,
    onKeystroke,
    unlock: () => audio.unlock(),
    /** Runs when a shot is fired; the HUD uses it for the muzzle flash and shake. */
    onFire(listener: (result: KeystrokeResult) => void): () => void {
      fireListeners.add(listener);
      return () => fireListeners.delete(listener);
    },
    destroy(): void {
      unsubscribe();
      fireListeners.clear();
    },
  };
}

export type GunController = ReturnType<typeof createGunController>;

/** The one controller the Test page and the command palette share. Audio starts only on a gesture. */
export const gun = createGunController({ audio: createGunAudio(), settings: gunSettings });

/** Runs one Gun Mode command from the palette or a shortcut, and returns text for screen readers. */
export function runGunAction(action: GunAction, weapon?: WeaponId): string {
  gun.unlock();
  if (action === 'toggle') {
    gunSettings.toggle();
    return get(gunSettings).enabled ? 'Gun Mode on.' : 'Gun Mode off.';
  }
  if (action === 'weapon' && weapon) {
    gunSettings.patch({ weapon, enabled: true });
    return `Weapon: ${WEAPONS.find((w) => w.id === weapon)?.label ?? weapon}.`;
  }
  if (action === 'mute') {
    gunSettings.toggleMute();
    return isSilent(get(gunSettings)) ? 'Gun sounds muted.' : 'Gun sounds on.';
  }
  const current = get(gunSettings).volume;
  gunSettings.setVolume(action === 'volume-up' ? current + VOLUME_STEP : current - VOLUME_STEP);
  return `Gun volume ${get(gunSettings).volume} percent.`;
}
