import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { ASSET_KEYS } from '../config/assets';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    audioDirector.attach(this);
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
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, '多角色 · 多武器技能 · 更丰富怪潮', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#d7e2f7',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const btn = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 220, 52, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '选择角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const unlockAndStart = () => {
      audioDirector.unlock();
      audioDirector.playUi();
      audioDirector.playMenu();
      this.scene.start('CharacterSelectScene');
    };

    // Unlock audio on first interaction with the page.
    this.input.once('pointerdown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });
    this.input.keyboard?.once('keydown', () => {
      audioDirector.unlock();
      audioDirector.playMenu();
    });

    btn.on('pointerover', () => btn.setFillStyle(0x7eeae0, 1));
    btn.on('pointerout', () => btn.setFillStyle(0x4fd1c5, 1));
    btn.on('pointerdown', unlockAndStart);

    this.input.keyboard?.once('keydown-ENTER', unlockAndStart);
    this.input.keyboard?.once('keydown-SPACE', unlockAndStart);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 28, '点击或按键开启音效 · Enter / 空格继续', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#c5d0e6',
        stroke: '#0b1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
  }

  update(_time: number, delta: number): void {
    audioDirector.update(delta);
  }
}
