import type { EnemyKind } from './enemies';

export interface SpawnWave {
  fromMs: number;
  toMs: number;
  intervalMs: number;
  softCap: number;
  weights: Partial<Record<EnemyKind, number>>;
  eliteEveryMs?: number;
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
    fromMs: 150_000,
    toMs: 300_000,
    intervalMs: 320,
    softCap: 130,
    weights: { chaser: 2, speeder: 2, shooter: 2, tank: 1, charger: 2, swarm: 2 },
    eliteEveryMs: 45_000,
  },
  {
    fromMs: 300_000,
    toMs: 420_000,
    intervalMs: 280,
    softCap: 170,
    weights: {
      chaser: 2,
      speeder: 2,
      shooter: 2,
      tank: 2,
      charger: 2,
      swarm: 3,
    },
    eliteEveryMs: 38_000,
  },
  {
    fromMs: 420_000,
    toMs: 8 * 60_000,
    intervalMs: 240,
    softCap: 230,
    weights: {
      chaser: 2,
      speeder: 3,
      shooter: 3,
      tank: 2,
      charger: 3,
      swarm: 3,
    },
    eliteEveryMs: 30_000,
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
