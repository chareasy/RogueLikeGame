import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { ARENA_HALF, BOSS_SPAWN_MS } from '../config/constants';
import {
  pickWeightedKind,
  SPAWN_TIMELINE,
} from '../config/director';
import type { EnemyKind } from '../config/enemies';
import { Enemy, type EnemyBullet } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export class EnemySystem {
  readonly enemies: Enemy[] = [];
  readonly bullets: EnemyBullet[] = [];
  private spawnAcc = 0;
  private lastEliteAt = -999_999;
  private bossSpawned = false;
  private readonly maxEnemies: number;

  constructor(
    private readonly scene: Phaser.Scene,
    maxEnemies = 260,
  ) {
    this.maxEnemies = maxEnemies;
    for (let i = 0; i < maxEnemies; i += 1) {
      this.enemies.push(new Enemy(scene));
    }
    for (let i = 0; i < 80; i += 1) {
      const graphic = scene.add.image(0, 0, ASSET_KEYS.enemyBullet);
      graphic.setVisible(false);
      graphic.setActive(false);
      graphic.setDepth(7);
      graphic.setDisplaySize(12, 12);
      this.bullets.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        damage: 0,
        radius: 5,
        lifeMs: 0,
        graphic,
      });
    }
  }

  get aliveCount(): number {
    return this.enemies.reduce((n, e) => n + (e.active ? 1 : 0), 0);
  }

  get bossAlive(): boolean {
    return this.enemies.some((e) => e.active && e.kind === 'boss');
  }

  get eliteAlive(): boolean {
    return this.enemies.some((e) => e.active && (e.kind === 'elite' || e.kind === 'tank'));
  }

  get hasBossSpawned(): boolean {
    return this.bossSpawned;
  }

  get bossDefeated(): boolean {
    return this.bossSpawned && !this.bossAlive;
  }

  update(time: number, delta: number, elapsedMs: number, player: Player): void {
    this.tickSpawner(delta, elapsedMs, player);
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.update(time, delta, player.x, player.y, this.bullets);
    }
    this.updateBullets(delta);
  }

  private tickSpawner(delta: number, elapsedMs: number, player: Player): void {
    if (!this.bossSpawned && elapsedMs >= BOSS_SPAWN_MS) {
      this.bossSpawned = true;
      this.spawnKind('boss', player.x, player.y, 380);
      this.scene.cameras.main.flash(250, 255, 40, 40);
    }

    const wave = SPAWN_TIMELINE.find(
      (w) => elapsedMs >= w.fromMs && elapsedMs < w.toMs,
    );
    if (!wave) return;

    if (wave.eliteEveryMs && elapsedMs - this.lastEliteAt >= wave.eliteEveryMs) {
      this.lastEliteAt = elapsedMs;
      this.spawnKind('elite', player.x, player.y, 320);
    }

    if (this.aliveCount >= wave.softCap) return;

    this.spawnAcc += delta;
    while (this.spawnAcc >= wave.intervalMs) {
      this.spawnAcc -= wave.intervalMs;
      if (this.aliveCount >= Math.min(wave.softCap, this.maxEnemies)) break;
      const kind = pickWeightedKind(wave.weights);
      this.spawnKind(kind, player.x, player.y, 280 + Math.random() * 160);
    }
  }

  private updateBullets(delta: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;
      bullet.lifeMs -= delta;
      if (bullet.lifeMs <= 0) {
        bullet.active = false;
        bullet.graphic.clearTint();
        bullet.graphic.setVisible(false);
        continue;
      }
      bullet.x += (bullet.vx * delta) / 1000;
      bullet.y += (bullet.vy * delta) / 1000;
      bullet.graphic.setPosition(bullet.x, bullet.y);

      if (
        Math.abs(bullet.x) > ARENA_HALF + 40 ||
        Math.abs(bullet.y) > ARENA_HALF + 40
      ) {
        bullet.active = false;
        bullet.graphic.clearTint();
        bullet.graphic.setVisible(false);
      }
    }
  }

  spawnKind(
    kind: EnemyKind,
    aroundX: number,
    aroundY: number,
    minDist: number,
  ): Enemy | null {
    const enemy = this.enemies.find((e) => !e.active);
    if (!enemy) return null;

    const angle = Math.random() * Math.PI * 2;
    const dist = minDist + Math.random() * 80;
    let x = aroundX + Math.cos(angle) * dist;
    let y = aroundY + Math.sin(angle) * dist;
    x = Phaser.Math.Clamp(x, -ARENA_HALF + 30, ARENA_HALF - 30);
    y = Phaser.Math.Clamp(y, -ARENA_HALF + 30, ARENA_HALF - 30);
    enemy.spawn(kind, x, y);
    return enemy;
  }
}
