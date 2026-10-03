import { writable } from 'svelte/store';
import { readStorage, writeStorage } from '../utils/localStorage';
import { DEFAULT_WEAPON, WEAPON_IDS, type WeaponId } from '../gun/weapons';

export interface GunSettings {
  /** Gun Mode is off by default; the normal test is unchanged while it is off. */
  enabled: boolean;
  weapon: WeaponId;
  /** Slider position in percent, 0 to 200. Kept while muted, so unmuting restores it. */
  volume: number;
  muted: boolean;
  /** The last volume above 0, so unmuting a slider dragged to 0 has somewhere to go back to. */
  lastVolume: number;
}

const STORAGE_KEY = 'fingerdash:gun';

/** Gun Mode goes past 100%: at 200% it is twice as loud as at 100%. */
export const MAX_VOLUME = 200;
export const VOLUME_STEP = 10;

export const defaultGunSettings: GunSettings = {
  enabled: false,
  weapon: DEFAULT_WEAPON,
  volume: MAX_VOLUME,
  muted: false,
  lastVolume: MAX_VOLUME,
};

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function volume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.round(Math.min(MAX_VOLUME, Math.max(0, value)))
    : fallback;
}

/** Fills in anything missing and replaces any value that is no longer valid. */
export function sanitizeGunSettings(raw: unknown): GunSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = defaultGunSettings;
  const level = volume(r.volume, d.volume);
  const last = volume(r.lastVolume, d.lastVolume);
  return {
    enabled: bool(r.enabled, d.enabled),
    weapon: WEAPON_IDS.includes(r.weapon as WeaponId) ? (r.weapon as WeaponId) : d.weapon,
    volume: level,
    muted: bool(r.muted, d.muted),
    lastVolume: last > 0 ? last : level > 0 ? level : d.lastVolume,
  };
}

/** True when nothing would be heard: muted, or the slider is at 0. */
export function isSilent(s: GunSettings): boolean {
  return s.muted || s.volume === 0;
}

function createGunStore() {
  const initial = sanitizeGunSettings(readStorage<unknown>(STORAGE_KEY, {}));
  const { subscribe, update, set } = writable<GunSettings>(initial);

  subscribe((value) => writeStorage(STORAGE_KEY, value));

  return {
    subscribe,
    patch(partial: Partial<GunSettings>) {
      update((s) => ({ ...s, ...partial }));
    },
    toggle() {
      update((s) => ({ ...s, enabled: !s.enabled }));
    },
    /** Moving the slider unmutes, since the person clearly wants to hear it. */
    setVolume(next: number) {
      update((s) => {
        const level = volume(next, s.volume);
        return {
          ...s,
          volume: level,
          muted: level > 0 ? false : s.muted,
          lastVolume: level > 0 ? level : s.lastVolume,
        };
      });
    },
    /** Mute or unmute, remembering the previous volume. */
    toggleMute() {
      update((s) => {
        if (!isSilent(s)) return { ...s, muted: true };
        // A slider dragged to 0 has nothing to restore, so go back to the last audible level.
        return { ...s, muted: false, volume: s.volume === 0 ? s.lastVolume : s.volume };
      });
    },
    reset() {
      set(defaultGunSettings);
    },
  };
}

export const gunSettings = createGunStore();
