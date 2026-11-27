import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';

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

  readonly graphic: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.graphic = scene.add.image(0, 0, ASSET_KEYS.projectile);
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
    tint?: number,
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
    const size = radius * 2.5;
    this.graphic.setDisplaySize(size, size);
    this.graphic.setRotation(Math.atan2(vy, vx));
    this.graphic.setPosition(x, y);
    if (tint !== undefined) this.graphic.setTint(tint);
    else this.graphic.clearTint();
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
    this.graphic.clearTint();
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
    this.hitIds.clear();
  }
}
