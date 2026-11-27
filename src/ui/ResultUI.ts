import Phaser from 'phaser';
import {
  BOOST_KILL_TARGET,
  BOOST_SURVIVE_MS,
  hasStarterBoost,
  hasTintSkin,
  loadMeta,
} from '../config/meta';
import type { CharacterId } from '../config/characters';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { DEATH_CAUSE_LABEL, type DeathCause } from '../entities/Player';
import { pinMany, pinToScreen } from './fixUi';

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
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 150, won ? '胜利！' : '你倒下了', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '42px',
        color: won ? '#7cf29c' : '#ff6b6b',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const emblem = this.scene.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 200, 'ui_energy_emblem')
      .setDisplaySize(56, 56)
      .setAlpha(0.85)
      .setScrollFactor(0);

    const causeLine =
      !won && deathCause
        ? DEATH_CAUSE_LABEL[deathCause]
        : won
          ? '坚持到了最后'
          : '';

    const causeText = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 108, causeLine, {
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
        GAME_HEIGHT / 2 - 78,
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

    const metaBits: Phaser.GameObjects.GameObject[] = [];
    let headline = '继续挑战可解锁起始强化 / 皮肤';

    if (unlockBits.length > 0) {
      headline = unlockBits.join(' · ');
    } else if (characterId) {
      const meta = loadMeta();
      const boostDone = hasStarterBoost(meta, characterId);
      const tintDone = hasTintSkin(meta, characterId);

      if (!boostDone) {
        const killHave = Math.min(kills, BOOST_KILL_TARGET);
        const killNeed = Math.max(0, BOOST_KILL_TARGET - kills);
        const surviveHave = Math.min(elapsedMs, BOOST_SURVIVE_MS);
        const surviveNeedSec = Math.max(
          0,
          Math.ceil((BOOST_SURVIVE_MS - elapsedMs) / 1000),
        );
        const metKill = killNeed === 0;
        const metSurvive = surviveNeedSec === 0;
        headline =
          metKill || metSurvive
            ? '本局已达起始强化条件（结算后生效）'
            : `起始强化还差：击杀 ${killNeed} · 或再存活 ${surviveNeedSec}s · 或胜利`;

        metaBits.push(
          ...this.buildProgressRow(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 18,
            '击杀进度',
            killHave / BOOST_KILL_TARGET,
            `${killHave}/${BOOST_KILL_TARGET}`,
            0x4fd1c5,
          ),
          ...this.buildProgressRow(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 18,
            '存活进度',
            surviveHave / BOOST_SURVIVE_MS,
            `${Math.floor(surviveHave / 1000)}s / ${Math.floor(BOOST_SURVIVE_MS / 1000)}s`,
            0x7cf29c,
          ),
        );
      } else if (!tintDone) {
        headline = '起始强化已有 · 胜利该角色可解锁金色皮肤';
      } else {
        headline = '起始强化与金色皮肤均已解锁';
      }
    }

    const unlockText = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 48, headline, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: unlockBits.length > 0 ? '#ffe66d' : '#9fb0d0',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const goSelect = () => {
      this.clearKeys();
      this.scene.scene.start('CharacterSelectScene');
    };
    const goRetry = () => {
      this.clearKeys();
      this.scene.scene.restart();
    };

    const again = this.scene.add
      .rectangle(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 100, 180, 48, 0x4fd1c5, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const againText = this.scene.add
      .text(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 100, '换角色再战', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#0b1020',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const retry = this.scene.add
      .rectangle(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 100, 180, 48, 0x243556, 1)
      .setStrokeStyle(2, 0x4fd1c5, 1)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const retryText = this.scene.add
      .text(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 100, '同角色重开', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const hotkeyHint = this.scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 148, 'Enter / R 重开 · C / 1 换角色', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    again.on('pointerover', () => again.setFillStyle(0x7eeae0, 1));
    again.on('pointerout', () => again.setFillStyle(0x4fd1c5, 1));
    retry.on('pointerover', () => retry.setFillStyle(0x2f4468, 1));
    retry.on('pointerout', () => retry.setFillStyle(0x243556, 1));
    again.on('pointerdown', goSelect);
    retry.on('pointerdown', goRetry);

    this.root.add([
      dim,
      emblem,
      title,
      causeText,
      stats,
      unlockText,
      ...metaBits,
      again,
      againText,
      retry,
      retryText,
      hotkeyHint,
    ]);
    pinToScreen(this.root);
    pinMany(
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
      ...metaBits,
    );

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

    this.root.setAlpha(1);
    title.setScale(1);
  }

  private buildProgressRow(
    cx: number,
    cy: number,
    label: string,
    ratio: number,
    valueText: string,
    fillColor: number,
  ): Phaser.GameObjects.GameObject[] {
    const clamped = Phaser.Math.Clamp(ratio, 0, 1);
    const barW = 320;
    const barH = 12;
    const name = this.scene.add
      .text(cx - barW / 2 - 8, cy, label, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#9fb0d0',
      })
      .setOrigin(1, 0.5)
      .setScrollFactor(0);
    const bg = this.scene.add
      .rectangle(cx, cy, barW, barH, 0x000000, 0.45)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setStrokeStyle(1, 0x3a4f73, 0.9);
    const fg = this.scene.add
      .rectangle(cx - barW / 2, cy, Math.max(4, barW * clamped), barH - 2, fillColor, 1)
      .setOrigin(0, 0.5)
      .setScrollFactor(0);
    const value = this.scene.add
      .text(cx + barW / 2 + 8, cy, valueText, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#e8eefc',
      })
      .setOrigin(0, 0.5)
      .setScrollFactor(0);

    return [name, bg, fg, value];
  }

  private clearKeys(): void {
    if (this.keyHandler) {
      window.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}
