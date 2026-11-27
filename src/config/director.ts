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
    fromMs: 0,
    toMs: 60_000,
    intervalMs: 520,
    softCap: 48,
    weights: { chaser: 3, swarm: 2 },
  },
  {
    fromMs: 60_000,
    toMs: 150_000,
    intervalMs: 380,
    softCap: 90,
    weights: { chaser: 3, speeder: 2, swarm: 3 },
    eliteEveryMs: 55_000,
  },
  {
    // 2.5–5 min: introduce flank / summon / shield elites.
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
      flanker: 2,
      summoner: 1,
    },
    eliteEveryMs: 45_000,
    formationEveryMs: 22_000,
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
      shield_elite: 1,
    },
    eliteEveryMs: 38_000,
    formationEveryMs: 18_000,
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
