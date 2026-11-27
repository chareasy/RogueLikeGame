import type { EnemyKind } from './enemies';

export interface SpawnWave {
  /** Elapsed ms when this wave becomes active. */
  fromMs: number;
  /** Elapsed ms when this wave stops (exclusive). */
  toMs: number;
  /** Average spawn interval while active. */
  intervalMs: number;
  /** Max enemies alive soft cap for this phase. */
  softCap: number;
  weights: Partial<Record<EnemyKind, number>>;
  /** Guaranteed elite spawn cadence while in this window. */
  eliteEveryMs?: number;
}

export const SPAWN_TIMELINE: SpawnWave[] = [
  {
    fromMs: 0,
    toMs: 90_000,
    intervalMs: 1200,
    softCap: 28,
    weights: { chaser: 1 },
  },
  {
    fromMs: 90_000,
    toMs: 240_000,
    intervalMs: 650,
    softCap: 70,
    weights: { chaser: 3, speeder: 2 },
    eliteEveryMs: 60_000,
  },
  {
    fromMs: 240_000,
    toMs: 420_000,
    intervalMs: 400,
    softCap: 130,
    weights: { chaser: 2, speeder: 2, shooter: 2 },
    eliteEveryMs: 45_000,
  },
  {
    fromMs: 420_000,
    toMs: 8 * 60_000,
    intervalMs: 300,
    softCap: 200,
    weights: { chaser: 2, speeder: 3, shooter: 3 },
    eliteEveryMs: 35_000,
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
