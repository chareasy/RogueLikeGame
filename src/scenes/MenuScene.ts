import Phaser from 'phaser';
import { ASSET_KEYS } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, ASSET_KEYS.menuBg)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.9);

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.35)
      .setScrollFactor(0);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, '割草幸存者', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '48px',
        color: '#4fd1c5',
        fontStyle: 'bold',
        stroke: '#0b1020',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '移动躲避 · 自动攻击 · 升级三选一', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#d7e2f7',
        stroke: '#0b1020',
        strokeThickness: 3,
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
        color: '#c5d0e6',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }
}
