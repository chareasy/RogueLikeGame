export type EnemyKind =
  | 'chaser'
  | 'speeder'
  | 'shooter'
  | 'tank'
  | 'swarm'
  | 'charger'
  | 'elite'
  | 'boss';

export interface EnemyDef {
  kind: EnemyKind;
  radius: number;
  speed: number;
  hp: number;
  damage: number;
  xp: number;
  color: number;
  touchCooldownMs: number;
  keepDistance?: number;
  shootCooldownMs?: number;
  projectileDamage?: number;
  projectileSpeed?: number;
  /** Charger dash settings. */
  dashCooldownMs?: number;
  dashSpeed?: number;
  dashDurationMs?: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  chaser: {
    kind: 'chaser',
    radius: 12,
    speed: 72,
    hp: 18,
    damage: 6,
    xp: 3,
    color: 0xe85d5d,
    touchCooldownMs: 550,
  },
  speeder: {
    kind: 'speeder',
    radius: 10,
    speed: 120,
    hp: 12,
    damage: 5,
    xp: 4,
    color: 0xf0a500,
    touchCooldownMs: 450,
  },
  shooter: {
    kind: 'shooter',
    radius: 13,
    speed: 52,
    hp: 24,
    damage: 6,
    xp: 5,
    color: 0xb388ff,
    touchCooldownMs: 600,
    keepDistance: 220,
    shootCooldownMs: 1800,
    projectileDamage: 10,
    projectileSpeed: 180,
  },
  tank: {
    kind: 'tank',
    radius: 18,
    speed: 42,
    hp: 90,
    damage: 12,
    xp: 8,
    color: 0x7a8ca8,
    touchCooldownMs: 650,
  },
  swarm: {
    kind: 'swarm',
    radius: 8,
    speed: 145,
    hp: 8,
    damage: 4,
    xp: 2,
    color: 0x6dce5a,
    touchCooldownMs: 350,
  },
  charger: {
    kind: 'charger',
    radius: 14,
    speed: 60,
    hp: 34,
    damage: 10,
    xp: 6,
    color: 0xffe082,
    touchCooldownMs: 500,
    dashCooldownMs: 2800,
    dashSpeed: 260,
    dashDurationMs: 420,
  },
  elite: {
    kind: 'elite',
    radius: 22,
    speed: 70,
    hp: 220,
    damage: 16,
    xp: 28,
    color: 0xff3d71,
    touchCooldownMs: 600,
  },
  boss: {
    kind: 'boss',
    radius: 42,
    speed: 55,
    hp: 1800,
    damage: 22,
    xp: 120,
    color: 0xff1744,
    touchCooldownMs: 700,
    keepDistance: 160,
    shootCooldownMs: 1200,
    projectileDamage: 14,
    projectileSpeed: 200,
  },
};
