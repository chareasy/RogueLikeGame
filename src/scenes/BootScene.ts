import Phaser from 'phaser';
import { ASSET_FILES } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 280, 16, 0x1a2744, 1);
    const bar = this.add
      .rectangle(GAME_WIDTH / 2 - 138, GAME_HEIGHT / 2, 4, 12, 0x4fd1c5, 1)
      .setOrigin(0, 0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 36, '加载素材中…', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      bar.width = Math.max(4, 276 * value);
    });

    for (const asset of ASSET_FILES) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    this.scene.start('MenuScene');
  }
}
