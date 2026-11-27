import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { WEAPON } from '../config/constants';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

interface OrbitBlade {
  graphic: Phaser.GameObjects.Image;
  hitCooldown: Map<number, number>;
}

export class WeaponSystem {
  private readonly pool: Projectile[] = [];
  private nextShotAt = 0;
  private nextAuraAt = 0;
  private orbitAngle = 0;
  private readonly orbitBlades: OrbitBlade[] = [];
  private readonly auraRing: Phaser.GameObjects.Image;

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
    this.auraRing.setAlpha(0.45);
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
    }
  }

  private updateBolts(time: number, player: Player, enemies: Enemy[]): void {
    if (time < this.nextShotAt) return;
    const target = this.findNearest(player.x, player.y, enemies);
    if (!target) return;

    this.nextShotAt = time + player.stats.cooldownMs;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const count = player.stats.projectileCount;
    const spreadDeg = player.stats.hasScatter
      ? WEAPON.spreadDeg * 1.6
      : WEAPON.spreadDeg;
    const spread = Phaser.Math.DegToRad(spreadDeg);

    for (let i = 0; i < count; i += 1) {
      const projectile = this.pool.find((p) => !p.active);
      if (!projectile) break;
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const speed = player.stats.projectileSpeed;
      const dmg = player.stats.damage * player.stats.rollCritMultiplier();
      projectile.fire(
        player.x,
        player.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        dmg,
        player.stats.projectileRadius,
        player.stats.pierce,
        WEAPON.lifetimeMs,
      );
    }
  }

  private ensureOrbitBlades(count: number): void {
    while (this.orbitBlades.length < count) {
      const graphic = this.scene.add.image(0, 0, ASSET_KEYS.orbitBlade);
      graphic.setDepth(9);
      graphic.setDisplaySize(22, 22);
      this.orbitBlades.push({ graphic, hitCooldown: new Map() });
    }
    for (let i = 0; i < this.orbitBlades.length; i += 1) {
      const blade = this.orbitBlades[i]!;
      blade.graphic.setVisible(i < count);
    }
  }

  private hideOrbit(): void {
    for (const blade of this.orbitBlades) blade.graphic.setVisible(false);
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

    for (let i = 0; i < count; i += 1) {
      const blade = this.orbitBlades[i]!;
      const angle = this.orbitAngle + (i / count) * Math.PI * 2;
      const x = player.x + Math.cos(angle) * player.stats.orbitRadius;
      const y = player.y + Math.sin(angle) * player.stats.orbitRadius;
      blade.graphic.setPosition(x, y);
      blade.graphic.setRotation(angle + Math.PI / 2);
      blade.graphic.setVisible(true);

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
  }> = [];

  private updateAura(time: number, player: Player, enemies: Enemy[]): void {
    const radius = Math.max(40, player.stats.auraRadius);
    this.auraRing.setVisible(true);
    this.auraRing.setPosition(player.x, player.y);
    this.auraRing.setDisplaySize(radius * 2.2, radius * 2.2);
    this.auraRing.rotation += 0.02;

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
