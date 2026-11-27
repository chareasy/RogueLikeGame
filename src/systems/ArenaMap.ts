import Phaser from 'phaser';
import { ARENA_HALF } from '../config/constants';
import type { Player } from '../entities/Player';
import type { Enemy } from '../entities/Enemy';

export type Rock = { x: number; y: number; radius: number };
export type Pool = { x: number; y: number; radius: number };
export type SafeZone = {
  x: number;
  y: number;
  radius: number;
  activeUntil: number;
  nextAt: number;
  graphic: Phaser.GameObjects.Arc;
};

/**
 * Arena props: blocking rocks, poison pools, pulsing safe zones.
 */
export class ArenaMap {
  readonly rocks: Rock[] = [];
  readonly poisons: Pool[] = [];
  readonly safes: SafeZone[] = [];
  private readonly poisonGfx: Phaser.GameObjects.Graphics;
  private poisonTickAcc = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.poisonGfx = scene.add.graphics().setDepth(1);
    this.layout();
  }

  private layout(): void {
    const rockSpots: Array<[number, number, number]> = [
      [-420, -280, 48],
      [380, -320, 56],
      [-520, 360, 52],
      [460, 300, 60],
      [-180, 520, 44],
      [220, -560, 50],
      [0, 200, 40],
      [-700, -100, 54],
      [680, 80, 48],
      [-300, -650, 42],
    ];
    for (const [x, y, r] of rockSpots) {
      this.rocks.push({ x, y, radius: r });
      const rock = this.scene.add.circle(x, y, r, 0x3a465e, 0.95).setDepth(2);
      rock.setStrokeStyle(3, 0x1a2236, 1);
      // Subtle top highlight.
      this.scene.add.circle(x - r * 0.25, y - r * 0.3, r * 0.35, 0x5a6a88, 0.35).setDepth(2);
    }

    const poisonSpots: Array<[number, number, number]> = [
      [-250, 100, 70],
      [300, 180, 78],
      [-100, -400, 64],
      [550, -200, 72],
    ];
    for (const [x, y, r] of poisonSpots) {
      this.poisons.push({ x, y, radius: r });
    }
    this.redrawPoisons();

    const safeSpots: Array<[number, number, number]> = [
      [-600, 500, 90],
      [500, -480, 85],
      [50, 650, 80],
    ];
    for (const [x, y, r] of safeSpots) {
      const graphic = this.scene.add.circle(x, y, r, 0x4fd1c5, 0.12);
      graphic.setStrokeStyle(2, 0x7eeae0, 0.55);
      graphic.setDepth(1);
      graphic.setVisible(false);
      this.safes.push({
        x,
        y,
        radius: r,
        activeUntil: 0,
        nextAt: 8_000 + Math.random() * 6_000,
        graphic,
      });
    }
  }

  private redrawPoisons(): void {
    this.poisonGfx.clear();
    for (const p of this.poisons) {
      this.poisonGfx.fillStyle(0x3d8b5a, 0.28);
      this.poisonGfx.fillCircle(p.x, p.y, p.radius);
      this.poisonGfx.lineStyle(2, 0x6fd99a, 0.45);
      this.poisonGfx.strokeCircle(p.x, p.y, p.radius);
    }
  }

  update(time: number, delta: number, player: Player): void {
    // Pulse safe zones on a schedule.
    for (const safe of this.safes) {
      if (time >= safe.nextAt && time >= safe.activeUntil) {
        safe.activeUntil = time + 12_000;
        safe.nextAt = time + 40_000 + Math.random() * 15_000;
        safe.graphic.setVisible(true);
        safe.graphic.setAlpha(0.35);
        this.scene.tweens.add({
          targets: safe.graphic,
          alpha: 0.12,
          duration: 900,
          yoyo: true,
          repeat: 10,
        });
      }
      if (time >= safe.activeUntil) {
        safe.graphic.setVisible(false);
      } else {
        safe.graphic.setVisible(true);
      }
    }

    // Poison DoT.
    this.poisonTickAcc += delta;
    if (this.poisonTickAcc >= 400) {
      this.poisonTickAcc = 0;
      if (!this.isInSafe(player.x, player.y, time)) {
        for (const p of this.poisons) {
          if (Phaser.Math.Distance.Between(player.x, player.y, p.x, p.y) <= p.radius + player.radius) {
            player.tryHurt(4, time);
            break;
          }
        }
      }
    }

    // Soft regen in safe zone.
    if (this.isInSafe(player.x, player.y, time) && player.stats.hp > 0) {
      player.stats.hp = Math.min(
        player.stats.maxHp,
        player.stats.hp + (3 * delta) / 1000,
      );
    }
  }

  isInSafe(x: number, y: number, time: number): boolean {
    for (const s of this.safes) {
      if (time < s.activeUntil && Phaser.Math.Distance.Between(x, y, s.x, s.y) <= s.radius) {
        return true;
      }
    }
    return false;
  }

  /** Push a point out of rocks; returns clamped position. */
  resolveRocks(x: number, y: number, radius: number): { x: number; y: number } {
    let px = x;
    let py = y;
    for (const rock of this.rocks) {
      const dx = px - rock.x;
      const dy = py - rock.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const min = rock.radius + radius;
      if (dist < min) {
        const nx = dx / dist;
        const ny = dy / dist;
        px = rock.x + nx * min;
        py = rock.y + ny * min;
      }
    }
    px = Phaser.Math.Clamp(px, -ARENA_HALF + radius, ARENA_HALF - radius);
    py = Phaser.Math.Clamp(py, -ARENA_HALF + radius, ARENA_HALF - radius);
    return { x: px, y: py };
  }

  resolveEnemy(enemy: Enemy): void {
    if (!enemy.active) return;
    const pos = this.resolveRocks(enemy.x, enemy.y, enemy.radius);
    enemy.x = pos.x;
    enemy.y = pos.y;
    enemy.body.setPosition(enemy.x, enemy.y);
  }
}
