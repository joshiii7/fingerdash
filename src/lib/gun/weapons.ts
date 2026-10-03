export type WeaponId = 'rakrak' | 'smg' | 'shotgun' | 'pistol' | 'revolver';

/** How a weapon's shot is synthesised. All the sounds are generated, so there are no audio files. */
export interface ShotSound {
  /** Centre of the noise crack, in Hz. Higher is thinner and sharper. */
  noiseHz: number;
  noiseQ: number;
  noiseMs: number;
  /** Start pitch of the low thump, in Hz. It falls to 40% of this. */
  thumpHz: number;
  thumpMs: number;
  /** Loudness of the whole shot, 0 to 1, before the volume slider. */
  gain: number;
}

/** A weapon is only a sound: Gun Mode has no ammo, so the gun never runs dry. */
export interface Weapon {
  id: WeaponId;
  label: string;
  shot: ShotSound;
}

/**
 * The first weapon is the default. Shots are loud, short and tight so fast typing blends into one
 * continuous rattle instead of a string of separate bangs.
 */
export const WEAPONS: readonly Weapon[] = [
  {
    id: 'rakrak',
    label: 'Rak-Rak',
    shot: { noiseHz: 2400, noiseQ: 0.9, noiseMs: 45, thumpHz: 150, thumpMs: 40, gain: 0.85 },
  },
  {
    id: 'smg',
    label: 'SMG',
    shot: { noiseHz: 3200, noiseQ: 1, noiseMs: 32, thumpHz: 190, thumpMs: 30, gain: 0.75 },
  },
  {
    id: 'shotgun',
    label: 'Shotgun',
    shot: { noiseHz: 900, noiseQ: 0.5, noiseMs: 190, thumpHz: 75, thumpMs: 240, gain: 1 },
  },
  {
    id: 'pistol',
    label: 'Pistol',
    shot: { noiseHz: 1800, noiseQ: 0.7, noiseMs: 70, thumpHz: 120, thumpMs: 90, gain: 0.9 },
  },
  {
    id: 'revolver',
    label: 'Revolver',
    shot: { noiseHz: 1200, noiseQ: 0.6, noiseMs: 130, thumpHz: 90, thumpMs: 160, gain: 1 },
  },
];

export const DEFAULT_WEAPON: WeaponId = 'rakrak';

export const WEAPON_IDS = WEAPONS.map((w) => w.id);

export function getWeapon(id: WeaponId): Weapon {
  return WEAPONS.find((w) => w.id === id) ?? WEAPONS[0];
}
