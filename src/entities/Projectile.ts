import Phaser from 'phaser';
import { COLORS } from '../config/constants';

export class Projectile {
  active = false;
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  damage = 0;
  radius = 6;
  pierceLeft = 0;
  lifeMs = 0;
  hitIds = new Set<number>();

  readonly graphic: Phaser.GameObjects.Arc;

  constructor(scene: Phaser.Scene) {
    this.graphic = scene.add.circle(0, 0, 6, COLORS.projectile, 1);
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
    this.graphic.setDepth(8);
  }

  fire(
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    radius: number,
    pierce: number,
    lifeMs: number,
  ): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.radius = radius;
    this.pierceLeft = pierce;
    this.lifeMs = lifeMs;
    this.hitIds.clear();
    this.graphic.setRadius(radius);
    this.graphic.setPosition(x, y);
    this.graphic.setVisible(true);
    this.graphic.setActive(true);
  }

  update(delta: number): void {
    if (!this.active) return;
    this.lifeMs -= delta;
    if (this.lifeMs <= 0) {
      this.kill();
      return;
    }
    this.x += (this.vx * delta) / 1000;
    this.y += (this.vy * delta) / 1000;
    this.graphic.setPosition(this.x, this.y);
  }

  kill(): void {
    this.active = false;
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
    this.hitIds.clear();
  }
}
