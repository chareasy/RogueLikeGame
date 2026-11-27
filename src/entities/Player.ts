import Phaser from 'phaser';
import type { CharacterDef } from '../config/characters';
import { ARENA_HALF, PLAYER } from '../config/constants';
import { PlayerStats } from './PlayerStats';

export class Player {
  readonly sprite: Phaser.GameObjects.Image;
  readonly radius = PLAYER.radius;
  readonly stats = new PlayerStats();
  readonly character: CharacterDef;
  invulnUntil = 0;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  constructor(private readonly scene: Phaser.Scene, character: CharacterDef) {
    this.character = character;
    this.stats.applyCharacter(character);
    this.sprite = scene.add.image(0, 0, character.assetKey);
    this.sprite.setDepth(10);
    this.sprite.setDisplaySize(PLAYER.radius * 2.4, PLAYER.radius * 2.4);

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
    this.stats.tickRegen(delta);

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
        -ARENA_HALF + this.radius,
        ARENA_HALF - this.radius,
      );
      this.sprite.y = Phaser.Math.Clamp(
        this.sprite.y + dy * dist,
        -ARENA_HALF + this.radius,
        ARENA_HALF - this.radius,
      );
      this.sprite.setFlipX(dx < 0);
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
