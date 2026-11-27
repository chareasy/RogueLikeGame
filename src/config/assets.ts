import type { EnemyKind } from './enemies';

export const ASSET_KEYS = {
  player: 'player',
  projectile: 'projectile',
  enemyBullet: 'enemy_bullet',
  xpGem: 'xp_gem',
  ground: 'ground_tile',
  menuBg: 'menu_bg',
  enemies: {
    chaser: 'enemy_chaser',
    speeder: 'enemy_speeder',
    shooter: 'enemy_shooter',
    elite: 'enemy_elite',
    boss: 'enemy_boss',
  } as Record<EnemyKind, string>,
} as const;

export const ASSET_FILES: Array<{ key: string; path: string }> = [
  { key: ASSET_KEYS.player, path: 'assets/player.png' },
  { key: ASSET_KEYS.projectile, path: 'assets/projectile.png' },
  { key: ASSET_KEYS.enemyBullet, path: 'assets/enemy_bullet.png' },
  { key: ASSET_KEYS.xpGem, path: 'assets/xp_gem.png' },
  { key: ASSET_KEYS.ground, path: 'assets/ground_tile.png' },
  { key: ASSET_KEYS.menuBg, path: 'assets/menu_bg.png' },
  { key: ASSET_KEYS.enemies.chaser, path: 'assets/enemy_chaser.png' },
  { key: ASSET_KEYS.enemies.speeder, path: 'assets/enemy_speeder.png' },
  { key: ASSET_KEYS.enemies.shooter, path: 'assets/enemy_shooter.png' },
  { key: ASSET_KEYS.enemies.elite, path: 'assets/enemy_elite.png' },
  { key: ASSET_KEYS.enemies.boss, path: 'assets/enemy_boss.png' },
];
