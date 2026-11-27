import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, MATCH_DURATION_MS } from '../config/constants';
import type { PlayerStats } from '../entities/PlayerStats';

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export class Hud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly levelText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly killText: Phaser.GameObjects.Text;
  private readonly xpBarBg: Phaser.GameObjects.Rectangle;
  private readonly xpBarFg: Phaser.GameObjects.Rectangle;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFg: Phaser.GameObjects.Rectangle;
  private readonly characterName: string;

  constructor(scene: Phaser.Scene, characterName = '守望骑士') {
    this.characterName = characterName;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

    this.hpBarBg = scene.add.rectangle(16, 16, 180, 14, 0x000000, 0.45).setOrigin(0, 0);
    this.hpBarFg = scene.add.rectangle(16, 16, 180, 14, 0x4fd1c5, 1).setOrigin(0, 0);
    this.xpBarBg = scene.add.rectangle(16, 36, 180, 8, 0x000000, 0.45).setOrigin(0, 0);
    this.xpBarFg = scene.add.rectangle(16, 36, 180, 8, 0x7cf29c, 1).setOrigin(0, 0);

    this.hpText = scene.add
      .text(20, 15, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: COLORS.hud,
      })
      .setOrigin(0, 0);

    this.levelText = scene.add
      .text(16, 50, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: COLORS.hud,
      })
      .setOrigin(0, 0);

    this.timeText = scene.add
      .text(GAME_WIDTH / 2, 14, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        color: COLORS.hud,
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    this.killText = scene.add
      .text(GAME_WIDTH - 16, 16, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: COLORS.hud,
      })
      .setOrigin(1, 0);

    const hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'WASD / 方向键移动 · 自动攻击', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5, 1);

    this.root.add([
      this.hpBarBg,
      this.hpBarFg,
      this.xpBarBg,
      this.xpBarFg,
      this.hpText,
      this.levelText,
      this.timeText,
      this.killText,
      hint,
    ]);
  }

  update(stats: PlayerStats, elapsedMs: number, kills: number, enemyCount: number): void {
    const remain = MATCH_DURATION_MS - elapsedMs;
    this.timeText.setText(formatTime(remain));
    this.hpText.setText(`${Math.ceil(stats.hp)} / ${stats.maxHp}`);
    this.levelText.setText(`${this.characterName} · Lv.${stats.level}`);
    this.killText.setText(`击杀 ${kills} · 场上 ${enemyCount}`);

    const hpRatio = Phaser.Math.Clamp(stats.hp / stats.maxHp, 0, 1);
    this.hpBarFg.width = 180 * hpRatio;
    this.hpBarFg.setFillStyle(hpRatio < 0.3 ? 0xff6b6b : 0x4fd1c5, 1);

    const xpRatio = Phaser.Math.Clamp(stats.xp / stats.xpToNext, 0, 1);
    this.xpBarFg.width = 180 * xpRatio;
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }
}
