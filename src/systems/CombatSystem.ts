import Phaser from 'phaser';
import type { EnemyKind } from '../config/enemies';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import type { EnemyBullet } from '../entities/Enemy';
import type { XpOrb } from '../entities/XpOrb';

export class CombatSystem {
  kills = 0;

  resolvePlayerProjectiles(
    time: number,
    projectiles: Projectile[],
    enemies: Enemy[],
    spawnXp: (x: number, y: number, value: number) => void,
    onKill?: (kind: EnemyKind) => void,
  ): void {
    for (const projectile of projectiles) {
      if (!projectile.active) continue;
      for (let i = 0; i < enemies.length; i += 1) {
        const enemy = enemies[i]!;
        if (!enemy.active) continue;
        if (projectile.hitIds.has(i)) continue;
        const dist = Phaser.Math.Distance.Between(
          projectile.x,
          projectile.y,
          enemy.x,
          enemy.y,
        );
        if (dist > projectile.radius + enemy.radius) continue;

        projectile.hitIds.add(i);
        const dead = enemy.takeDamage(projectile.damage, time);
        if (dead) {
          const kind = enemy.kind;
          spawnXp(enemy.x, enemy.y, enemy.xp);
          enemy.kill();
          this.kills += 1;
          onKill?.(kind);
        }

        if (projectile.pierceLeft <= 0) {
          projectile.kill();
          break;
        }
        projectile.pierceLeft -= 1;
      }
    }
  }

  resolveEnemyContact(
    time: number,
    player: Player,
    enemies: Enemy[],
  ): void {
    for (const enemy of enemies) {
      if (!enemy.active) continue;
      if (time < enemy.nextTouchAt) continue;
      const dist = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        enemy.x,
        enemy.y,
      );
      if (dist <= player.radius + enemy.radius) {
        if (player.tryHurt(enemy.damage, time)) {
          enemy.nextTouchAt = time + enemy.touchCooldownMs;
        }
      }
    }
  }

  resolveEnemyBullets(
    time: number,
    player: Player,
    bullets: EnemyBullet[],
  ): void {
    for (const bullet of bullets) {
      if (!bullet.active) continue;
      const dist = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        bullet.x,
        bullet.y,
      );
      if (dist <= player.radius + bullet.radius) {
        if (player.tryHurt(bullet.damage, time)) {
          bullet.active = false;
          bullet.graphic.setVisible(false);
        }
      }
    }
  }

  collectXp(
    delta: number,
    player: Player,
    orbs: XpOrb[],
  ): number {
    let gained = 0;
    for (const orb of orbs) {
      if (!orb.active) continue;
      gained += orb.update(
        delta,
        player.x,
        player.y,
        player.stats.pickupRadius,
      );
    }
    return gained;
  }
}
