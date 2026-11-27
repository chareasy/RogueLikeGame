import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/constants';

/**
 * Touch virtual stick (bottom-left). Hidden on fine-pointer / desktop.
 */
export class VirtualJoystick {
  private readonly base: Phaser.GameObjects.Arc;
  private readonly thumb: Phaser.GameObjects.Arc;
  private readonly originX: number;
  private readonly originY: number;
  private readonly maxRadius = 54;
  private activePointerId: number | null = null;
  private dx = 0;
  private dy = 0;
  /** True when device reports coarse pointer (touch-first). */
  readonly touchMode: boolean;
  /** Pause-menu override to show stick on desktop. */
  forceVisible = false;
  enabled = true;

  constructor(private readonly scene: Phaser.Scene) {
    this.originX = 88;
    this.originY = GAME_HEIGHT - 88;

    this.touchMode =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(pointer: coarse)').matches;

    this.base = scene.add
      .circle(this.originX, this.originY, this.maxRadius, 0x1a2744, 0.45)
      .setStrokeStyle(2, 0x4fd1c5, 0.55)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive();

    this.thumb = scene.add
      .circle(this.originX, this.originY, 22, 0x4fd1c5, 0.7)
      .setScrollFactor(0)
      .setDepth(121);

    // Desktop: hide entirely so WASD / mouse aim stay primary.
    // Also disable hit area — a leftover interactive disc can look like a "stick".
    if (!this.touchMode) {
      this.base.disableInteractive();
      this.base.setVisible(false).setAlpha(0).setActive(false);
      this.thumb.setVisible(false).setAlpha(0).setActive(false);
      this.enabled = false;
    } else {
      this.base.setAlpha(0.55);
      this.thumb.setAlpha(0.75);
    }

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off('pointerdown', this.onDown, this);
      scene.input.off('pointermove', this.onMove, this);
      scene.input.off('pointerup', this.onUp, this);
    });
  }

  get vector(): { x: number; y: number } {
    return { x: this.dx, y: this.dy };
  }

  get active(): boolean {
    return this.activePointerId !== null && (this.dx !== 0 || this.dy !== 0);
  }

  private stickAllowed(): boolean {
    return this.touchMode || this.forceVisible;
  }

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (!this.stickAllowed() || !this.enabled || this.activePointerId !== null) return;
    const dist = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.originX,
      this.originY,
    );
    const touchLeft = pointer.x < this.scene.scale.width * 0.42;
    if (dist > this.maxRadius * 1.6 && !touchLeft) return;
    this.activePointerId = pointer.id;
    this.updateThumb(pointer.x, pointer.y);
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.updateThumb(pointer.x, pointer.y);
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.activePointerId) return;
    this.activePointerId = null;
    this.dx = 0;
    this.dy = 0;
    this.thumb.setPosition(this.originX, this.originY);
  }

  private updateThumb(px: number, py: number): void {
    let dx = px - this.originX;
    let dy = py - this.originY;
    const len = Math.hypot(dx, dy) || 1;
    if (len > this.maxRadius) {
      dx = (dx / len) * this.maxRadius;
      dy = (dy / len) * this.maxRadius;
    }
    this.thumb.setPosition(this.originX + dx, this.originY + dy);
    this.dx = dx / this.maxRadius;
    this.dy = dy / this.maxRadius;
  }

  setForceVisible(forced: boolean): void {
    this.forceVisible = forced;
    if (forced) {
      this.enabled = true;
      this.base.setActive(true).setVisible(true).setAlpha(0.5);
      this.base.setInteractive();
      this.thumb.setActive(true).setVisible(true).setAlpha(0.7);
    } else if (!this.touchMode) {
      this.enabled = false;
      this.base.disableInteractive();
      this.base.setVisible(false).setActive(false);
      this.thumb.setVisible(false).setActive(false);
      this.dx = 0;
      this.dy = 0;
    }
  }

  setVisible(visible: boolean): void {
    if (!this.stickAllowed()) {
      this.base.disableInteractive();
      this.base.setVisible(false).setActive(false);
      this.thumb.setVisible(false).setActive(false);
      return;
    }
    this.base.setVisible(visible);
    this.thumb.setVisible(visible);
  }
}
