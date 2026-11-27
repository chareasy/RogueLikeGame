import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { WEAPON } from '../config/constants';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

interface OrbitBlade {
  graphic: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Arc;
  hitCooldown: Map<number, number>;
  trailAcc: number;
}

export class WeaponSystem {
  private readonly pool: Projectile[] = [];
  private nextShotAt = 0;
  private nextAuraAt = 0;
  private orbitAngle = 0;
  private readonly orbitBlades: OrbitBlade[] = [];
  private readonly auraRing: Phaser.GameObjects.Image;
  private readonly auraPulse: Phaser.GameObjects.Arc;
  private readonly orbitHalo: Phaser.GameObjects.Arc;
  private readonly scatterFanGfx: Phaser.GameObjects.Graphics;
  private fanUntil = 0;
  private fanAngle = 0;
  private fanSpread = 0;
  private fanCount = 1;
  private fanX = 0;
  private fanY = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    poolSize = 160,
  ) {
    for (let i = 0; i < poolSize; i += 1) {
      this.pool.push(new Projectile(scene));
    }
    this.auraRing = scene.add.image(0, 0, ASSET_KEYS.auraRing);
    this.auraRing.setDepth(3);
    this.auraRing.setVisible(false);
    this.auraRing.setAlpha(0.55);
    this.auraRing.setTint(0xff6b4a);

    this.auraPulse = scene.add.circle(0, 0, 40, 0xff6b4a, 0.12);
    this.auraPulse.setStrokeStyle(2, 0xffa07a, 0.55);
    this.auraPulse.setDepth(2);
    this.auraPulse.setVisible(false);

    this.orbitHalo = scene.add.circle(0, 0, 70, 0xb388ff, 0.08);
    this.orbitHalo.setStrokeStyle(2, 0xcbb2fe, 0.45);
    this.orbitHalo.setDepth(2);
    this.orbitHalo.setVisible(false);

    this.scatterFanGfx = scene.add.graphics().setDepth(7);
  }

  get projectiles(): Projectile[] {
    return this.pool;
  }

  update(time: number, delta: number, player: Player, enemies: Enemy[]): void {
    for (const p of this.pool) p.update(delta);

    if (player.stats.hasBolt || player.stats.hasScatter) {
      this.updateBolts(time, player, enemies);
    }
    if (player.stats.hasOrbit) {
      this.updateOrbit(time, delta, player, enemies);
    } else {
      this.hideOrbit();
    }
    if (player.stats.hasAura) {
      this.updateAura(time, player, enemies);
    } else {
      this.auraRing.setVisible(false);
      this.auraPulse.setVisible(false);
    }

    this.drawScatterFan(time, player);
  }

  private updateBolts(time: number, player: Player, enemies: Enemy[]): void {
    if (time < this.nextShotAt) return;
    const target = this.findNearest(player.x, player.y, enemies);
    if (!target) return;

    this.nextShotAt = time + player.stats.cooldownMs;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const count = player.stats.projectileCount;
    const spreadDeg = player.stats.hasScatter
      ? WEAPON.spreadDeg * 1.85
      : WEAPON.spreadDeg;
    const spread = Phaser.Math.DegToRad(spreadDeg);

    if (player.stats.hasScatter) {
      this.fanUntil = time + 160;
      this.fanAngle = baseAngle;
      this.fanSpread = spread;
      this.fanCount = count;
      this.fanX = player.x;
      this.fanY = player.y;
    }

    const tint = player.stats.hasScatter
      ? 0x7cf29c
      : player.character.id === 'knight'
        ? 0xffe66d
        : player.character.id === 'berserker'
          ? 0xff8a5c
          : undefined;

    for (let i = 0; i < count; i += 1) {
      const projectile = this.pool.find((p) => !p.active);
      if (!projectile) break;
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const speed = player.stats.projectileSpeed;
      const dmg = player.stats.damage * player.stats.rollCritMultiplier();
      const radius = player.stats.hasScatter
        ? player.stats.projectileRadius * 1.15
        : player.stats.projectileRadius;
      projectile.fire(
        player.x,
        player.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        dmg,
        radius,
        player.stats.pierce,
        WEAPON.lifetimeMs,
        tint,
      );
    }
  }

  private drawScatterFan(time: number, player: Player): void {
    this.scatterFanGfx.clear();
    if (!player.stats.hasScatter || time >= this.fanUntil) return;
    const t = 1 - (this.fanUntil - time) / 160;
    const alpha = 0.28 * (1 - t);
    const reach = 78;
    const start =
      this.fanAngle - this.fanSpread * ((this.fanCount - 1) / 2);
    const end = this.fanAngle + this.fanSpread * ((this.fanCount - 1) / 2);
    this.scatterFanGfx.fillStyle(0x7cf29c, alpha);
    this.scatterFanGfx.beginPath();
    this.scatterFanGfx.moveTo(this.fanX, this.fanY);
    for (let i = 0; i <= 10; i += 1) {
      const a = start + ((end - start) * i) / 10;
      this.scatterFanGfx.lineTo(
        this.fanX + Math.cos(a) * reach,
        this.fanY + Math.sin(a) * reach,
      );
    }
    this.scatterFanGfx.closePath();
    this.scatterFanGfx.fillPath();
    this.scatterFanGfx.lineStyle(2, 0xb8ffd0, alpha + 0.2);
    this.scatterFanGfx.strokePath();
  }

  private ensureOrbitBlades(count: number): void {
    while (this.orbitBlades.length < count) {
      const graphic = this.scene.add.image(0, 0, ASSET_KEYS.orbitBlade);
      graphic.setDepth(9);
      graphic.setDisplaySize(26, 26);
      graphic.setTint(0xd4b3ff);
      const glow = this.scene.add.circle(0, 0, 10, 0xb388ff, 0.35);
      glow.setDepth(8);
      this.orbitBlades.push({
        graphic,
        glow,
        hitCooldown: new Map(),
        trailAcc: 0,
      });
    }
    for (let i = 0; i < this.orbitBlades.length; i += 1) {
      const blade = this.orbitBlades[i]!;
      const show = i < count;
      blade.graphic.setVisible(show);
      blade.glow.setVisible(show);
    }
  }

  private hideOrbit(): void {
    for (const blade of this.orbitBlades) {
      blade.graphic.setVisible(false);
      blade.glow.setVisible(false);
    }
    this.orbitHalo.setVisible(false);
  }

  private updateOrbit(
    time: number,
    delta: number,
    player: Player,
    enemies: Enemy[],
  ): void {
    const count = Math.max(1, player.stats.orbitCount);
    this.ensureOrbitBlades(count);
    this.orbitAngle += (delta / 1000) * 2.6;

    this.orbitHalo.setVisible(true);
    this.orbitHalo.setPosition(player.x, player.y);
    this.orbitHalo.setRadius(player.stats.orbitRadius);
    this.orbitHalo.setAlpha(0.08 + Math.sin(time / 220) * 0.03);

    for (let i = 0; i < count; i += 1) {
      const blade = this.orbitBlades[i]!;
      const angle = this.orbitAngle + (i / count) * Math.PI * 2;
      const x = player.x + Math.cos(angle) * player.stats.orbitRadius;
      const y = player.y + Math.sin(angle) * player.stats.orbitRadius;
      blade.graphic.setPosition(x, y);
      blade.graphic.setRotation(angle + Math.PI / 2);
      blade.graphic.setVisible(true);
      blade.glow.setPosition(x, y);
      blade.glow.setVisible(true);

      blade.trailAcc += delta;
      if (blade.trailAcc >= 40) {
        blade.trailAcc = 0;
        const spark = this.scene.add
          .circle(x, y, 4, 0xcbb2fe, 0.55)
          .setDepth(7);
        this.scene.tweens.add({
          targets: spark,
          alpha: 0,
          scale: 0.2,
          duration: 280,
          onComplete: () => spark.destroy(),
        });
      }

      for (let ei = 0; ei < enemies.length; ei += 1) {
        const enemy = enemies[ei]!;
        if (!enemy.active) continue;
        const readyAt = blade.hitCooldown.get(ei) ?? 0;
        if (time < readyAt) continue;
        const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
        if (dist > enemy.radius + 14) continue;
        const mult = player.stats.rollCritMultiplier();
        const dmg = player.stats.damage * 0.85 * mult;
        const safe = Math.max(1, dist);
        const nx = (enemy.x - x) / safe;
        const ny = (enemy.y - y) / safe;
        const dead = enemy.takeDamage(dmg, time, nx * 8, ny * 8);
        this.pendingHits.push({
          x: enemy.x,
          y: enemy.y,
          amount: dmg,
          crit: mult > 1,
          killed: dead,
          style: 'normal',
        });
        blade.hitCooldown.set(ei, time + 220);
        if (dead) {
          this.pendingOrbitKills.push({
            x: enemy.x,
            y: enemy.y,
            xp: enemy.xp,
            kind: enemy.kind,
          });
          enemy.kill();
        }
      }
    }
  }

  readonly pendingOrbitKills: Array<{
    x: number;
    y: number;
    xp: number;
    kind: Enemy['kind'];
  }> = [];
  readonly pendingAuraKills: Array<{
    x: number;
    y: number;
    xp: number;
    kind: Enemy['kind'];
  }> = [];
  readonly pendingHits: Array<{
    x: number;
    y: number;
    amount: number;
    crit: boolean;
    killed: boolean;
    style: 'normal' | 'burn';
  }> = [];

  private updateAura(time: number, player: Player, enemies: Enemy[]): void {
    const radius = Math.max(48, player.stats.auraRadius * 1.15);
    this.auraRing.setVisible(true);
    this.auraRing.setPosition(player.x, player.y);
    this.auraRing.setDisplaySize(radius * 2.35, radius * 2.35);
    this.auraRing.rotation += 0.025;
    this.auraRing.setAlpha(0.45 + Math.sin(time / 180) * 0.12);

    this.auraPulse.setVisible(true);
    this.auraPulse.setPosition(player.x, player.y);
    this.auraPulse.setRadius(radius);
    this.auraPulse.setAlpha(0.1 + Math.sin(time / 160) * 0.06);

    if (time < this.nextAuraAt) return;
    this.nextAuraAt = time + 280;

    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const dist = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        enemy.x,
        enemy.y,
      );
      if (dist > radius + enemy.radius) continue;
      const mult = player.stats.rollCritMultiplier();
      const dmg = player.stats.auraDamage * mult;
      const dead = enemy.takeDamage(dmg, time);
      this.pendingHits.push({
        x: enemy.x,
        y: enemy.y,
        amount: dmg,
        crit: mult > 1,
        killed: dead,
        style: 'burn',
      });
      if (dead) {
        enemy.kill();
        this.pendingAuraKills.push({
          x: enemy.x,
          y: enemy.y,
          xp: enemy.xp,
          kind: enemy.kind,
        });
      }
    }
  }

  private findNearest(
    x: number,
    y: number,
    enemies: Enemy[],
  ): Enemy | null {
    let best: Enemy | null = null;
    let bestDist = Infinity;
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      const d = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }
}
