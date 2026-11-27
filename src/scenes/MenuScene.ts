import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, '割草幸存者', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '48px',
        color: '#4fd1c5',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '移动躲避 · 自动攻击 · 升级三选一', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 200, 52, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '开始割草', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const start = () => this.scene.start('GameScene');
    btn.on('pointerover', () => btn.setFillStyle(0x7eeae0, 1));
    btn.on('pointerout', () => btn.setFillStyle(0x4fd1c5, 1));
    btn.on('pointerdown', start);

    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-SPACE', start);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, 'MVP · 8 分钟 · Boss 于 6:00 出现 · Enter / 空格开始', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#6f7f9c',
      })
      .setOrigin(0.5);
  }
}
