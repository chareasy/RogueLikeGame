import Phaser from 'phaser';
import { ARENA_HALF, COLORS, PLAYER } from '../config/constants';
import { PlayerStats } from './PlayerStats';

export class Player {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly stats = new PlayerStats();
  invulnUntil = 0;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor(private readonly scene: Phaser.Scene) {
    this.sprite = scene.add.circle(0, 0, PLAYER.radius, COLORS.player, 1);
    this.sprite.setDepth(10);
    this.sprite.setStrokeStyle(2, 0xffffff, 0.55);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  update(time: number, delta: number): void {
    let dx = 0;
    let dy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown) dx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) dx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      const dist = (this.stats.speed * delta) / 1000;
      this.sprite.x = Phaser.Math.Clamp(
        this.sprite.x + dx * dist,
        -ARENA_HALF + PLAYER.radius,
        ARENA_HALF - PLAYER.radius,
      );
      this.sprite.y = Phaser.Math.Clamp(
        this.sprite.y + dy * dist,
        -ARENA_HALF + PLAYER.radius,
        ARENA_HALF - PLAYER.radius,
      );
    }

    const flashing = time < this.invulnUntil;
    this.sprite.setAlpha(flashing ? 0.45 + 0.55 * Math.sin(time / 40) : 1);
  }

  tryHurt(amount: number, time: number): boolean {
    if (time < this.invulnUntil) return false;
    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.invulnUntil = time + PLAYER.invulnMs;
    this.scene.cameras.main.shake(80, 0.004);
    return true;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
