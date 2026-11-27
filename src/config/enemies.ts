export type EnemyKind = 'chaser' | 'speeder' | 'shooter' | 'elite' | 'boss';

export interface EnemyDef {
  kind: EnemyKind;
  radius: number;
  speed: number;
  hp: number;
  damage: number;
  xp: number;
  color: number;
  touchCooldownMs: number;
  /** Shooter-only: preferred distance from player. */
  keepDistance?: number;
  shootCooldownMs?: number;
  projectileDamage?: number;
  projectileSpeed?: number;
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
