import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { DEATH_CAUSE_LABEL, type DeathCause } from '../entities/Player';
import { UiMotion } from './UiMotion';

export class ResultUI {
  private readonly root: Phaser.GameObjects.Container;

  constructor(private readonly scene: Phaser.Scene) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(300);
    this.root.setVisible(false);
  }

  show(
    won: boolean,
    kills: number,
    level: number,
    elapsedMs: number,
    characterName = '',
    unlock?: { unlockedBoost: boolean; unlockedTint: boolean },
    deathCause?: DeathCause,
  ): void {
    this.root.removeAll(true);
    this.root.setVisible(true);
    this.root.setAlpha(0);

    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.8);

    const title = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, won ? '胜利！' : '你倒下了', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '42px',
        color: won ? '#7cf29c' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.7);

    UiMotion.ensureAnims(this.scene);
    const emblem = this.scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, 'ui_energy_emblem')
      .setDisplaySize(64, 64)
      .setAlpha(0.85);
    this.scene.tweens.add({
      targets: emblem,
      angle: 360,
      duration: 10000,
      repeat: -1,
      ease: 'Linear',
    });

    const causeLine =
      !won && deathCause
        ? DEATH_CAUSE_LABEL[deathCause]
        : won
          ? '坚持到了最后'
          : '';

    const causeText = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 72, causeLine, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color: won ? '#9fb0d0' : '#ffb4a8',
      })
      .setOrigin(0.5);

    const mins = Math.floor(elapsedMs / 60000);
    const secs = Math.floor((elapsedMs % 60000) / 1000);
    const stats = this.scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 34,
        `${characterName ? characterName + ' · ' : ''}存活 ${mins}:${secs
          .toString()
          .padStart(2, '0')} · 等级 ${level} · 击杀 ${kills}`,
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '16px',
          color: '#e8eefc',
        },
      )
      .setOrigin(0.5);

    const unlockBits: string[] = [];
    if (unlock?.unlockedBoost) unlockBits.push('解锁：起始武器强化');
    if (unlock?.unlockedTint) unlockBits.push('解锁：金色皮肤');
    const unlockText = this.scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 + 4,
        unlockBits.length > 0 ? unlockBits.join(' · ') : '继续挑战可解锁起始强化 / 皮肤',
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '14px',
          color: unlockBits.length > 0 ? '#ffe66d' : '#9fb0d0',
        },
      )
      .setOrigin(0.5);

    if (unlockBits.length > 0) {
      const spark = this.scene.add
        .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, 'ui_sparkle_sheet', 0)
        .setScale(1.3)
        .play('ui_sparkle');
      this.root.add(spark);
      this.scene.tweens.add({
        targets: spark,
        alpha: 0,
        y: GAME_HEIGHT / 2 - 20,
        duration: 900,
        onComplete: () => spark.destroy(),
      });
    }

    const again = this.scene.add
      .rectangle(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 90, 180, 48, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    const againText = this.scene.add
      .text(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 90, '换角色再战', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const retry = this.scene.add
      .rectangle(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 90, 180, 48, 0x243556, 1)
      .setStrokeStyle(2, 0x4fd1c5, 1)
      .setInteractive({ useHandCursor: true });
    const retryText = this.scene.add
      .text(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 90, '同角色重开', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    again.on('pointerover', () => UiMotion.popScale(this.scene, again));
    retry.on('pointerover', () => UiMotion.popScale(this.scene, retry));
    again.on('pointerdown', () => {
      this.scene.scene.start('CharacterSelectScene');
    });
    retry.on('pointerdown', () => {
      this.scene.scene.restart();
    });

    this.root.add([
      dim,
      emblem,
      title,
      causeText,
      stats,
      unlockText,
      again,
      againText,
      retry,
      retryText,
    ]);

    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 280,
      ease: 'Cubic.easeOut',
    });
    this.scene.tweens.add({
      targets: title,
      scale: 1,
      duration: 420,
      ease: 'Back.easeOut',
    });
    UiMotion.pulseButton(this.scene, [again, againText]);
  }
}
