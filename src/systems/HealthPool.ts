import Phaser from 'phaser';
import type { Player } from '../entities/Player';

interface HealthOrb {
  active: boolean;
  x: number;
  y: number;
  heal: number;
  graphic: Phaser.GameObjects.Arc;
}

/** Lightweight green heal pickups for early-run sustain. */
export class HealthPool {
  private readonly orbs: HealthOrb[] = [];

  constructor(private readonly scene: Phaser.Scene, poolSize = 24) {
    for (let i = 0; i < poolSize; i += 1) {
      const graphic = scene.add.circle(0, 0, 8, 0x7cf29c, 0.9).setDepth(8).setVisible(false);
      graphic.setStrokeStyle(2, 0xd6ffe0, 0.95);
      this.orbs.push({ active: false, x: 0, y: 0, heal: 18, graphic });
    }
  }

  spawn(x: number, y: number, heal = 18): void {
    const orb = this.orbs.find((o) => !o.active);
    if (!orb) return;
    orb.active = true;
    orb.x = x;
    orb.y = y;
    orb.heal = heal;
    orb.graphic.setPosition(x, y).setVisible(true).setAlpha(0.95);
    this.scene.tweens.add({
      targets: orb.graphic,
      y: y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  collect(player: Player): number {
    let healed = 0;
    for (const orb of this.orbs) {
      if (!orb.active) continue;
      const dist = Phaser.Math.Distance.Between(player.x, player.y, orb.x, orb.y);
      if (dist > player.stats.pickupRadius + 8) continue;
      const before = player.stats.hp;
      player.stats.hp = Math.min(player.stats.maxHp, player.stats.hp + orb.heal);
      healed += player.stats.hp - before;
      orb.active = false;
      this.scene.tweens.killTweensOf(orb.graphic);
      orb.graphic.setVisible(false);
    }
    return healed;
  }
}
