import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

/**
 * Shared UI motion helpers — keep screens lively without cluttering combat.
 */
export class UiMotion {
  static ensureAnims(scene: Phaser.Scene): void {
    if (!scene.anims.exists('ui_sparkle')) {
      scene.anims.create({
        key: 'ui_sparkle',
        frames: scene.anims.generateFrameNumbers('ui_sparkle_sheet', { start: 0, end: 11 }),
        frameRate: 16,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('ui_xp_orb')) {
      scene.anims.create({
        key: 'ui_xp_orb',
        frames: scene.anims.generateFrameNumbers('ui_xp_orb_sheet', { start: 0, end: 9 }),
        frameRate: 12,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('ui_motes')) {
      scene.anims.create({
        key: 'ui_motes',
        frames: scene.anims.generateFrameNumbers('ui_motes_sheet', { start: 0, end: 19 }),
        frameRate: 10,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('ui_slash')) {
      scene.anims.create({
        key: 'ui_slash',
        frames: scene.anims.generateFrameNumbers('ui_slash_sheet', { start: 0, end: 5 }),
        frameRate: 14,
        repeat: -1,
      });
    }
  }

  /** Soft floating motes + sparkles for menu / select screens. */
  static addAmbientField(scene: Phaser.Scene, depth = 8): Phaser.GameObjects.Container {
    this.ensureAnims(scene);
    const root = scene.add.container(0, 0).setDepth(depth).setScrollFactor(0);

    for (let i = 0; i < 5; i += 1) {
      const mote = scene.add
        .sprite(
          80 + Math.random() * (GAME_WIDTH - 160),
          60 + Math.random() * (GAME_HEIGHT - 120),
          'ui_motes_sheet',
          0,
        )
        .setAlpha(0.35 + Math.random() * 0.25)
        .setScale(0.7 + Math.random() * 0.6)
        .play('ui_motes');
      root.add(mote);
      scene.tweens.add({
        targets: mote,
        y: mote.y - (30 + Math.random() * 50),
        x: mote.x + (Math.random() * 40 - 20),
        duration: 4200 + Math.random() * 2200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    for (let i = 0; i < 4; i += 1) {
      const spark = scene.add
        .sprite(
          100 + Math.random() * (GAME_WIDTH - 200),
          80 + Math.random() * (GAME_HEIGHT - 160),
          'ui_sparkle_sheet',
          0,
        )
        .setAlpha(0.55)
        .setScale(0.55 + Math.random() * 0.35)
        .play('ui_sparkle');
      root.add(spark);
      scene.tweens.add({
        targets: spark,
        alpha: { from: 0.25, to: 0.7 },
        scale: { from: 0.45, to: 0.75 },
        duration: 900 + Math.random() * 600,
        yoyo: true,
        repeat: -1,
      });
    }

    return root;
  }

  static pulseButton(
    scene: Phaser.Scene,
    targets: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  ): void {
    scene.tweens.add({
      targets,
      scaleX: 1.045,
      scaleY: 1.045,
      duration: 780,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static floatIn(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    fromY = 24,
    delay = 0,
    duration = 420,
  ): void {
    const any = target as unknown as {
      setAlpha?: (v: number) => void;
      y?: number;
    };
    any.setAlpha?.(0);
    if (typeof any.y === 'number') any.y += fromY;
    scene.tweens.add({
      targets: target,
      alpha: 1,
      y: '-=' + fromY,
      delay,
      duration,
      ease: 'Cubic.easeOut',
    });
  }

  static staggerIn(
    scene: Phaser.Scene,
    items: Phaser.GameObjects.GameObject[],
    gap = 70,
    fromY = 36,
  ): void {
    items.forEach((item, i) => this.floatIn(scene, item, fromY, i * gap));
  }

  static breatheTitle(scene: Phaser.Scene, title: Phaser.GameObjects.Text): void {
    scene.tweens.add({
      targets: title,
      scale: 1.03,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Subtle ken-burns on a full-bleed background image. */
  static kenBurns(scene: Phaser.Scene, image: Phaser.GameObjects.Image): void {
    image.setScale(image.scaleX * 1.08);
    scene.tweens.add({
      targets: image,
      scaleX: image.scaleX * 1.12,
      scaleY: image.scaleY * 1.12,
      x: image.x + 12,
      duration: 14000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  static popScale(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject,
    peak = 1.12,
  ): void {
    scene.tweens.add({
      targets: target,
      scaleX: peak,
      scaleY: peak,
      duration: 120,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }
}
