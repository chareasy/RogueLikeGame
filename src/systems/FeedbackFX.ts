import Phaser from 'phaser';

/** Lightweight combat juice: floating numbers + burst dots. */
export class FeedbackFX {
  constructor(private readonly scene: Phaser.Scene) {}

  damageNumber(
    x: number,
    y: number,
    amount: number,
    crit = false,
    style: 'normal' | 'burn' = 'normal',
  ): void {
    const color =
      style === 'burn' ? (crit ? '#ffd28a' : '#ff8a5c') : crit ? '#ffe66d' : '#ffffff';
    const text = this.scene.add
      .text(x, y - 8, `${Math.round(amount)}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: crit ? '18px' : style === 'burn' ? '15px' : '14px',
        color,
        fontStyle: 'bold',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.scene.tweens.add({
      targets: text,
      y: y - 34 - Math.random() * 10,
      x: x + (Math.random() - 0.5) * 18,
      alpha: 0,
      duration: crit ? 700 : 550,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  hitBurst(x: number, y: number, color = 0xffe66d): void {
    for (let i = 0; i < 5; i += 1) {
      const dot = this.scene.add.circle(x, y, 2 + Math.random() * 2, color, 1).setDepth(39);
      const angle = Math.random() * Math.PI * 2;
      const dist = 12 + Math.random() * 22;
      this.scene.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.2,
        duration: 220 + Math.random() * 180,
        onComplete: () => dot.destroy(),
      });
    }
  }

  killBurst(x: number, y: number): void {
    this.hitBurst(x, y, 0x7cf29c);
    const ring = this.scene.add
      .circle(x, y, 6, 0x7cf29c, 0.35)
      .setStrokeStyle(2, 0xffffff, 0.7)
      .setDepth(38);
    this.scene.tweens.add({
      targets: ring,
      scale: 2.4,
      alpha: 0,
      duration: 280,
      onComplete: () => ring.destroy(),
    });
  }

  /** Brief scatter fan telegraph at the muzzle. */
  scatterFan(x: number, y: number, angle: number, spreadRad: number, count: number): void {
    const fan = this.scene.add.graphics().setDepth(7);
    fan.fillStyle(0x7cf29c, 0.18);
    fan.beginPath();
    fan.moveTo(x, y);
    const steps = Math.max(6, count * 3);
    const start = angle - spreadRad * ((count - 1) / 2);
    const end = angle + spreadRad * ((count - 1) / 2);
    const reach = 70;
    for (let i = 0; i <= steps; i += 1) {
      const a = start + ((end - start) * i) / steps;
      fan.lineTo(x + Math.cos(a) * reach, y + Math.sin(a) * reach);
    }
    fan.closePath();
    fan.fillPath();
    fan.lineStyle(2, 0x9cffb8, 0.55);
    fan.strokePath();
    this.scene.tweens.add({
      targets: fan,
      alpha: 0,
      duration: 180,
      onComplete: () => fan.destroy(),
    });
  }
}
