import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { ARENA_HALF, BOSS_SPAWN_MS } from '../config/constants';
import {
  pickWeightedKind,
  SPAWN_TIMELINE,
} from '../config/director';
import type { EnemyKind } from '../config/enemies';
import { Enemy, type EnemyBullet, type EnemyHazard } from '../entities/Enemy';
import type { Player } from '../entities/Player';

export class EnemySystem {
  readonly enemies: Enemy[] = [];
  readonly bullets: EnemyBullet[] = [];
  readonly hazards: EnemyHazard[] = [];
  private spawnAcc = 0;
  private lastEliteAt = -999_999;
  private lastFormationAt = -999_999;
  private bossSpawned = false;
  private readonly maxEnemies: number;
  private phaseBanner?: Phaser.GameObjects.Container;
  /** Soft density bias: >1 when field is empty (high clear power). */
  private densityBias = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    maxEnemies = 280,
  ) {
    this.maxEnemies = maxEnemies;
    for (let i = 0; i < maxEnemies; i += 1) {
      this.enemies.push(new Enemy(scene));
    }
    for (let i = 0; i < 100; i += 1) {
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
    for (let i = 0; i < 12; i += 1) {
      const graphic = scene.add.circle(0, 0, 48, 0xff3d71, 0.22).setDepth(2).setVisible(false);
      graphic.setStrokeStyle(3, 0xff8a8a, 0.9);
      const label = scene.add
        .text(0, 0, '禁区', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#ffb4b4',
          fontStyle: 'bold',
          stroke: '#0b1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(3)
        .setVisible(false);
      this.hazards.push({
        active: false,
        x: 0,
        y: 0,
        radius: 48,
        until: 0,
        damage: 8,
        graphic,
        label,
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
    return this.enemies.some(
      (e) =>
        e.active &&
        (e.kind === 'elite' || e.kind === 'tank' || e.kind === 'shield_elite'),
    );
  }

  get hasBossSpawned(): boolean {
    return this.bossSpawned;
  }

  get bossDefeated(): boolean {
    return this.bossSpawned && !this.bossAlive;
  }

  /** Raise spawn pressure when the field is too empty (e.g. strong mage clear). */
  setDensityBias(bias: number): void {
    // Wider band so role spawnPressure + early openMul can actually bite.
    this.densityBias = Phaser.Math.Clamp(bias, 0.55, 1.7);
  }

  update(time: number, delta: number, elapsedMs: number, player: Player): void {
    this.tickSpawner(delta, elapsedMs, player);
    for (const enemy of this.enemies) {
      if (!enemy.active) continue;
      enemy.update(time, delta, player.x, player.y, this.bullets);
      this.flushEnemyRequests(enemy, player, time);
    }
    this.updateBullets(delta);
    this.updateHazards(time, delta, player);
  }

  private flushEnemyRequests(enemy: Enemy, player: Player, time: number): void {
    if (enemy.phaseAnnounce) {
      enemy.phaseAnnounce = false;
      this.showBossPhase(enemy.bossPhase);
    }
    while (enemy.pendingSummons > 0) {
      enemy.pendingSummons -= 1;
      this.spawnKind('swarm', enemy.x, enemy.y, 40 + Math.random() * 50);
    }
    while (enemy.pendingHazards > 0) {
      enemy.pendingHazards -= 1;
      // Drop near player path — learnable dodge space.
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 120;
      this.spawnHazard(
        player.x + Math.cos(ang) * dist,
        player.y + Math.sin(ang) * dist,
        time,
        4200 + Math.random() * 1200,
      );
    }
  }

  private showBossPhase(phase: number): void {
    this.phaseBanner?.destroy(true);
    const titles = ['', 'Boss 阶段 I', 'Boss 阶段 II · 环弹', 'Boss 阶段 III · 冲锋禁区'];
    const details = [
      '',
      '保持距离，观察弹道',
      '环弹 + 召唤 · 走位穿缝',
      '预警冲锋 + 地面禁区',
    ];
    const { width } = this.scene.scale;
    const root = this.scene.add.container(width / 2, 140).setScrollFactor(0).setDepth(151);
    const bg = this.scene.add
      .rectangle(0, 0, 400, 58, 0x1a0a10, 0.88)
      .setStrokeStyle(2, 0xff6b6b, 0.95);
    const t = this.scene.add
      .text(0, -10, titles[phase] ?? `Boss 阶段 ${phase}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#ff8a8a',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const d = this.scene.add
      .text(0, 14, details[phase] ?? '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#f0d0d0',
      })
      .setOrigin(0.5);
    root.add([bg, t, d]);
    root.setAlpha(0);
    this.scene.tweens.add({
      targets: root,
      alpha: 1,
      y: 155,
      duration: 260,
      hold: 2000,
      yoyo: true,
      onComplete: () => root.destroy(true),
    });
    this.phaseBanner = root;
    this.scene.cameras.main.flash(160, 255, 80, 80);
  }

  private spawnHazard(x: number, y: number, time: number, lifeMs: number): void {
    const hazard = this.hazards.find((h) => !h.active);
    if (!hazard) return;
    hazard.active = true;
    hazard.x = Phaser.Math.Clamp(x, -ARENA_HALF + 40, ARENA_HALF - 40);
    hazard.y = Phaser.Math.Clamp(y, -ARENA_HALF + 40, ARENA_HALF - 40);
    hazard.radius = 52;
    hazard.until = time + lifeMs;
    hazard.damage = 9;
    hazard.graphic.setPosition(hazard.x, hazard.y);
    hazard.graphic.setRadius(hazard.radius);
    hazard.graphic.setVisible(true);
    hazard.graphic.setAlpha(0.55);
    hazard.label.setPosition(hazard.x, hazard.y);
    hazard.label.setVisible(true);
    this.scene.tweens.add({
      targets: hazard.graphic,
      alpha: 0.22,
      duration: 500,
      yoyo: true,
      repeat: 6,
    });
  }

  private updateHazards(time: number, _delta: number, player: Player): void {
    for (const hazard of this.hazards) {
      if (!hazard.active) continue;
      if (time >= hazard.until) {
        hazard.active = false;
        hazard.graphic.setVisible(false);
        hazard.label.setVisible(false);
        continue;
      }
      const dist = Phaser.Math.Distance.Between(player.x, player.y, hazard.x, hazard.y);
      if (dist <= hazard.radius + player.radius) {
        // Soft tick via tryHurt invuln window.
        player.tryHurt(hazard.damage, time, 'hazard');
      }
    }
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
      // Mid-late elites sometimes swap to shield elites.
      const kind: EnemyKind =
        elapsedMs >= 300_000 && Math.random() < 0.45 ? 'shield_elite' : 'elite';
      this.spawnKind(kind, player.x, player.y, 320);
    }

    if (
      wave.formationEveryMs &&
      elapsedMs - this.lastFormationAt >= wave.formationEveryMs
    ) {
      this.lastFormationAt = elapsedMs;
      this.spawnFlankFormation(player.x, player.y);
    }

    const softCap = Math.floor(wave.softCap * this.densityBias);
    if (this.aliveCount >= softCap) return;

    const interval = Math.max(180, wave.intervalMs / this.densityBias);
    this.spawnAcc += delta;
    while (this.spawnAcc >= interval) {
      this.spawnAcc -= interval;
      if (this.aliveCount >= Math.min(softCap, this.maxEnemies)) break;
      const kind = pickWeightedKind(wave.weights);
      this.spawnKind(kind, player.x, player.y, 280 + Math.random() * 160);
    }
  }

  /** Surround pack — readable mid-run behavior change. */
  private spawnFlankFormation(px: number, py: number): void {
    const count = 5;
    for (let i = 0; i < count; i += 1) {
      const a = (i / count) * Math.PI * 2;
      const dist = 260;
      const x = Phaser.Math.Clamp(px + Math.cos(a) * dist, -ARENA_HALF + 30, ARENA_HALF - 30);
      const y = Phaser.Math.Clamp(py + Math.sin(a) * dist, -ARENA_HALF + 30, ARENA_HALF - 30);
      const enemy = this.enemies.find((e) => !e.active);
      if (!enemy) break;
      enemy.spawn('flanker', x, y);
      enemy.flankAngle = a;
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
