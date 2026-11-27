import Phaser from 'phaser';
import { audioDirector } from '../audio/AudioDirector';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';

export interface PauseOptions {
  muted: boolean;
  stickForced: boolean;
  touchMode: boolean;
}

/**
 * Lightweight Esc pause: resume / mute / stick toggle / quit to select.
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

  constructor(private readonly scene: Phaser.Scene, touchMode: boolean) {
    this.touchMode = touchMode;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(280);
    this.root.setVisible(false);

    const dim = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x050814, 0.72);

    const title = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, '暂停', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '36px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const resume = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 220, 44, '继续 (Esc)', () => {
      this.hide();
      this.onResume?.();
    });

    const muteBtn = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, 220, 44, '', () => {
      this.muted = !this.muted;
      audioDirector.setMuted(this.muted);
      this.refreshLabels();
      audioDirector.playUi();
    });
    this.muteLabel = muteBtn.label;

    const stickBtn = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 220, 44, '', () => {
      this.stickForced = !this.stickForced;
      this.onStickChange?.(this.stickForced);
      this.refreshLabels();
      audioDirector.playUi();
    });
    this.stickLabel = stickBtn.label;

    const quit = this.makeBtn(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 140, 220, 44, '返回选角', () => {
      audioDirector.playMenu();
      this.scene.scene.start('CharacterSelectScene');
    });

    const hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 200, 'Esc 暂停/继续 · M 静音', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#9fb0d0',
      })
      .setOrigin(0.5);

    this.root.add([
      dim,
      title,
      resume.bg,
      resume.label,
      muteBtn.bg,
      muteBtn.label,
      stickBtn.bg,
      stickBtn.label,
      quit.bg,
      quit.label,
      hint,
    ]);
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
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(x, y, text, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        color: '#e8eefc',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    bg.on('pointerover', () => bg.setFillStyle(0x2f4468, 1));
    bg.on('pointerout', () => bg.setFillStyle(0x243556, 1));
    bg.on('pointerdown', onClick);
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
  }): void {
    this.onResume = handlers.onResume;
    this.onStickChange = handlers.onStickChange;
    this.open = true;
    this.root.setVisible(true);
    this.refreshLabels();
  }

  hide(): void {
    this.open = false;
    this.root.setVisible(false);
  }

  toggle(handlers: {
    onResume: () => void;
    onStickChange: (forced: boolean) => void;
  }): void {
    if (this.open) {
      this.hide();
      handlers.onResume();
    } else {
      this.show(handlers);
    }
  }
}
