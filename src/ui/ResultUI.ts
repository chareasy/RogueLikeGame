import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { DEATH_CAUSE_LABEL, type DeathCause } from '../entities/Player';

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

    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.8);

    const title = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, won ? '胜利！' : '你倒下了', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '42px',
        color: won ? '#7cf29c' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

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

    again.on('pointerdown', () => {
      this.scene.scene.start('CharacterSelectScene');
    });
    retry.on('pointerdown', () => {
      this.scene.scene.restart();
    });

    this.root.add([
      dim,
      title,
      causeText,
      stats,
      unlockText,
      again,
      againText,
      retry,
      retryText,
    ]);
  }
}
