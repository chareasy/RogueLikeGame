import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';

export class XpOrb {
  active = false;
  x = 0;
  y = 0;
  value = 1;
  magnetized = false;
  private ageMs = 0;

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
    this.ageMs = 0;
    this.graphic.setPosition(x, y);
    this.graphic.setVisible(true);
    this.graphic.setActive(true);
  }

  forceMagnet(): void {
    if (this.active) this.magnetized = true;
  }

  update(
    delta: number,
    px: number,
    py: number,
    pickupRadius: number,
    magnetBoost = false,
  ): number {
    if (!this.active) return 0;
    this.ageMs += delta;

    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= 16) {
      this.kill();
      return this.value;
    }

    // Soft pull starts earlier; stranded gems auto-home after ~2s.
    const softRadius = pickupRadius * (magnetBoost ? 2.8 : 1.85);
    if (this.ageMs >= 2000) this.magnetized = true;
    if (dist <= softRadius || this.magnetized || magnetBoost) {
      this.magnetized = true;
      const base = magnetBoost || this.ageMs >= 2000 ? 560 : 380;
      const speed = base + Math.max(0, softRadius - dist) * 2.2;
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
    this.magnetized = false;
    this.graphic.setVisible(false);
    this.graphic.setActive(false);
  }
}
