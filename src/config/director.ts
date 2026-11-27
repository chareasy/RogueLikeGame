import type { EnemyKind } from './enemies';

export interface SpawnWave {
  fromMs: number;
  toMs: number;
  intervalMs: number;
  softCap: number;
  weights: Partial<Record<EnemyKind, number>>;
  eliteEveryMs?: number;
  /** Mid-run formation pack interval (flank surround). */
  formationEveryMs?: number;
}

export const SPAWN_TIMELINE: SpawnWave[] = [
  {
    // Soft contact damage stays; restore on-screen density for "mowing" feel.
    fromMs: 0,
    toMs: 30_000,
    intervalMs: 520,
    softCap: 34,
    weights: { chaser: 3, swarm: 2 },
    // Outer ring packs — pressure without stacking on the player.
    formationEveryMs: 14_000,
  },
  {
    fromMs: 30_000,
    toMs: 75_000,
    intervalMs: 420,
    softCap: 55,
    weights: { chaser: 3, swarm: 2, speeder: 1 },
    formationEveryMs: 12_000,
  },
  {
    // ~1.25–2.5 min: start leaking flankers so mid-game isn't one soup.
    fromMs: 75_000,
    toMs: 150_000,
    intervalMs: 360,
    softCap: 90,
    weights: { chaser: 3, speeder: 2, swarm: 2, flanker: 2 },
    eliteEveryMs: 55_000,
    formationEveryMs: 11_000,
  },
  {
    // 2.5–5 min: surround / summon / shield elites.
    fromMs: 150_000,
    toMs: 300_000,
    intervalMs: 320,
    softCap: 130,
    weights: {
      chaser: 2,
      speeder: 1,
      shooter: 2,
      tank: 1,
      charger: 2,
      swarm: 2,
      flanker: 3,
      summoner: 2,
      shield_elite: 1,
    },
    eliteEveryMs: 42_000,
    formationEveryMs: 18_000,
  },
  {
    fromMs: 300_000,
    toMs: 420_000,
    intervalMs: 280,
    softCap: 170,
    weights: {
      chaser: 1,
      speeder: 1,
      shooter: 2,
      tank: 2,
      charger: 2,
      swarm: 2,
      flanker: 3,
      summoner: 2,
      shield_elite: 2,
    },
    eliteEveryMs: 36_000,
    formationEveryMs: 16_000,
  },
  {
    fromMs: 420_000,
    toMs: 8 * 60_000,
    intervalMs: 240,
    softCap: 230,
    weights: {
      chaser: 1,
      speeder: 2,
      shooter: 2,
      tank: 2,
      charger: 2,
      swarm: 2,
      flanker: 3,
      summoner: 2,
      shield_elite: 2,
    },
    eliteEveryMs: 30_000,
    formationEveryMs: 16_000,
  },
];

export function pickWeightedKind(
  weights: Partial<Record<EnemyKind, number>>,
): EnemyKind {
  const entries = Object.entries(weights) as [EnemyKind, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [kind, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return kind;
  }
  return entries[0]?.[0] ?? 'chaser';
}
