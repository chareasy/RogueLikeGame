import Phaser from 'phaser';
import {
  BOOST_KILL_TARGET,
  BOOST_SURVIVE_MS,
  hasStarterBoost,
  loadMeta,
} from '../config/meta';
import type { CharacterId } from '../config/characters';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { DEATH_CAUSE_LABEL, type DeathCause } from '../entities/Player';
import { pinMany, pinToScreen } from './fixUi';
import { UiMotion } from './UiMotion';

export class ResultUI {
  private readonly root: Phaser.GameObjects.Container;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;

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
    characterId?: CharacterId,
  ): void {
    this.clearKeys();
    this.root.removeAll(true);
    this.root.setVisible(true);
    this.root.setAlpha(0);

    const dim = this.scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.8)
      .setScrollFactor(0);

    const title = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 118, won ? '胜利！' : '你倒下了', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '42px',
        color: won ? '#7cf29c' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScale(0.7)
      .setScrollFactor(0);

    UiMotion.ensureAnims(this.scene);
    const emblem = this.scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 170, 'ui_energy_emblem')
      .setDisplaySize(64, 64)
      .setAlpha(0.85)
      .setScrollFactor(0);
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
      .setOrigin(0.5)
      .setScrollFactor(0);

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
      .setOrigin(0.5)
      .setScrollFactor(0);

    const unlockBits: string[] = [];
    if (unlock?.unlockedBoost) unlockBits.push('解锁：起始武器强化');
    if (unlock?.unlockedTint) unlockBits.push('解锁：金色皮肤');

    let progressHint = '继续挑战可解锁起始强化 / 皮肤';
    if (characterId && unlockBits.length === 0) {
      const meta = loadMeta();
      if (!hasStarterBoost(meta, characterId)) {
        const needKills = Math.max(0, BOOST_KILL_TARGET - kills);
        const needSec = Math.max(0, Math.ceil((BOOST_SURVIVE_MS - elapsedMs) / 1000));
        progressHint =
          needKills === 0 || needSec === 0
            ? '本局已达解锁条件之一（结算后生效）'
            : `起始强化还差：击杀 ${needKills} 或再存活 ${needSec}s（或胜利）`;
      }
    } else if (unlockBits.length > 0) {
      progressHint = unlockBits.join(' · ');
    }

    const unlockText = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, progressHint, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: unlockBits.length > 0 ? '#ffe66d' : '#9fb0d0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    if (unlockBits.length > 0) {
      const spark = this.scene.add
        .sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 4, 'ui_sparkle_sheet', 0)
        .setScale(1.3)
        .setScrollFactor(0)
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

    const goSelect = () => {
      this.clearKeys();
      this.scene.scene.start('CharacterSelectScene');
    };
    const goRetry = () => {
      this.clearKeys();
      this.scene.scene.restart();
    };

    const again = this.scene.add
      .rectangle(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 90, 180, 48, 0x4fd1c5, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const againText = this.scene.add
      .text(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 90, '换角色再战', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const retry = this.scene.add
      .rectangle(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 90, 180, 48, 0x243556, 1)
      .setStrokeStyle(2, 0x4fd1c5, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const retryText = this.scene.add
      .text(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 90, '同角色重开', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const hotkeyHint = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 138, 'Enter / R 重开 · C / 1 换角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    again.on('pointerover', () => UiMotion.popScale(this.scene, again));
    retry.on('pointerover', () => UiMotion.popScale(this.scene, retry));
    again.on('pointerdown', goSelect);
    retry.on('pointerdown', goRetry);

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
      hotkeyHint,
    ]);
    pinToScreen(this.root);
    pinMany(dim, emblem, title, causeText, stats, unlockText, again, againText, retry, retryText, hotkeyHint);

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'KeyR') {
        e.preventDefault();
        goRetry();
      } else if (e.code === 'KeyC' || e.key === '1') {
        e.preventDefault();
        goSelect();
      }
    };
    window.addEventListener('keydown', this.keyHandler);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearKeys());

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

  private clearKeys(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}
