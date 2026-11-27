export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const ARENA_SIZE = 2200;
export const ARENA_HALF = ARENA_SIZE / 2;

/** Match length in milliseconds (8 minutes). */
export const MATCH_DURATION_MS = 8 * 60 * 1000;

/** Boss appears at 6:00. */
export const BOSS_SPAWN_MS = 6 * 60 * 1000;

export const PLAYER = {
  radius: 14,
  speed: 175,
  maxHp: 100,
  invulnMs: 650,
  pickupRadius: 90,
  /** Higher base + growth so first power spike lands ~45–75s, not ~15s. */
  xpToLevelBase: 14,
  xpToLevelGrowth: 1.22,
  /** Extra magnet window after each kill (ms). */
  killMagnetMs: 900,
};

export const WEAPON = {
  cooldownMs: 420,
  damage: 14,
  projectileSpeed: 360,
  projectileRadius: 7,
  pierce: 0,
  count: 1,
  spreadDeg: 14,
  lifetimeMs: 1500,
};

export const COLORS = {
  bg: 0x0b1020,
  arena: 0x152038,
  grid: 0x1e2d4a,
  player: 0x4fd1c5,
  projectile: 0xffe66d,
  xp: 0x7cf29c,
  hud: '#e8eefc',
  danger: '#ff6b6b',
};
