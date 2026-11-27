import Phaser from 'phaser';
import { XpOrb } from '../entities/XpOrb';

export class XpPool {
  readonly orbs: XpOrb[] = [];

  constructor(scene: Phaser.Scene, size = 400) {
    for (let i = 0; i < size; i += 1) {
      this.orbs.push(new XpOrb(scene));
    }
  }

  spawn(x: number, y: number, value: number, autoMagnet = true): void {
    const orb = this.orbs.find((o) => !o.active);
    if (!orb) return;
    // Slight scatter so stacked kills don't overlap perfectly.
    orb.spawn(
      x + (Math.random() - 0.5) * 10,
      y + (Math.random() - 0.5) * 10,
      value,
    );
    if (autoMagnet) orb.forceMagnet();
  }

  magnetizeAll(): void {
    for (const orb of this.orbs) orb.forceMagnet();
  }
}
