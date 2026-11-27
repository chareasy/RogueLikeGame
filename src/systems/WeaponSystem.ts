import Phaser from 'phaser';
import { WEAPON } from '../config/constants';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import { Projectile } from '../entities/Projectile';

export class WeaponSystem {
  private readonly pool: Projectile[] = [];
  private nextShotAt = 0;

  constructor(scene: Phaser.Scene, poolSize = 120) {
    for (let i = 0; i < poolSize; i += 1) {
      this.pool.push(new Projectile(scene));
    }
  }

  get projectiles(): Projectile[] {
    return this.pool;
  }

  update(time: number, delta: number, player: Player, enemies: Enemy[]): void {
    for (const p of this.pool) p.update(delta);

    if (time < this.nextShotAt) return;

    const target = this.findNearest(player.x, player.y, enemies);
    if (!target) return;

    this.nextShotAt = time + player.stats.cooldownMs;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);
    const count = player.stats.projectileCount;
    const spread = Phaser.Math.DegToRad(WEAPON.spreadDeg);

    for (let i = 0; i < count; i += 1) {
      const projectile = this.pool.find((p) => !p.active);
      if (!projectile) break;
      const offset = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const angle = baseAngle + offset;
      const speed = player.stats.projectileSpeed;
      projectile.fire(
        player.x,
        player.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        player.stats.damage,
        player.stats.projectileRadius,
        player.stats.pierce,
        WEAPON.lifetimeMs,
      );
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
