/**
 * Picks a random item, avoiding the one picked last time so the same quote or
 * snippet never appears twice in a row. With only one candidate it has to repeat.
 */
export function pickAvoidingRepeat<T extends { id: string }>(
  items: readonly T[],
  previousId: string | null,
  rng: () => number = Math.random,
): T {
  if (items.length === 0) throw new Error('pickAvoidingRepeat: nothing to pick from');
  const pool = items.length > 1 ? items.filter((item) => item.id !== previousId) : items;
  return pool[Math.floor(rng() * pool.length)];
}
