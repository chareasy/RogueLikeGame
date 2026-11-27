import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { pinMany, pinToScreen } from './fixUi';

/**
 * Lightweight Esc pause for shareable playtests:
 * resume / restart / mute / stick / quit + controls sheet.
 */
export class PauseUI {
  private readonly root: Phaser.GameObjects.Container;
  private readonly muteLabel: Phaser.GameObjects.Text;
  private readonly stickLabel: Phaser.GameObjects.Text;
  private open = false;
  muted = false;
  stickForced = false;
  private readonly touchMode: boolean;
  private onResume: (() => void) | null = null;
  private onStickChange: ((forced: boolean) => void) | null = null;
  private onRestart: (() => void) | null = null;

  constructor(private readonly scene: Phaser.Scene, touchMode: boolean) {
    this.touchMode = touchMode;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(280);
    this.root.setVisible(false);

    const dim = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.78)
      .setScrollFactor(0)
      .setInteractive();

    const panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 420, 420, 0x121a2c, 0.96)
      .setStrokeStyle(2, 0x4fd1c5, 0.7)
      .setScrollFactor(0);

    const title = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 180, '暂停', {
        fontFamily: '"Noto Sans SC", Segoe UI, sans-serif',
        fontSize: '34px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    const goal = scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 148,
        '本局目标：存活 ≥2 分钟 / 击杀 40 / 打赢 Boss',
        {
          fontFamily: '"Noto Sans SC", Segoe UI, sans-serif',
          fontSize: '13px',
          color: '#ffe66d',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);

    const controls = scene.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2 - 122,
        this.touchMode
          ? '操作：虚拟摇杆移动 · 自动攻击 · Esc 暂停'
          : '操作：WASD 移动 · 鼠标微调瞄准 · 自动攻击 · Esc 暂停 · M 静音',
        {
          fontFamily: '"Noto Sans SC", Segoe UI, sans-serif',
          fontSize: '12px',
          color: '#9fb0d0',
          align: 'center',
          wordWrap: { width: 360 },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);

    const resume = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 78, 240, 44, '继续 (Esc)', () => {
      this.hide();
      this.onResume?.();
    });

    const restart = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 22, 240, 44, '重新开始本局', () => {
      audioDirector.playUi();
      this.hide();
      this.onRestart?.();
    });

    const muteBtn = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 34, 240, 44, '', () => {
      this.muted = !this.muted;
      audioDirector.setMuted(this.muted);
      this.refreshLabels();
      audioDirector.playUi();
    });
    this.muteLabel = muteBtn.label;

    const stickBtn = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 240, 44, '', () => {
      this.stickForced = !this.stickForced;
      this.onStickChange?.(this.stickForced);
      this.refreshLabels();
      audioDirector.playUi();
    });
    this.stickLabel = stickBtn.label;

    const quit = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 146, 240, 44, '返回选角', () => {
      audioDirector.playMenu();
      this.scene.scene.start('CharacterSelectScene');
    });

    const menu = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 202, 240, 44, '返回标题', () => {
      audioDirector.playMenu();
      this.scene.scene.start('MenuScene');
    });

    this.root.add([
      dim,
      panel,
      title,
      goal,
      controls,
      resume.bg,
      resume.label,
      restart.bg,
      restart.label,
      muteBtn.bg,
      muteBtn.label,
      stickBtn.bg,
      stickBtn.label,
      quit.bg,
      quit.label,
      menu.bg,
      menu.label,
    ]);
    pinToScreen(this.root);
    pinMany(
      dim,
      panel,
      title,
      goal,
      controls,
      resume.bg,
      resume.label,
      restart.bg,
      restart.label,
      muteBtn.bg,
      muteBtn.label,
      stickBtn.bg,
      stickBtn.label,
      quit.bg,
      quit.label,
      menu.bg,
      menu.label,
    );
    this.refreshLabels();
  }

  private makeBtn(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    onClick: () => void,
  ): { bg: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text } {
    const bg = this.scene.add
      .rectangle(x, y, w, h, 0x243556, 1)
      .setStrokeStyle(2, 0x4fd1c5, 0.9)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: '"Noto Sans SC", Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    bg.on('pointerover', () => bg.setFillStyle(0x2f4468, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x243556, 1));
    bg.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation?.();
      onClick();
    });
    return { bg, label };
  }

  private refreshLabels(): void {
    this.muteLabel.setText(this.muted ? '静音：开' : '静音：关');
    if (this.touchMode) {
      this.stickLabel.setText('摇杆：触控默认开');
    } else {
      this.stickLabel.setText(this.stickForced ? '摇杆：强制显示' : '摇杆：桌面隐藏');
    }
  }

  get isOpen(): boolean {
    return this.open;
  }

  show(handlers: {
    onResume: () => void;
    onStickChange: (forced: boolean) => void;
    onRestart?: () => void;
  }): void {
    this.onResume = handlers.onResume;
    this.onStickChange = handlers.onStickChange;
    this.onRestart = handlers.onRestart ?? null;
    this.open = true;
    this.root.setVisible(true);
    pinToScreen(this.root);
    this.refreshLabels();
  }

  hide(): void {
    this.open = false;
    this.root.setVisible(false);
  }

  toggle(handlers: {
    onResume: () => void;
    onStickChange: (forced: boolean) => void;
    onRestart?: () => void;
  }): void {
    if (this.open) {
      this.hide();
      handlers.onResume();
    } else {
      this.show(handlers);
    }
  }
}
