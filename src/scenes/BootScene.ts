import Phaser from 'phaser';
import {
  AUDIO_FILES,
  ASSET_FILES,
  UI_ASSET_IMAGES,
  UI_SPRITESHEETS,
} from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { audioDirector } from '../audio/AudioDirector';
import { UiMotion } from '../ui/UiMotion';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    // Soft radial glow behind loader.
    const glow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 90, 0x4fd1c5, 0.12);
    this.tweens.add({
      targets: glow,
      alpha: 0.28,
      scale: 1.25,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    const track = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 300, 18, 0x1a2744, 1);
    track.setStrokeStyle(2, 0x4fd1c5, 0.55);
    const bar = this.add
      .rectangle(GAME_WIDTH / 2 - 146, GAME_HEIGHT / 2, 4, 12, 0x4fd1c5, 1)
      .setOrigin(0, 0.5);

    const title = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48, '加载素材中…', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: title,
      alpha: 0.45,
      duration: 650,
      yoyo: true,
      repeat: -1,
    });

    // Spinning accent ring.
    const ring = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 42, 0x000000, 0);
    ring.setStrokeStyle(3, 0xffe66d, 0.7);
    this.tweens.add({
      targets: ring,
      angle: 360,
      duration: 1800,
      repeat: -1,
      ease: 'Linear',
    });

    this.load.on('progress', (value: number) => {
      bar.width = Math.max(4, 292 * value);
      bar.setFillStyle(value > 0.85 ? 0x7cf29c : 0x4fd1c5, 1);
    });

    for (const asset of ASSET_FILES) {
      this.load.image(asset.key, asset.path);
    }
    for (const asset of UI_ASSET_IMAGES) {
      this.load.image(asset.key, asset.path);
    }
    for (const sheet of UI_SPRITESHEETS) {
      this.load.spritesheet(sheet.key, sheet.path, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
      });
    }
    for (const audio of AUDIO_FILES) {
      this.load.audio(audio.key, audio.path);
    }
  }

  create(): void {
    audioDirector.attach(this);
    UiMotion.ensureAnims(this);
    this.cameras.main.fadeOut(220, 11, 16, 32);
    this.time.delayedCall(230, () => this.scene.start('MenuScene'));
  }
}
