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
    toMs: 75_000,
    intervalMs: 1150,
    softCap: 28,
    weights: { chaser: 3, swarm: 1 },
  },
  {
    fromMs: 75_000,
    toMs: 180_000,
    intervalMs: 620,
    softCap: 70,
    weights: { chaser: 3, speeder: 2, swarm: 2 },
    eliteEveryMs: 60_000,
  },
  {
    fromMs: 180_000,
    toMs: 300_000,
    intervalMs: 420,
    softCap: 110,
    weights: { chaser: 2, speeder: 2, shooter: 2, tank: 1, charger: 1 },
    eliteEveryMs: 50_000,
  },
  {
    fromMs: 300_000,
    toMs: 420_000,
    intervalMs: 360,
    softCap: 150,
    weights: {
      chaser: 2,
      speeder: 2,
      shooter: 2,
      tank: 2,
      charger: 2,
      swarm: 2,
    },
    eliteEveryMs: 42_000,
  },
  {
    fromMs: 420_000,
    toMs: 8 * 60_000,
    intervalMs: 280,
    softCap: 210,
    weights: {
      chaser: 2,
      speeder: 3,
      shooter: 3,
      tank: 2,
      charger: 3,
      swarm: 3,
    },
    eliteEveryMs: 32_000,
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
