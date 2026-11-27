import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, MATCH_DURATION_MS } from '../config/constants';
import type { BoostProgress } from '../config/meta';
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
  private readonly metaText: Phaser.GameObjects.Text;
  private readonly metaBarBg: Phaser.GameObjects.Rectangle;
  private readonly metaBarFg: Phaser.GameObjects.Rectangle;
  private readonly xpBarBg: Phaser.GameObjects.Rectangle;
  private readonly xpBarFg: Phaser.GameObjects.Rectangle;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFg: Phaser.GameObjects.Rectangle;
  private readonly characterName: string;
  private readonly desktopHint: boolean;
  private targetHpWidth = 180;
  private targetXpWidth = 0;
  private targetMetaWidth = 0;

  constructor(scene: Phaser.Scene, characterName = '守望骑士', desktopHint = true) {
    this.characterName = characterName;
    this.desktopHint = desktopHint;
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

    this.metaBarBg = scene.add.rectangle(16, 72, 180, 6, 0x000000, 0.4).setOrigin(0, 0);
    this.metaBarFg = scene.add.rectangle(16, 72, 0, 6, 0xffe66d, 1).setOrigin(0, 0);
    this.metaText = scene.add
      .text(16, 80, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#c9b46a',
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

    const moveHint = desktopHint
      ? 'WASD 移动 · 鼠标微调瞄准 · Esc 暂停 · 自动攻击'
      : '虚拟摇杆移动 · Esc 暂停 · 自动攻击';
    const hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 12, moveHint, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.7);

    this.root.add([
      this.hpBarBg,
      this.hpBarFg,
      this.xpBarBg,
      this.xpBarFg,
      this.metaBarBg,
      this.metaBarFg,
      this.hpText,
      this.levelText,
      this.metaText,
      this.timeText,
      this.killText,
      hint,
    ]);

    // Static HUD — no entrance bounce / pulsing chrome in combat.
    this.root.setAlpha(1);

    if (desktopHint) {
      this.showMouseAimTip(scene);
    }
  }

  private showMouseAimTip(scene: Phaser.Scene): void {
    // Corner tip only — never covers the player / combat center.
    const tip = scene.add
      .text(GAME_WIDTH - 14, GAME_HEIGHT - 36, '鼠标可微调瞄准', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#9fb0d0',
        backgroundColor: '#0b1020aa',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 1)
      .setScrollFactor(0)
      .setDepth(130)
      .setAlpha(0);

    scene.tweens.add({
      targets: tip,
      alpha: 0.9,
      delay: 600,
      duration: 200,
      hold: 1600,
      yoyo: true,
      onComplete: () => tip.destroy(),
    });
  }

  update(
    stats: PlayerStats,
    elapsedMs: number,
    kills: number,
    enemyCount: number,
    meta?: BoostProgress,
  ): void {
    const remain = MATCH_DURATION_MS - elapsedMs;
    this.timeText.setText(formatTime(remain));
    // Low-time pulse.
    this.timeText.setColor(remain < 60_000 ? '#ff8a8a' : COLORS.hud);
    this.hpText.setText(`${Math.ceil(stats.hp)} / ${stats.maxHp}`);
    this.levelText.setText(`${this.characterName} · Lv.${stats.level}`);
    const killTarget = meta && !meta.alreadyUnlocked ? meta.killTarget : 0;
    this.killText.setText(
      killTarget > 0
        ? `击杀 ${kills}/${killTarget} · 场上 ${enemyCount}`
        : `击杀 ${kills} · 场上 ${enemyCount}`,
    );

    const hpRatio = Phaser.Math.Clamp(stats.hp / stats.maxHp, 0, 1);
    this.targetHpWidth = 180 * hpRatio;
    this.hpBarFg.width += (this.targetHpWidth - this.hpBarFg.width) * 0.18;
    if (hpRatio < 0.3) {
      this.hpBarFg.setFillStyle(0xff6b6b, 1);
      this.hpBarBg.setScale(1, 1.35);
      this.hpBarFg.setScale(1, 1.35);
      this.hpText.setColor('#ff8a8a');
    } else {
      this.hpBarFg.setFillStyle(0x4fd1c5, 1);
      this.hpBarBg.setScale(1, 1);
      this.hpBarFg.setScale(1, 1);
      this.hpText.setColor(COLORS.hud);
    }

    const xpRatio = Phaser.Math.Clamp(stats.xp / stats.xpToNext, 0, 1);
    this.targetXpWidth = 180 * xpRatio;
    this.xpBarFg.width += (this.targetXpWidth - this.xpBarFg.width) * 0.22;

    if (meta) {
      this.metaText.setText(meta.label);
      this.targetMetaWidth = 180 * Phaser.Math.Clamp(meta.ratio, 0, 1);
      this.metaBarFg.width += (this.targetMetaWidth - this.metaBarFg.width) * 0.16;
      this.metaBarFg.setFillStyle(meta.alreadyUnlocked ? 0x7cf29c : 0xffe66d, 1);
      this.metaText.setColor(meta.alreadyUnlocked ? '#7cf29c' : '#c9b46a');
    }

    void this.desktopHint;
  }

  /** Brief HP bar flash when the player takes damage (no position jitter). */
  pulseHurt(): void {
    const scene = this.root.scene;
    scene.tweens.killTweensOf(this.hpBarFg);
    this.hpBarFg.setFillStyle(0xff6b6b, 1);
    scene.tweens.add({
      targets: this.hpBarFg,
      alpha: { from: 1, to: 0.55 },
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        const low = this.hpBarFg.width < 54;
        this.hpBarFg.setFillStyle(low ? 0xff6b6b : 0x4fd1c5, 1);
        this.hpBarFg.setAlpha(1);
      },
    });
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }
}
