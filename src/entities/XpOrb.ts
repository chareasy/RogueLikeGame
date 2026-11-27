import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';

export class XpOrb {
  active = false;
  x = 0;
  y = 0;
  value = 1;
  magnetized = false;

  readonly graphic: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.graphic = scene.add.image(0, 0, ASSET_KEYS.xpGem);
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
    this.graphic.setDepth(4);
    this.graphic.setDisplaySize(16, 22);
  }

  spawn(x: number, y: number, value: number): void {
    this.active = true;
    this.x = x;
    this.y = y;
    this.value = value;
    this.magnetized = false;
    this.graphic.setPosition(x, y);
    this.graphic.setVisible(true);
    this.graphic.setActive(true);
  }

  update(delta: number, px: number, py: number, pickupRadius: number): number {
    if (!this.active) return 0;

    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 12) {
      this.kill();
      return this.value;
    }

    if (dist <= pickupRadius || this.magnetized) {
      this.magnetized = true;
      const speed = 280 + (pickupRadius - Math.min(dist, pickupRadius)) * 2;
      const nx = dx / (dist || 1);
      const ny = dy / (dist || 1);
      this.x += (nx * speed * delta) / 1000;
      this.y += (ny * speed * delta) / 1000;
      this.graphic.setPosition(this.x, this.y);
    }

    return 0;
  }

  kill(): void {
    this.active = false;
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
  }
}
