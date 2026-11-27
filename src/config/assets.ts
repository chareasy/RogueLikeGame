import type { EnemyKind } from './enemies';

export const ASSET_KEYS = {
  player: 'player_knight',
  projectile: 'projectile',
  orbitBlade: 'orbit_blade',
  auraRing: 'aura_ring',
  enemyBullet: 'enemy_bullet',
  xpGem: 'xp_gem',
  ground: 'ground_tile',
  menuBg: 'menu_bg',
  characters: {
    knight: 'player_knight',
    mage: 'player_mage',
    ranger: 'player_ranger',
    berserker: 'player_berserker',
  },
  enemies: {
    chaser: 'enemy_chaser',
    speeder: 'enemy_speeder',
    shooter: 'enemy_shooter',
    tank: 'enemy_tank',
    swarm: 'enemy_swarm',
    charger: 'enemy_charger',
    flanker: 'enemy_speeder',
    summoner: 'enemy_shooter',
    shield_elite: 'enemy_elite',
    elite: 'enemy_elite',
    boss: 'enemy_boss',
  } as Record<EnemyKind, string>,
} as const;

export const UI_ASSET_IMAGES: Array<{ key: string; path: string }> = [
  { key: 'ui_menu_banner', path: 'assets/ui/ui_menu_banner.jpg' },
  { key: 'ui_energy_emblem', path: 'assets/ui/ui_energy_emblem.jpg' },
  { key: 'ui_combat_vignette', path: 'assets/ui/ui_combat_vignette.jpg' },
];

export const UI_SPRITESHEETS: Array<{
  key: string;
  path: string;
  frameWidth: number;
  frameHeight: number;
}> = [
  { key: 'ui_sparkle_sheet', path: 'assets/ui/fx_sparkle_sheet.png', frameWidth: 64, frameHeight: 64 },
  { key: 'ui_xp_orb_sheet', path: 'assets/ui/fx_xp_orb_sheet.png', frameWidth: 48, frameHeight: 48 },
  { key: 'ui_motes_sheet', path: 'assets/ui/fx_menu_motes_sheet.png', frameWidth: 128, frameHeight: 128 },
  { key: 'ui_slash_sheet', path: 'assets/ui/fx_slash_sheet.png', frameWidth: 48, frameHeight: 48 },
];

export const ASSET_FILES: Array<{ key: string; path: string }> = [
  { key: ASSET_KEYS.characters.knight, path: 'assets/player_knight.png' },
  { key: ASSET_KEYS.characters.mage, path: 'assets/player_mage.png' },
  { key: ASSET_KEYS.characters.ranger, path: 'assets/player_ranger.png' },
  { key: ASSET_KEYS.characters.berserker, path: 'assets/player_berserker.png' },
  { key: ASSET_KEYS.projectile, path: 'assets/projectile.png' },
  { key: ASSET_KEYS.orbitBlade, path: 'assets/orbit_blade.png' },
  { key: ASSET_KEYS.auraRing, path: 'assets/aura_ring.png' },
  { key: ASSET_KEYS.enemyBullet, path: 'assets/enemy_bullet.png' },
  { key: ASSET_KEYS.xpGem, path: 'assets/xp_gem.png' },
  { key: ASSET_KEYS.ground, path: 'assets/ground_tile.png' },
  { key: ASSET_KEYS.menuBg, path: 'assets/menu_bg.png' },
  { key: ASSET_KEYS.enemies.chaser, path: 'assets/enemy_chaser.png' },
  { key: ASSET_KEYS.enemies.speeder, path: 'assets/enemy_speeder.png' },
  { key: ASSET_KEYS.enemies.shooter, path: 'assets/enemy_shooter.png' },
  { key: ASSET_KEYS.enemies.tank, path: 'assets/enemy_tank.png' },
  { key: ASSET_KEYS.enemies.swarm, path: 'assets/enemy_swarm.png' },
  { key: ASSET_KEYS.enemies.charger, path: 'assets/enemy_charger.png' },
  { key: ASSET_KEYS.enemies.elite, path: 'assets/enemy_elite.png' },
  { key: ASSET_KEYS.enemies.boss, path: 'assets/enemy_boss.png' },
];

export const AUDIO_FILES: Array<{ key: string; path: string }> = [
  { key: 'bgm_menu', path: 'audio/bgm_menu.ogg' },
  { key: 'bgm_combat_1', path: 'audio/bgm_combat_1.ogg' },
  { key: 'bgm_combat_2', path: 'audio/bgm_combat_2.ogg' },
  { key: 'bgm_combat_3', path: 'audio/bgm_combat_3.ogg' },
  { key: 'sfx_kill', path: 'audio/sfx_kill.wav' },
  { key: 'sfx_kill_elite', path: 'audio/sfx_kill_elite.wav' },
  { key: 'sfx_kill_boss', path: 'audio/sfx_kill_boss.wav' },
  { key: 'sfx_ui', path: 'audio/sfx_ui.wav' },
];
