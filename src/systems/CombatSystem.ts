import Phaser from 'phaser';
import type { EnemyKind } from '../config/enemies';
import type { Enemy } from '../entities/Enemy';
import type { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import type { EnemyBullet } from '../entities/Enemy';
import type { XpOrb } from '../entities/XpOrb';
import type { FeedbackFX } from './FeedbackFX';

export class CombatSystem {
  kills = 0;

  resolvePlayerProjectiles(
    time: number,
    projectiles: Projectile[],
    enemies: Enemy[],
    spawnXp: (x: number, y: number, value: number) => void,
    onKill?: (kind: EnemyKind) => void,
    fx?: FeedbackFX,
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
        const crit = projectile.damage >= 20 && Math.random() < 0.25;
        const amount = projectile.damage;
        const nx = (enemy.x - projectile.x) / (dist || 1);
        const ny = (enemy.y - projectile.y) / (dist || 1);
        const dead = enemy.takeDamage(
          amount,
          time,
          nx * 10,
          ny * 10,
          projectile.x,
          projectile.y,
        );
        fx?.damageNumber(enemy.x, enemy.y - enemy.radius, amount, crit);
        fx?.hitBurst(enemy.x, enemy.y);
        if (dead) {
          const kind = enemy.kind;
          fx?.killBurst(enemy.x, enemy.y);
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
    damageScale = 1,
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
        const cause = time < enemy.dashUntil ? 'charge' : 'contact';
        const dmg = Math.max(1, Math.floor(enemy.damage * damageScale));
        if (player.tryHurt(dmg, time, cause)) {
          enemy.nextTouchAt = time + enemy.touchCooldownMs;
          // Soft shove so piles don't stick on top of the player.
          const nx = (player.x - enemy.x) / (dist || 1);
          const ny = (player.y - enemy.y) / (dist || 1);
          enemy.x -= nx * 10;
          enemy.y -= ny * 10;
          enemy.body.setPosition(enemy.x, enemy.y);
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
        if (player.tryHurt(bullet.damage, time, 'bullet')) {
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
    magnetBoost = false,
  ): number {
    let gained = 0;
    for (const orb of orbs) {
      if (!orb.active) continue;
      gained += orb.update(
        delta,
        player.x,
        player.y,
        player.stats.pickupRadius,
        magnetBoost,
      );
    }
    return gained;
  }
}
